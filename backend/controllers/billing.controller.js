const db = require('../database/mongodb');
const mp = require('../services/mercadopago.service');
const { PLANS, isSubscriptionActive, trialEndsFrom } = require('../models/tenant.model');

function daysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function periodEndFor(interval) {
  const periodEnd = new Date();
  if (interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);
  return periodEnd;
}

async function applyPreapprovalToTenant(tenant, pre, dataId) {
  const billingStatus = mp.mapMpStatusToBilling(pre.status);
  if (!tenant || !billingStatus) return null;

  const patch = {
    billingStatus,
    mpPreapprovalId: String(dataId || pre.id || tenant.mpPreapprovalId || ''),
  };

  if (billingStatus === 'active') {
    const parts = String(pre.external_reference || '').split(':');
    const plan = parts[1];
    const interval = parts[2] === 'year' ? 'year' : 'month';
    patch.currentPeriodEnd = periodEndFor(interval);
    patch.billingInterval = interval;
    patch.suspendedAt = null;
    patch.suspendedReason = null;
    if (PLANS.includes(plan)) patch.plan = plan;
  }
  if (billingStatus === 'suspended') {
    patch.suspendedAt = new Date();
    patch.suspendedReason = 'mercado_pago';
  }

  return db.UpdateTenant(tenant.id, patch);
}

async function getPlans(req, res) {
  return res.status(200).json({
    plans: mp.listPlans(),
    mock: !mp.hasMpConfig(),
    sandbox: mp.hasMpConfig() ? mp.isMpSandbox() : false,
  });
}

async function getStatus(req, res) {
  try {
    const tenant = await db.GetTenantById(req.tenantId);
    if (!tenant) return res.status(404).send('Tenant no encontrado');
    const plan = tenant.plan || 'basic';
    return res.status(200).json({
      plan,
      billingInterval: tenant.billingInterval || 'month',
      billingStatus: tenant.billingStatus || 'trialing',
      trialEndsAt: tenant.trialEndsAt || null,
      trialDaysLeft: daysLeft(tenant.trialEndsAt),
      currentPeriodEnd: tenant.currentPeriodEnd || null,
      active: isSubscriptionActive(tenant),
      mpConfigured: mp.hasMpConfig(),
      mpSandbox: mp.hasMpConfig() ? mp.isMpSandbox() : false,
      mpPreapprovalId: tenant.mpPreapprovalId || null,
      mpPayerEmail: tenant.mpPayerEmail || null,
      aiQuota: mp.planAiQuota(plan),
      aiQuotaLabel: mp.formatAiQuota(mp.planAiQuota(plan)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al leer facturación');
  }
}

async function checkout(req, res) {
  try {
    const plan = String(req.body?.plan || 'basic');
    const interval = String(req.body?.interval || 'month') === 'year' ? 'year' : 'month';
    if (!PLANS.includes(plan)) {
      return res.status(400).send('plan debe ser basic, growth o pro');
    }

    const tenant = await db.GetTenantById(req.tenantId);
    if (!tenant) return res.status(404).send('Tenant no encontrado');

    const payerEmail =
      String(req.body?.email || '').trim() ||
      tenant.mpPayerEmail ||
      null;

    let email = payerEmail;
    if (!email && mp.isMpSandbox() && process.env.MP_TEST_PAYER_EMAIL) {
      email = String(process.env.MP_TEST_PAYER_EMAIL).trim();
    }
    if (!email) {
      const user = await db.FindUserByUsername(req.user.username);
      email = user?.email || null;
    }
    if (!email) {
      return res
        .status(400)
        .send(
          mp.isMpSandbox()
            ? 'En modo prueba indica el email del usuario Comprador (Cuentas de prueba en Mercado Pago).'
            : 'Necesitamos un correo para cobrar en Mercado Pago.'
        );
    }

    if (mp.isMpSandbox()) {
      const looksPersonal =
        /@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me)\./i.test(email) ||
        email === 'madgrismad@gmail.com';
      // No bloqueamos del todo (a veces MP da @testuser.com), pero avisamos en logs
      if (looksPersonal) {
        console.warn(
          '[mp] Sandbox con email personal:',
          email,
          '— MP suele exigir usuario de prueba (Comprador).'
        );
      }
    }

    const preapproval = await mp.createPreapproval({
      plan,
      tenantId: req.tenantId,
      payerEmail: email,
      interval,
      externalReference: `${req.tenantId}:${plan}:${interval}`,
    });

    await db.UpdateTenant(req.tenantId, {
      plan,
      billingInterval: interval,
      mpPreapprovalId: preapproval.id || null,
      mpPayerEmail: email,
    });

    return res.status(200).json({
      mock: Boolean(preapproval.mock),
      preapprovalId: preapproval.id,
      interval,
      amount: preapproval.amount || mp.planPrice(plan, interval),
      init_point: preapproval.init_point || preapproval.sandbox_init_point,
      sandbox_init_point: preapproval.sandbox_init_point || preapproval.init_point,
      sandbox: mp.isMpSandbox(),
      localReturn: Boolean(preapproval.localReturn),
    });
  } catch (err) {
    console.error(err);
    let msg = err.message || 'Error al crear checkout';
    if (/payer|collector/i.test(msg)) {
      msg =
        'En modo prueba, pagador y cobrador deben ser usuarios de prueba de Mercado Pago. Crea un Comprador en «Cuentas de prueba» y usa ese correo (no tu Gmail).';
    }
    return res.status(err.status || 500).send(msg);
  }
}

/** Solo desarrollo: activar plan sin Mercado Pago */
async function devActivate(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).send('Not found');
    }
    const plan = String(req.body?.plan || 'basic');
    const interval = String(req.body?.interval || 'month') === 'year' ? 'year' : 'month';
    if (!PLANS.includes(plan)) {
      return res.status(400).send('plan debe ser basic, growth o pro');
    }

    const updated = await db.UpdateTenant(req.tenantId, {
      plan,
      billingInterval: interval,
      billingStatus: 'active',
      currentPeriodEnd: periodEndFor(interval),
      suspendedAt: null,
      suspendedReason: null,
      mpPreapprovalId: req.body?.preapprovalId || `mock_dev_${Date.now()}`,
    });

    return res.status(200).json({
      ok: true,
      plan: updated.plan,
      billingInterval: interval,
      billingStatus: updated.billingStatus,
      currentPeriodEnd: updated.currentPeriodEnd,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al activar');
  }
}

/**
 * Tras volver de Mercado Pago (?mp=return), consulta el preapproval
 * y actualiza el tenant. Útil en local sin webhook público.
 */
async function sync(req, res) {
  try {
    const tenant = await db.GetTenantById(req.tenantId);
    if (!tenant) return res.status(404).send('Tenant no encontrado');

    const preapprovalId =
      String(req.body?.preapprovalId || '').trim() || tenant.mpPreapprovalId;

    if (!preapprovalId) {
      return res.status(400).send('No hay suscripción de Mercado Pago pendiente');
    }

    if (!mp.hasMpConfig()) {
      return res.status(400).send('Mercado Pago no está configurado');
    }

    const pre = await mp.getPreapproval(preapprovalId);
    const updated = await applyPreapprovalToTenant(tenant, pre, preapprovalId);

    return res.status(200).json({
      ok: true,
      mpStatus: pre.status,
      billingStatus: updated?.billingStatus || tenant.billingStatus,
      plan: updated?.plan || tenant.plan,
      active: isSubscriptionActive(updated || tenant),
      pending: String(pre.status || '').toLowerCase() === 'pending',
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).send(err.message || 'Error al sincronizar pago');
  }
}

async function webhook(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const topic = body.type || body.topic || query.topic || query.type;
    const dataId =
      body.data?.id ||
      body.id ||
      query.id ||
      query['data.id'] ||
      null;

    console.log('[mp:webhook]', { topic, dataId, query, bodyKeys: Object.keys(body) });

    const topicStr = String(topic || '').toLowerCase();
    const isPreapproval =
      topicStr.includes('preapproval') || topicStr.includes('subscription');

    if (dataId && isPreapproval) {
      const pre = await mp.getPreapproval(dataId);
      let tenant = (await db.GetTenantByMpPreapprovalId(dataId)) || null;

      if (!tenant && pre.external_reference) {
        const tenantId = String(pre.external_reference).split(':')[0];
        tenant = await db.GetTenantById(tenantId);
      }

      if (tenant) {
        await applyPreapprovalToTenant(tenant, pre, dataId);
      } else {
        console.warn('[mp:webhook] tenant no encontrado para', dataId, pre.external_reference);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('MP webhook error:', err.message);
    return res.status(200).json({ ok: false });
  }
}

module.exports = {
  getPlans,
  getStatus,
  checkout,
  sync,
  devActivate,
  webhook,
  daysLeft,
  trialEndsFrom,
};
