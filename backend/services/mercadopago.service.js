/**
 * Mercado Pago Preapproval (suscripciones) — con fallback mock sin token.
 */
const {
  PLANS,
  planPrice,
  planLabel,
  planAiQuota,
  formatAiQuota,
  listPlans: catalogList,
} = require('./plans.catalog');

const MP_API = 'https://api.mercadopago.com';

function hasMpConfig() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function listPlans() {
  return catalogList(process.env.MP_CURRENCY || 'MXN');
}

async function createPreapproval({
  plan,
  tenantId,
  payerEmail,
  externalReference,
  interval = 'month',
}) {
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const apiUrl = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8081}`).replace(
    /\/$/,
    ''
  );
  const billingInterval = interval === 'year' ? 'year' : 'month';
  const amount = planPrice(plan, billingInterval);
  const currency = process.env.MP_CURRENCY || 'MXN';
  const ref = externalReference || `${tenantId}:${plan}:${billingInterval}`;

  if (!hasMpConfig()) {
    return {
      mock: true,
      id: `mock_${tenantId}_${plan}_${billingInterval}_${Date.now()}`,
      init_point: `${appUrl}/billing?mock=1&plan=${plan}&interval=${billingInterval}`,
      sandbox_init_point: `${appUrl}/billing?mock=1&plan=${plan}&interval=${billingInterval}`,
      status: 'pending',
      amount,
      interval: billingInterval,
    };
  }

  const autoRecurring =
    billingInterval === 'year'
      ? {
          frequency: 1,
          frequency_type: 'years',
          transaction_amount: amount,
          currency_id: currency,
        }
      : {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: amount,
          currency_id: currency,
        };

  const body = {
    reason: planLabel(plan, billingInterval),
    external_reference: ref,
    payer_email: payerEmail,
    auto_recurring: autoRecurring,
    back_url: `${appUrl}/billing?mp=return`,
    status: 'pending',
    notification_url: `${apiUrl}/billing/webhook`,
  };

  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `Mercado Pago error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

async function getPreapproval(id) {
  if (!hasMpConfig() || String(id).startsWith('mock_')) {
    return { id, status: 'authorized' };
  }
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'No se pudo leer preapproval');
    err.status = res.status;
    throw err;
  }
  return data;
}

function mapMpStatusToBilling(mpStatus) {
  const s = String(mpStatus || '').toLowerCase();
  if (s === 'authorized' || s === 'active') return 'active';
  if (s === 'paused') return 'past_due';
  if (s === 'cancelled' || s === 'canceled') return 'suspended';
  return null;
}

module.exports = {
  PLANS,
  hasMpConfig,
  planPrice,
  planLabel,
  planAiQuota,
  formatAiQuota,
  listPlans,
  createPreapproval,
  getPreapproval,
  mapMpStatusToBilling,
};
