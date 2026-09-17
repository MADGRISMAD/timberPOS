<template>
  <AppShell>
    <div class="orders-page">
      <div class="toolbar">
        <p>Cobro y seguimiento de pedidos del salón.</p>
        <router-link to="/menu" class="btn-primary">Nuevo pedido</router-link>
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
              <h3>{{ o.tableName || 'Sin mesa' }}</h3>
              <p class="meta">{{ formatDate(o.createdAt) }} · {{ modalityText(o.modality) }}</p>
            </div>
            <div class="tags">
              <span class="badge" :class="`st-${o.status}`">{{ statusText(o.status) }}</span>
              <span class="badge" :class="o.paymentStatus">{{ paymentText(o.paymentStatus) }}</span>
            </div>
          </div>
          <ul class="items">
            <li v-for="(item, i) in o.items || []" :key="i">
              {{ item.quantity }}× {{ item.name }} — {{ money(item.price * item.quantity) }}
            </li>
          </ul>
          <div class="foot">
            <strong>{{ money(o.total) }}</strong>
            <div class="actions">
              <button v-if="o.paymentStatus !== 'paid'" type="button" class="btn-primary" @click="openPay(o)">Cobrar</button>
              <button v-if="o.status === 'pending'" type="button" @click="setStatus(o, 'preparing')">A cocina</button>
            </div>
          </div>
        </article>
        <p v-if="!filtered.length" class="empty">No hay pedidos en este filtro.</p>
      </div>

      <div v-if="payOrder" class="modal-bg" @click.self="payOrder = null">
        <div class="modal">
          <h3>Cobrar {{ money(payOrder.total) }}</h3>
          <label>Método de pago
            <select v-model="payMethod">
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <div class="modal-actions">
            <button type="button" @click="payOrder = null">Cancelar</button>
            <button type="button" class="btn-primary" @click="confirmPay">Confirmar cobro</button>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import AppShell from "../components/AppShell.vue";
import { apiService } from "../apiService";
import {
  labelOf,
  modalityLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "../labels";

const orders = ref([]);
const filter = ref("open");
const payOrder = ref(null);
const payMethod = ref("cash");

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

async function load() {
  try {
    orders.value = (await apiService.getOrders()) || [];
  } catch {
    orders.value = [];
  }
}

function openPay(o) {
  payOrder.value = o;
  payMethod.value = "cash";
}

async function confirmPay() {
  if (!payOrder.value) return;
  const updated = await apiService.payOrder(payOrder.value.id, payMethod.value);
  const idx = orders.value.findIndex((x) => x.id === updated.id);
  if (idx >= 0) orders.value[idx] = updated;
  payOrder.value = null;
}

async function setStatus(o, status) {
  const updated = await apiService.updateOrderStatus(o.id, status);
  const idx = orders.value.findIndex((x) => x.id === updated.id);
  if (idx >= 0) orders.value[idx] = updated;
}

onMounted(load);
</script>

<style scoped>
.orders-page { animation: t-fade-up .45s ease both; }
.toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; gap:1rem; flex-wrap:wrap; }
.toolbar p { margin:0; color:var(--timber-muted); }
.btn-primary { background:var(--timber-primary); color:var(--timber-on-primary); border:none; border-radius:.8rem; padding:.75rem 1.1rem; font-weight:700; text-decoration:none; cursor:pointer; display:inline-block; min-height:3rem; box-shadow:var(--timber-shadow); }
.filters { display:flex; gap:.45rem; flex-wrap:wrap; margin-bottom:1rem; }
.filters button { border:1px solid var(--timber-line); background:var(--timber-panel-elevated); color:var(--timber-ink); border-radius:999px; padding:.55rem 1rem; cursor:pointer; font-size:.9rem; font-weight:700; min-height:2.85rem; }
.filters button.active { background:var(--timber-primary); color:var(--timber-on-primary); border-color:transparent; }
.list { display:grid; gap:.85rem; }
.card { background:var(--timber-panel); border:1px solid var(--timber-line); border-radius:1.1rem; padding:1.15rem; box-shadow:var(--timber-shadow); color:var(--timber-ink); }
.head { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
.head h3 { margin:0; font-family:var(--font-display); font-size:1.2rem; font-weight:700; letter-spacing:-0.01em; }
.meta { margin:.25rem 0 0; color:var(--timber-muted); font-size:.82rem; }
.tags { display:flex; gap:.4rem; flex-wrap:wrap; justify-content:flex-end; max-width:14rem; }
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.7rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  background: var(--timber-primary-soft);
  color: var(--timber-primary);
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
.empty { color:var(--timber-muted); }
.modal-bg { position:fixed; inset:0; background:rgba(10,16,14,.48); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:50; }
.modal { background:var(--timber-panel); color:var(--timber-ink); border-radius:1.15rem; padding:1.3rem; width:min(22rem,92vw); display:grid; gap:.75rem; border:1px solid var(--timber-line); }
.modal h3 { margin:0; font-family:var(--font-display); font-weight:700; letter-spacing:-0.01em; }
.modal label { display:grid; gap:.3rem; font-size:.85rem; }
.modal select { padding:.65rem; border-radius:.65rem; border:1px solid var(--timber-line); background:var(--timber-panel-elevated); color:var(--timber-ink); }
.modal-actions { display:flex; justify-content:flex-end; gap:.5rem; }
</style>
