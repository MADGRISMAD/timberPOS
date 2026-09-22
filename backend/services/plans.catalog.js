/**
 * Catálogo comercial Timber POS (MXN) — SaaS 100% nube.
 * Inventario Mágico = actualización de precios/catálogo con IA (cuotas por plan).
 */
const PLANS = ['basic', 'growth', 'pro'];

/** null = ilimitado (uso justo) */
const AI_QUOTAS = {
  basic: 2,
  growth: 10,
  pro: null,
};

const PLAN_CATALOG = {
  basic: {
    id: 'basic',
    name: 'Básico',
    tagline: 'Entra desde cualquier pantalla y cobra',
    pitch: 'Se daña la PC del cajero? Abres Timber en una tablet o el celular y sigues vendiendo al instante.',
    priceMonth: Number(process.env.MP_PLAN_BASIC_PRICE || 150),
    priceYear: Number(process.env.MP_PLAN_BASIC_YEAR_PRICE || 1500),
    aiQuota: AI_QUOTAS.basic,
    highlight: false,
    features: [
      'Celular, tablet o PC en el navegador',
      'Sin instalar nada',
      'Tu inventario y ventas viven en la nube',
      '2 actualizaciones con Inventario Mágico al mes',
      'Tickets 80 mm · 1 sucursal',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Crecimiento',
    tagline: 'Pedidos y cobro donde estés',
    pitch: 'WhatsApp, delivery y cobro en pasillo — todo en la misma caja web.',
    priceMonth: Number(process.env.MP_PLAN_GROWTH_PRICE || 399),
    priceYear: Number(process.env.MP_PLAN_GROWTH_YEAR_PRICE || 3990),
    aiQuota: AI_QUOTAS.growth,
    highlight: true,
    badge: 'Recomendado',
    features: [
      'Todo lo del Básico',
      '10 actualizaciones con Inventario Mágico al mes',
      'Pedidos de WhatsApp y delivery en una pantalla',
      'Cobra desde el celular en el pasillo',
      'Mejoras nuevas al refrescar la página',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Varias sucursales, un solo tablero',
    pitch: 'Foto a la factura del camión: la IA en la nube actualiza costos y precios. Imposible en una PC vieja local.',
    priceMonth: Number(process.env.MP_PLAN_PRO_PRICE || 799),
    priceYear: Number(process.env.MP_PLAN_PRO_YEAR_PRICE || 7990),
    aiQuota: AI_QUOTAS.pro,
    highlight: false,
    features: [
      'Todo lo de Crecimiento',
      'Inventario Mágico ilimitado',
      'Lee facturas de proveedores con la cámara',
      'Tablero en vivo de todas tus sucursales',
      'Hardware de caja si lo necesitas',
    ],
  },
};

function getPlan(planId) {
  return PLAN_CATALOG[planId] || null;
}

function planAiQuota(planId) {
  const p = getPlan(planId);
  if (!p) return 0;
  return p.aiQuota;
}

function planPrice(planId, interval = 'month') {
  const p = getPlan(planId);
  if (!p) return 0;
  return interval === 'year' ? p.priceYear : p.priceMonth;
}

function planLabel(planId, interval = 'month') {
  const p = getPlan(planId);
  if (!p) return 'Timber';
  const suf = interval === 'year' ? ' anual' : '';
  return `Timber ${p.name}${suf}`;
}

function formatAiQuota(quota) {
  if (quota == null) return 'Ilimitado';
  return `${quota} al mes`;
}

function listPlans(currency = process.env.MP_CURRENCY || 'MXN') {
  return PLANS.map((id) => {
    const p = PLAN_CATALOG[id];
    const monthlyEq = Math.round(p.priceYear / 12);
    return {
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      pitch: p.pitch,
      price: p.priceMonth,
      priceYear: p.priceYear,
      monthlyFromYear: monthlyEq,
      currency,
      description: p.tagline,
      features: p.features,
      highlight: Boolean(p.highlight),
      badge: p.badge || null,
      savingsYear: Math.max(0, p.priceMonth * 12 - p.priceYear),
      aiQuota: p.aiQuota,
      aiQuotaLabel: formatAiQuota(p.aiQuota),
      productName: 'Inventario Mágico',
    };
  });
}

module.exports = {
  PLANS,
  PLAN_CATALOG,
  AI_QUOTAS,
  getPlan,
  planAiQuota,
  planPrice,
  planLabel,
  formatAiQuota,
  listPlans,
};
