const db = require('../database/mongodb');
const { newToken } = require('../models/order.model');
const { sendInviteEmail } = require('../utils/mail.utils');
const bcrypt = require('../utils/bcrypt.utils');

const roles = ['admin', 'hosstess', 'waiter'];

async function list(req, res) {
  try {
    return res.status(200).json(await db.GetInvites());
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al listar invitaciones');
  }
}

async function create(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = req.body?.role || 'hosstess';
    if (!email || !email.includes('@')) {
      return res.status(400).send('Email inválido');
    }
    if (!roles.includes(role)) {
      return res.status(400).send('Rol inválido');
    }

    const existingUser = await db.FindUserByEmail(email);
    if (existingUser) {
      return res.status(400).send('Ya existe un usuario con ese correo');
    }

    const settings = await db.GetSettings();
    const token = newToken();
    const invite = await db.CreateInvite({
      email,
      role,
      token,
      status: 'pending',
      invitedBy: req.body?.invitedBy || 'admin',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const inviteUrl = `${appUrl}/invite/${token}`;
    const mail = await sendInviteEmail({
      to: email,
      inviteUrl,
      role,
      businessName: settings?.businessName,
    });

    return res.status(201).json({ ...invite, mail });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al crear invitación');
  }
}

async function revoke(req, res) {
  try {
    const updated = await db.UpdateInvite(req.params.id, {
      status: 'revoked',
      updatedAt: new Date(),
    });
    if (!updated) return res.status(404).send('Invitación no encontrada');
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al revocar invitación');
  }
}

async function remove(req, res) {
  try {
    const result = await db.DeleteInvite(req.params.id);
    if (!result.deletedCount) return res.status(404).send('Invitación no encontrada');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al eliminar invitación');
  }
}

async function getByToken(req, res) {
  try {
    const invite = await db.GetInviteByToken(req.params.token);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).send('Invitación no válida');
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(410).send('Invitación expirada');
    }
    return res.status(200).json({
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al obtener invitación');
  }
}

async function accept(req, res) {
  try {
    const { token, name, lastName, username, password, cellphone } = req.body || {};
    if (!token || !name || !lastName || !username || !password) {
      return res.status(400).send('Faltan campos requeridos');
    }

    const invite = await db.GetInviteByToken(token);
    if (!invite || invite.status !== 'pending') {
      return res.status(404).send('Invitación no válida');
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(410).send('Invitación expirada');
    }

    const existingEmail = await db.FindUserByEmail(invite.email);
    if (existingEmail) {
      return res.status(400).send('El correo ya está registrado');
    }
    const existingUser = await db.FindUserByUsername(username);
    if (existingUser) {
      return res.status(400).send('El usuario ya existe');
    }

    const hashed = await bcrypt.hashPassword(password);
    await db.CreateUser({
      name,
      lastName,
      email: invite.email,
      username,
      password: hashed,
      cellphone: String(cellphone || '0000000000').replace(/\D/g, '').slice(0, 10) || '0000000000',
      role: invite.role === 'waiter' ? 'hosstess' : invite.role,
    });

    if (invite.role === 'waiter') {
      await db.AddWaiter({
        name,
        lastName,
        birthDate: new Date(),
        startDate: new Date(),
        cellphone: String(cellphone || Date.now()).replace(/\D/g, '').slice(0, 10).padEnd(10, '0'),
        mesa: [],
        role: 'waiter',
        workSchedule: 'morning',
        status: 'rest',
      });
    }

    await db.UpdateInvite(String(invite.id || invite._id), {
      status: 'accepted',
      acceptedAt: new Date(),
    });

    return res.status(201).json({ ok: true, email: invite.email });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al aceptar invitación');
  }
}

module.exports = { list, create, revoke, remove, getByToken, accept };
