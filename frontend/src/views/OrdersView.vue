<template>
  <AppShell>
    <div class="orders-page">
      <!-- Estado de caja: franja compacta -->
      <div class="cash-strip" :class="cashOpen ? 'is-open' : 'is-closed'">
        <div class="cash-status">
          <span class="dot" aria-hidden="true" />
          <div class="cash-copy">
            <strong>{{ cashOpen ? 'Caja abierta' : 'Caja cerrada' }}</strong>
            <p v-if="cashOpen && session">
              Fondo {{ money(session.openingFloat) }}
              · Ventas {{ money(cashTotals.total) }}
              · Efectivo {{ money((session.openingFloat || 0) + cashTotals.cash) }}
            </p>
            <p v-else>Ábrela para cobrar ventas del turno.</p>
          </div>
        </div>
        <div class="cash-btns">
          <button
            v-if="!cashOpen"
            type="button"
            class="btn-primary"
            @click="showOpen = true"
          >Abrir caja</button>
          <button
            v-else
            type="button"
            class="btn-ghost"
            @click="prepClose"
          >Cerrar turno</button>
        </div>
      </div>
      <p v-if="cashMsg" class="ok">{{ cashMsg }}</p>
      <p v-if="cashErr" class="err">{{ cashErr }}</p>

      <div class="toolbar hide-mobile">
        <p>Ventas y cobros de la tienda.</p>
      </div>

      <div class="filters">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          :class="{ active: filter === f.id }"
          @click="filter = f.id"
        >{{ f.label }}</button>
      </div>

      <div class="list">
        <article v-for="o in filtered" :key="o.id" class="card">
          <div class="head">
            <div>
              <h3>#{{ String(o.id || '').slice(-6).toUpperCase() }}</h3>
              <p class="meta">
                {{ formatDate(o.createdAt) }}
                <span class="hide-mobile"> · {{ (o.items || []).length }} líneas</span>
              </p>
            </div>
            <div class="tags">
              <span class="badge" :class="o.paymentStatus">{{ paymentText(o.paymentStatus) }}</span>
              <span class="badge hide-mobile" :class="`st-${o.status}`">{{ statusText(o.status) }}</span>
            </div>
          </div>
          <ul class="items hide-mobile">
            <li v-for="(item, i) in (o.items || []).slice(0, 4)" :key="i">
              {{ item.quantity }}× {{ item.name }} — {{ money(item.price * item.quantity) }}
            </li>
            <li v-if="(o.items || []).length > 4" class="more-items">
              +{{ (o.items || []).length - 4 }} más
            </li>
          </ul>
          <div class="foot">
            <strong>{{ money(o.total) }}</strong>
            <div class="actions">
              <router-link
                class="link-btn hide-mobile"
                :to="`/print/order/${o.id}?mode=receipt`"
                target="_blank"
              >Ticket</router-link>
              <button
                v-if="o.paymentStatus !== 'paid'"
                type="button"
                class="btn-primary"
                :disabled="!cashOpen"
                :title="cashOpen ? '' : 'Abre la caja primero'"
                @click="openPay(o)"
              >Cobrar</button>
            </div>
          </div>
        </article>
        <p v-if="!filtered.length" class="empty">No hay pedidos en este filtro.</p>
      </div>

      <!-- Abrir caja -->
      <Teleport to="body">
        <div v-if="showOpen" class="modal-bg" @click.self="showOpen = false">
          <form class="modal" role="dialog" aria-modal="true" @submit.prevent="openCash">
            <h3>Abrir caja</h3>
            <p class="modal-hint">Indica el efectivo con el que inicia el turno.</p>
            <label>
              Fondo inicial
              <input
                v-model.number="openingFloat"
                type="number"
                min="0"
                step="1"
                inputmode="decimal"
                autofocus
              />
            </label>
            <div class="modal-actions">
              <button type="button" @click="showOpen = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="cashBusy">
                {{ cashBusy ? 'Abriendo…' : 'Abrir' }}
              </button>
            </div>
          </form>
        </div>
      </Teleport>

      <!-- Cerrar caja -->
      <Teleport to="body">
        <div v-if="showClose" class="modal-bg" @click.self="showClose = false">
          <form class="modal" role="dialog" aria-modal="true" @submit.prevent="closeCash">
            <h3>Cerrar turno</h3>
            <div class="close-summary">
              <div><span>Fondo</span><strong>{{ money(session?.openingFloat) }}</strong></div>
              <div><span>Ventas</span><strong>{{ money(cashTotals.total) }}</strong></div>
              <div><span>Efectivo esperado</span><strong>{{ money(expectedCash) }}</strong></div>
            </div>
            <label>
              Efectivo contado en caja
              <input
                v-model.number="countedCash"
                type="number"
                min="0"
                step="1"
                inputmode="decimal"
                required
              />
            </label>
            <p class="diff" :class="{ ok: difference === 0, bad: difference !== 0 }">
              Diferencia: {{ money(difference) }}
            </p>
            <div class="modal-actions">
              <button type="button" @click="showClose = false">Cancelar</button>
              <button type="submit" class="btn-danger" :disabled="cashBusy">
                {{ cashBusy ? 'Cerrando…' : 'Cerrar e imprimir' }}
              </button>
            </div>
          </form>
        </div>
      </Teleport>

      <!-- Cobrar -->
      <Teleport to="body">
        <div v-if="payOrder" class="modal-bg" @click.self="payOrder = null">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pay-title">
            <h3 id="pay-title">Cobrar</h3>
            <div class="pay-sum">
              <div><span>Ticket</span><strong>{{ money(payOrder.total) }}</strong></div>
              <div v-if="payMethod === 'card' && cardExtraIva">
                <span>IVA extra tarjeta ({{ Math.round(TAX_RATE * 100) }}%)</span>
                <strong>{{ money(cardExtraAmount) }}</strong>
              </div>
              <div class="pay-total">
                <span>A cobrar</span>
                <strong>{{ money(payTotal) }}</strong>
              </div>
            </div>
            <label>Método de pago
              <select v-model="payMethod">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label v-if="payMethod === 'card'" class="check">
              <input v-model="cardExtraIva" type="checkbox" />
              Agregar IVA extra en tarjeta ({{ Math.round(TAX_RATE * 100) }}%)
            </label>
            <div class="modal-actions">
              <button type="button" @click="payOrder = null">Cancelar</button>
              <button type="button" class="btn-primary" @click="confirmPay">Confirmar cobro</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../components/AppShell.vue";
import { apiService } from "../apiService";
import {
  labelOf,
  modalityLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "../labels";
import { TAX_RATE } from "../tax";

const router = useRouter();
const orders = ref([]);
const filter = ref("open");
const payOrder = ref(null);
const payMethod = ref("cash");
const cardExtraIva = ref(true);

const cardExtraAmount = computed(() => {
  if (!payOrder.value || payMethod.value !== "card" || !cardExtraIva.value) return 0;
  return Number((Number(payOrder.value.total || 0) * TAX_RATE).toFixed(2));
});
const payTotal = computed(() =>
  Number((Number(payOrder.value?.total || 0) + cardExtraAmount.value).toFixed(2))
);

const cashOpen = ref(false);
const session = ref(null);
const cashTotals = ref({ cash: 0, card: 0, transfer: 0, other: 0, total: 0 });
const openingFloat = ref(0);
const countedCash = ref(0);
const cashBusy = ref(false);
const cashMsg = ref("");
const cashErr = ref("");
const showOpen = ref(false);
const showClose = ref(false);

const filters = [
  { id: "open", label: "Abiertos" },
  { id: "unpaid", label: "Por cobrar" },
  { id: "paid", label: "Pagados" },
  { id: "all", label: "Todos" },
];

const filtered = computed(() => {
  if (filter.value === "all") return orders.value;
  if (filter.value === "paid") return orders.value.filter((o) => o.paymentStatus === "paid");
  if (filter.value === "unpaid") return orders.value.filter((o) => o.paymentStatus !== "paid");
  return orders.value.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled");
});

const expectedCash = computed(
  () => Number(session.value?.openingFloat || 0) + Number(cashTotals.value.cash || 0)
);
const difference = computed(() => Number(countedCash.value || 0) - expectedCash.value);

function money(n) {
  return Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}
function statusText(s) {
  return labelOf(orderStatusLabel, s);
}
function paymentText(s) {
  return labelOf(paymentStatusLabel, s, "Sin pagar");
}
function modalityText(m) {
  return labelOf(modalityLabel, m);
}

async function loadCash() {
  try {
    const data = await apiService.getCashSession();
    cashOpen.value = Boolean(data.open);
    session.value = data.session;
    cashTotals.value = data.totals || { cash: 0, card: 0, transfer: 0, other: 0, total: 0 };
    if (data.session) {
      countedCash.value = Number(
        (data.session.openingFloat || 0) + (data.totals?.cash || 0)
      );
    }
  } catch {
    cashOpen.value = false;
    session.value = null;
  }
}

function prepClose() {
  countedCash.value = expectedCash.value;
  cashErr.value = "";
  showClose.value = true;
}

async function openCash() {
  cashBusy.value = true;
  cashErr.value = "";
  cashMsg.value = "";
  try {
    await apiService.openCashSession(Number(openingFloat.value || 0));
    showOpen.value = false;
    cashMsg.value = "Caja abierta.";
    await loadCash();
  } catch (e) {
    cashErr.value = e.response?.data || "No se pudo abrir la caja";
  } finally {
    cashBusy.value = false;
  }
}

async function closeCash() {
  cashBusy.value = true;
  cashErr.value = "";
  cashMsg.value = "";
  try {
    const res = await apiService.closeCashSession(Number(countedCash.value || 0));
    showClose.value = false;
    cashMsg.value = `Turno cerrado. Diferencia: ${money(res.session?.difference)}`;
    if (res.session?.id) {
      router.push(`/print/cash/${res.session.id}?autoprint=1`);
    }
    await loadCash();
  } catch (e) {
    cashErr.value = e.response?.data || "No se pudo cerrar la caja";
  } finally {
    cashBusy.value = false;
  }
}

async function load() {
  try {
    orders.value = (await apiService.getOrders()) || [];
  } catch {
    orders.value = [];
  }
  await loadCash();
}

function openPay(o) {
  if (!cashOpen.value) {
    cashErr.value = "Abre la caja antes de cobrar.";
    showOpen.value = true;
    return;
  }
  payOrder.value = o;
  payMethod.value = "cash";
  cardExtraIva.value = true;
}

async function confirmPay() {
  if (!payOrder.value) return;
  try {
    const updated = await apiService.payOrder(payOrder.value.id, payMethod.value, {
      cardExtraIva: payMethod.value === "card" && cardExtraIva.value,
    });
    const idx = orders.value.findIndex((x) => x.id === updated.id);
    if (idx >= 0) orders.value[idx] = updated;
    const id = payOrder.value.id;
    payOrder.value = null;
    await loadCash();
    if (confirm("¿Imprimir cuenta?")) {
      window.open(`/print/order/${id}?mode=receipt&autoprint=1`, "_blank");
    }
  } catch (e) {
    cashErr.value = e.response?.data || "No se pudo cobrar";
  }
}

async function setStatus(o, status) {
  const updated = await apiService.updateOrderStatus(o.id, status);
  const idx = orders.value.findIndex((x) => x.id === updated.id);
  if (idx >= 0) orders.value[idx] = updated;
}

onMounted(load);
</script>

<style scoped>
.orders-page {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: t-fade-up .45s ease both;
}

.cash-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.55rem 0.75rem;
  border-radius: 0.7rem;
  border: 1px solid var(--timber-line);
  background: var(--timber-panel);
  margin-bottom: 0.45rem;
  flex-shrink: 0;
}
.cash-strip.is-closed {
  border-color: color-mix(in srgb, var(--timber-warning) 35%, var(--timber-line));
}
.cash-strip.is-open {
  border-color: color-mix(in srgb, var(--timber-success) 35%, var(--timber-line));
}
.cash-status {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-width: 0;
}
.dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  margin-top: 0.4rem;
  flex-shrink: 0;
  background: var(--timber-warning);
}
.cash-strip.is-open .dot {
  background: var(--timber-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--timber-success) 25%, transparent);
}
.cash-copy { min-width: 0; }
.cash-copy strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.cash-copy p {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--timber-muted);
  line-height: 1.35;
}
.cash-btns { display: flex; gap: 0.5rem; flex-shrink: 0; }

.btn-ghost {
  min-height: 2.85rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.75rem;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  font-weight: 700;
  cursor: pointer;
}

.toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.55rem; gap:0.75rem; flex-wrap:wrap; flex-shrink:0; }
.toolbar p { margin:0; color:var(--timber-muted); font-size:0.88rem; }
.btn-primary { background:var(--timber-primary); color:var(--timber-on-primary); border:none; border-radius:.7rem; padding:.55rem 0.95rem; font-weight:700; text-decoration:none; cursor:pointer; display:inline-block; min-height:2.6rem; box-shadow:var(--timber-shadow); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.btn-danger { background:var(--timber-danger); color:#fff; border:none; border-radius:.7rem; padding:.55rem 0.95rem; font-weight:700; cursor:pointer; min-height:2.6rem; }
.filters { display:flex; gap:.35rem; flex-wrap:wrap; margin-bottom:0.55rem; flex-shrink:0; }
.filters button { border:1px solid var(--timber-line); background:var(--timber-panel-elevated); color:var(--timber-ink); border-radius:999px; padding:.4rem 0.85rem; cursor:pointer; font-size:.82rem; font-weight:700; min-height:2.4rem; }
.filters button.active { background:var(--timber-primary); color:var(--timber-on-primary); border-color:transparent; }
.list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 0.55rem;
  align-content: start;
  padding-bottom: 0.25rem;
}
.card { background:var(--timber-panel); border:1px solid var(--timber-line); border-radius:0.85rem; padding:0.85rem; box-shadow:var(--timber-shadow); color:var(--timber-ink); }
.head { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
.head h3 { margin:0; font-family:var(--font-display); font-size:1.2rem; font-weight:700; letter-spacing:-0.01em; }
.meta { margin:.25rem 0 0; color:var(--timber-muted); font-size:.82rem; }
.tags { display:flex; gap:.4rem; flex-wrap:wrap; justify-content:flex-end; }
.badge {
  display: inline-flex; align-items: center; justify-content: center;
  height: 1.7rem; padding: 0 0.75rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700; line-height: 1; white-space: nowrap;
  background: var(--timber-primary-soft); color: var(--timber-primary);
}
.badge.st-pending { background: var(--timber-warning-soft); color: var(--timber-warning); }
.badge.st-preparing { background: color-mix(in srgb, var(--timber-accent) 22%, transparent); color: var(--timber-accent); }
.badge.st-ready { background: var(--timber-primary-soft); color: var(--timber-primary); }
.badge.st-served { background: var(--timber-success-soft); color: var(--timber-success); }
.badge.st-cancelled { background: var(--timber-danger-soft); color: var(--timber-danger); }
.badge.paid { background: var(--timber-success-soft); color: var(--timber-success); }
.badge.unpaid { background: var(--timber-warning-soft); color: var(--timber-warning); }
.items { margin:.85rem 0; padding-left:1.1rem; color:var(--timber-muted); font-size:.9rem; }
.foot { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
.actions { display:flex; gap:.45rem; flex-wrap:wrap; }
.actions button:not(.btn-primary) { border:1px solid var(--timber-line); background:var(--timber-panel-elevated); color:var(--timber-ink); border-radius:.7rem; padding:.65rem .85rem; cursor:pointer; font-weight:700; min-height:2.85rem; }
.link-btn { display:inline-flex; align-items:center; border:1px solid var(--timber-line); background:var(--timber-panel-elevated); color:var(--timber-ink); border-radius:.7rem; padding:.65rem .85rem; font-weight:700; text-decoration:none; min-height:2.85rem; }
.empty { color:var(--timber-muted); }
.ok { color: var(--timber-success); font-size: .88rem; margin: 0 0 .75rem; font-weight: 600; }
.err { color: var(--timber-danger); font-size: .88rem; margin: 0 0 .75rem; font-weight: 600; }

.modal-bg {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(10, 16, 14, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}
.modal {
  background: var(--timber-panel);
  color: var(--timber-ink);
  border-radius: 1.15rem 1.15rem 0.85rem 0.85rem;
  padding: 1.35rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
  width: min(24rem, 100%);
  max-height: min(85vh, 36rem);
  overflow: auto;
  display: grid;
  gap: 0.85rem;
  border: 1px solid var(--timber-line);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
}
.modal h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.01em;
  font-size: 1.35rem;
}
.modal-hint {
  margin: -0.35rem 0 0;
  color: var(--timber-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}
.modal label { display: grid; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
.modal .check {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 700;
  cursor: pointer;
}
.modal .check input {
  width: 1.15rem;
  height: 1.15rem;
  min-height: 0;
  accent-color: var(--timber-primary);
}
.pay-sum {
  display: grid;
  gap: 0.4rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--timber-surface);
  border: 1px solid var(--timber-line);
}
.pay-sum > div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}
.pay-sum span { color: var(--timber-muted); }
.pay-total {
  margin-top: 0.2rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--timber-line);
  font-size: 1.05rem !important;
}
.pay-total strong {
  font-size: 1.35rem;
  color: var(--timber-primary);
}
.modal input,
.modal select {
  min-height: 3rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.75rem;
  border: 1px solid var(--timber-line);
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  font: inherit;
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.modal select { font-size: 1rem; font-weight: 600; }

.close-summary {
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--timber-surface);
  border: 1px solid var(--timber-line);
}
.close-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.close-summary span { color: var(--timber-muted); }
.close-summary strong { font-variant-numeric: tabular-nums; }

.diff {
  margin: 0;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
}
.diff.ok { color: var(--timber-success); }
.diff.bad { color: var(--timber-warning); }

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 0.55rem;
  margin-top: 0.25rem;
}
.modal-actions button {
  min-height: 3.15rem;
  border-radius: 0.85rem;
  border: 1px solid var(--timber-line);
  background: var(--timber-surface);
  color: var(--timber-ink);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
.modal-actions .btn-primary {
  border: none;
  background: var(--timber-primary);
  color: var(--timber-on-primary);
}
.modal-actions .btn-danger {
  border: none;
}

.more-items { list-style: none; margin-left: -1.1rem; color: var(--timber-muted); font-style: italic; }

@media (max-width: 767.98px) {
  .orders-page { padding: 0.55rem; }
  .cash-strip { padding: 0.5rem 0.65rem; }
  .cash-copy p { display: none; }
  .card { padding: 0.75rem; }
  .foot { gap: 0.5rem; }
  .filters button { min-height: 2.35rem; padding: 0.35rem 0.7rem; font-size: 0.78rem; }
}

@media (min-width: 768px) and (max-width: 1099.98px) {
  .orders-page { padding: 0.75rem; }
  .list { gap: 0.65rem; }
}

@media (min-width: 1100px) {
  .orders-page { padding: 0.85rem 1rem; }
  .modal-bg {
    align-items: center;
    padding: 1.5rem;
  }
  .modal {
    border-radius: 1.15rem;
    padding: 1.4rem;
  }
}

@media (min-width: 720px) and (max-width: 1099.98px) {
  .modal-bg {
    align-items: center;
    padding: 1.5rem;
  }
  .modal {
    border-radius: 1.15rem;
    padding: 1.4rem;
  }
}

</style>
