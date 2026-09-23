const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const db = require('../database/mongodb');
const { sendMail } = require('../utils/mail.utils');
const templates = require('../utils/mail-templates');

const SYNC_MS = 25_000;
let lastSync = 0;
let syncing = null;

function mailboxAddress() {
  const raw = String(process.env.MAIL_FROM || process.env.SMTP_USER || '');
  const angled = raw.match(/<([^>]+)>/);
  return (angled ? angled[1] : raw).trim().toLowerCase();
}

function canReadInbox() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function clip(value, max = 6000) {
  const text = String(value || '').replace(/\s+\n/g, '\n').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function addressList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item.address || item || '').trim().toLowerCase())
    .filter((email) => email.includes('@'));
}

async function clientDirectory() {
  const tenants = await db.ListTenants();
  const byEmail = new Map();
  await Promise.all(
    tenants.map(async (tenant) => {
      const users = await db.ListUsersByTenant(tenant.id);
      for (const user of users) {
        const email = String(user.email || '').trim().toLowerCase();
        if (email.includes('@')) byEmail.set(email, tenant.id);
      }
    })
  );
  return byEmail;
}

async function rememberMessage(doc) {
  await db.SaveSupportMail(doc);
}

async function pullInbox() {
  if (!canReadInbox()) return { ok: false, reason: 'sin buzón' };
  const ours = mailboxAddress();
  const directory = await clientDirectory();
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date();
    since.setDate(since.getDate() - 45);
    const uids = await client.search({ since });
    const recent = (uids || []).slice(-30);
    if (!recent.length) return { ok: true, added: 0 };

    let added = 0;
    for await (const msg of client.fetch(recent, { envelope: true, source: true, uid: true })) {
      const parsed = await simpleParser(msg.source);
      const messageId = String(parsed.messageId || msg.envelope?.messageId || `uid-${msg.uid}`).trim();
      const from = addressList(parsed.from?.value)[0] || '';
      const to = addressList(parsed.to?.value).join(', ');
      const participants = [from, ...addressList(parsed.to?.value)].filter((email) => email && email !== ours);
      const tenantId = participants.map((email) => directory.get(email)).find(Boolean) || null;
      const direction = from === ours ? 'out' : 'in';
      await rememberMessage({
        messageId,
        tenantId,
        direction,
        from,
        to,
        subject: clip(parsed.subject || msg.envelope?.subject || '(sin asunto)', 180),
        text: clip(parsed.text || ''),
        at: parsed.date || msg.envelope?.date || new Date(),
      });
      added += 1;
    }
    return { ok: true, added };
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

async function syncInbox() {
  const now = Date.now();
  if (now - lastSync < SYNC_MS) return { ok: true, cached: true };
  if (syncing) return syncing;
  syncing = pullInbox()
    .then((result) => {
      lastSync = Date.now();
      return result;
    })
    .catch((err) => {
      console.error('[soporte] No pude leer la bandeja:', err.message);
      return { ok: false, reason: 'No pude leer los correos que te mandaron. Revisa que Gmail tenga IMAP activo.' };
    })
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

async function threadFor(tenantId) {
  const sync = await syncInbox();
  const messages = await db.ListSupportMail(tenantId);
  return { messages, inboxError: sync.ok ? '' : sync.reason || '' };
}

async function sendToClient({ tenantId, to, subject, message, storeName }) {
  const recipient = String(to || '').trim().toLowerCase();
  const title = String(subject || '').trim();
  const body = String(message || '').trim();
  if (!recipient.includes('@')) {
    const err = new Error('Ese cliente no tiene un correo.');
    err.status = 400;
    throw err;
  }
  if (title.length < 2 || body.length < 2) {
    const err = new Error('Escribe el asunto y el mensaje.');
    err.status = 400;
    throw err;
  }

  const built = templates.supportReplyEmail({ storeName, message: body });
  const sent = await sendMail({
    to: recipient,
    subject: title,
    html: built.html,
  });
  await rememberMessage({
    messageId: sent.id || `local-${Date.now()}-${recipient}`,
    tenantId: String(tenantId),
    direction: 'out',
    from: mailboxAddress(),
    to: recipient,
    subject: title,
    text: body,
    at: new Date(),
  });
  return threadFor(tenantId);
}

async function unmatchedInbox() {
  const sync = await syncInbox();
  return {
    messages: await db.ListUnmatchedSupportMail(),
    inboxError: sync.ok ? '' : sync.reason || '',
  };
}

module.exports = {
  threadFor,
  sendToClient,
  unmatchedInbox,
};
