<template>
  <AppShell>
    <div class="billing">
      <header class="head">
        <p class="kicker">100% en la nube</p>
        <h1>Tu caja en celular, tablet o PC</h1>
        <p class="lede">
          Sin instalar. Si se daña la PC, abres Timber en la tablet o el celular y sigues cobrando.
          <InventarioMagicoTerm /> actualiza precios desde la nube — en segundos.
        </p>
      </header>

      <div v-if="loading" class="state">Cargando…</div>
      <div v-else-if="err" class="state err">{{ err }}</div>
      <template v-else>
        <div class="toolbar">
          <div class="account" :class="{ warn: !status.active }">
            <span class="dot" />
            <div>
              <strong>{{ statusLabel }}</strong>
              <span v-if="status.billingStatus === 'trialing'">
                · {{ status.trialDaysLeft }} días de prueba
              </span>
              <span v-else-if="status.currentPeriodEnd">
                · hasta {{ formatDate(status.currentPeriodEnd) }}
              </span>
              <span> · {{ planName(status.plan) }}</span>
            </div>
          </div>

          <div class="switch" role="group" aria-label="Periodo">
            <button type="button" :class="{ on: interval === 'month' }" @click="interval = 'month'">
              Mensual
            </button>
            <button type="button" :class="{ on: interval === 'year' }" @click="interval = 'year'">
              Anual
            </button>
          </div>
        </div>

        <p v-if="interval === 'year'" class="year-tip">
          Anual Básico <strong>$1,500</strong> — pagas una vez y olvidas el cargo del mes.
        </p>

        <div class="plans">
          <article
            v-for="p in plans"
            :key="p.id"
            class="plan"
            :class="{ hot: p.highlight, current: status.plan === p.id && status.active }"
          >
            <header class="plan-top">
              <div>
                <p v-if="p.badge" class="badge">{{ p.badge }}</p>
                <h2>{{ p.name }}</h2>
                <p class="tag">{{ p.tagline }}</p>
              </div>
              <div class="price-block">
                <template v-if="interval === 'month'">
                  <p class="price">${{ formatInt(p.price) }}</p>
                  <p class="per">MXN / mes</p>
                </template>
                <template v-else>
                  <p class="price">${{ formatInt(p.priceYear) }}</p>
                  <p class="per">MXN / año · ~${{ formatInt(p.monthlyFromYear) }}/mes</p>
                </template>
              </div>
            </header>

            <p class="magic">
              <InventarioMagicoTerm /> · <strong>{{ p.aiQuotaLabel }}</strong>
            </p>

            <p class="pitch">{{ p.pitch }}</p>

            <ul>
              <li v-for="(f, i) in p.features" :key="i">{{ f }}</li>
            </ul>

            <button type="button" class="cta" :disabled="busy" @click="startCheckout(p.id)">
              {{ ctaLabel(p) }}
            </button>
          </article>
        </div>

        <section class="extras">
          <p>
            <strong>Hardware:</strong> si lo necesitas, te vendemos tablet, impresora o escáner.
          </p>
        </section>
        <section class="extras">
          <p>
            <strong>Licencia perpetua:</strong> $4,990 MXN pago único — sin cuota mensual.
            Contáctanos desde soporte o escríbenos para activarla.
          </p>
        </section>

        <p v-if="!status.mpConfigured" class="dev">
          Modo desarrollo: al activar se simula el pago (sin Mercado Pago).
        </p>
      </template>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppShell from "../components/AppShell.vue";
import InventarioMagicoTerm from "../components/InventarioMagicoTerm.vue";
import { apiService } from "../apiService";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const busy = ref(false);
const err = ref("");
const interval = ref(route.query.interval === "year" ? "year" : "month");
const status = ref({
  plan: "basic",
  billingStatus: "trialing",
  trialDaysLeft: 14,
  active: true,
  mpConfigured: false,
});
const plans = ref([]);

const statusLabel = computed(() => {
  const map = {
    trialing: "Prueba activa",
    active: "Suscripción activa",
    past_due: "Pago pendiente",
    suspended: "Cuenta suspendida",
  };
  return map[status.value.billingStatus] || status.value.billingStatus;
});

function planName(id) {
  return plans.value.find((p) => p.id === id)?.name || id;
}

function formatInt(n) {
  return Number(n || 0).toLocaleString("es-MX");
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ctaLabel(p) {
  if (!status.value.mpConfigured) return `Empezar con ${p.name}`;
  return interval.value === "year" ? `Pagar ${p.name} anual` : `Pagar ${p.name}`;
}

async function load() {
  loading.value = true;
  err.value = "";
  try {
    const [s, p] = await Promise.all([
      apiService.getBillingStatus(),
      apiService.getBillingPlans(),
    ]);
    status.value = s;
    plans.value = p.plans || [];
  } catch (e) {
    err.value = e.response?.data?.message || e.response?.data || "No se pudo cargar facturación";
  } finally {
    loading.value = false;
  }
}

async function startCheckout(plan) {
  busy.value = true;
  try {
    const res = await apiService.billingCheckout(plan, undefined, interval.value);
    if (res.mock || !status.value.mpConfigured) {
      await apiService.billingDevActivate(plan, res.preapprovalId, interval.value);
      await load();
      return;
    }
    const url = res.init_point || res.sandbox_init_point;
    if (url) window.location.href = url;
    else alert("No se recibió link de Mercado Pago");
  } catch (e) {
    alert(e.response?.data || "Error al iniciar pago");
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await load();
  if (route.query.mock === "1" && route.query.plan) {
    try {
      const iv = route.query.interval === "year" ? "year" : "month";
      await apiService.billingDevActivate(String(route.query.plan), undefined, iv);
      await load();
      router.replace({ path: "/billing" });
    } catch {
      /* ignore */
    }
  }
});
</script>

<style scoped>
.billing {
  --bill-gap: 1.1rem;
  max-width: 56rem;
  margin: 0 auto;
  display: grid;
  gap: var(--bill-gap);
  overflow: auto;
  max-height: 100%;
  padding: 0.25rem 0 1.5rem;
}

.head {
  padding: 0.35rem 0 0.15rem;
}
.kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--timber-accent);
}
.head h1 {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2.4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--timber-ink);
}
.lede {
  margin: 0.55rem 0 0;
  max-width: 28rem;
  font-size: 1.02rem;
  line-height: 1.45;
  color: var(--timber-muted);
}

.state {
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--timber-panel);
  color: var(--timber-muted);
}
.state.err { color: var(--timber-danger); }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.account {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.88rem;
  color: var(--timber-muted);
}
.account strong { color: var(--timber-ink); font-weight: 700; }
.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--timber-success);
  flex-shrink: 0;
}
.account.warn .dot { background: var(--timber-warning); }

.switch {
  display: inline-flex;
  padding: 0.18rem;
  border-radius: 999px;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
}
.switch button {
  border: none;
  background: transparent;
  min-height: 2.35rem;
  padding: 0 1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  color: var(--timber-muted);
}
.switch button.on {
  background: var(--timber-ink);
  color: var(--timber-panel);
}

.year-tip {
  margin: 0;
  font-size: 0.88rem;
  color: var(--timber-muted);
}
.year-tip strong { color: var(--timber-ink); }

.plans {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: 1fr;
}
@media (min-width: 900px) {
  .plans { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
}

.plan {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  height: 100%;
  padding: 1.2rem 1.15rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  position: relative;
}
.plan.hot {
  border-color: transparent;
  background:
    linear-gradient(var(--timber-panel), var(--timber-panel)) padding-box,
    linear-gradient(145deg, var(--timber-primary), var(--timber-accent)) border-box;
  border: 2px solid transparent;
  box-shadow: 0 18px 40px color-mix(in srgb, var(--timber-primary) 18%, transparent);
}
.plan.current::after {
  content: "Tu plan";
  position: absolute;
  top: 0.85rem;
  right: 0.9rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--timber-primary);
}

.plan-top {
  display: grid;
  gap: 0.65rem;
}
.badge {
  margin: 0 0 0.35rem;
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1a1208;
  background: var(--timber-accent);
  padding: 0.22rem 0.45rem;
  border-radius: 0.35rem;
}
.plan h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.tag {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--timber-muted);
  line-height: 1.35;
}
.price-block { margin-top: 0.15rem; }
.price {
  margin: 0;
  font-size: 2.15rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.per {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--timber-muted);
}

.magic {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--timber-primary);
  padding: 0.45rem 0.6rem;
  border-radius: 0.55rem;
  background: var(--timber-primary-soft);
}
.magic strong { color: var(--timber-ink); }

.pitch {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.4;
  color: var(--timber-ink);
  font-weight: 600;
}

.plan ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.4rem;
  flex: 1 1 auto;
  align-content: start;
}
.plan li {
  position: relative;
  padding-left: 1.05rem;
  font-size: 0.86rem;
  line-height: 1.35;
  color: var(--timber-muted);
}
.plan li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.45em;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--timber-accent);
}

.cta {
  margin-top: auto;
  min-height: 2.85rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--timber-primary);
  color: var(--timber-on-primary);
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  width: 100%;
}
.plan.hot .cta {
  background: var(--timber-ink);
  color: var(--timber-panel);
}
.cta:disabled { opacity: 0.55; cursor: wait; }

.dev {
  margin: 0;
  font-size: 0.78rem;
  color: var(--timber-muted);
  text-align: center;
}

.extras {
  display: grid;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--timber-muted);
}
.extras p { margin: 0; }
.extras strong { color: var(--timber-ink); }
</style>
