<template>
  <AppShell>
    <div class="floor">
      <div class="floor-bar">
        <div class="legend">
          <span class="leg free">Libre</span>
          <span class="leg busy">Ocupada</span>
        </div>
        <button type="button" class="add-btn" @click="mostrarModalAgregarMesa">+ Mesa</button>
      </div>

      <div class="floor-grid">
        <button
          v-for="mesa in mesas"
          :key="mesa.id"
          type="button"
          class="table-tile"
          :class="mesa.disponible ? 'is-free' : 'is-busy'"
          @click="abrirMesa(mesa)"
        >
          <span class="table-name">{{ mesa.nombre }}</span>
          <span class="table-cap">{{ mesa.capacidad }} pers.</span>
          <span class="table-status">{{ mesa.disponible ? 'LIBRE' : 'OCUPADA' }}</span>
          <span class="table-waiter">{{ waiterLabel(mesa) }}</span>
        </button>
      </div>

      <p v-if="!mesas.length" class="empty">Aún no hay mesas. Toca “+ Mesa” para empezar.</p>

      <!-- Action sheet estilo POS -->
      <div v-if="modalActivo" class="sheet-bg" @click.self="cerrarMesa">
        <div class="sheet">
          <div class="sheet-handle"></div>
          <h2>{{ mesaSeleccionada?.nombre }}</h2>
          <p class="sheet-sub">
            {{ mesaSeleccionada?.disponible ? 'Libre' : 'Ocupada' }}
            · {{ mesaSeleccionada?.capacidad }} personas
          </p>

          <button type="button" class="big-action primary" @click="irAPedido">
            Tomar pedido
          </button>
          <div class="action-row">
            <button type="button" class="big-action" @click="ocuparMesa">Ocupar</button>
            <button type="button" class="big-action success" @click="desocuparMesa">Liberar</button>
          </div>

          <label class="field">
            Mesero
            <select v-model="selectedWaiterPhone">
              <option value="">Sin asignar</option>
              <option v-for="w in waiters" :key="w.cellphone" :value="w.cellphone">
                {{ w.name }} {{ w.lastName }}
              </option>
            </select>
          </label>
          <button type="button" class="big-action ghost" @click="guardarMesero">Guardar mesero</button>
          <button type="button" class="big-action danger" @click="eliminarMesa(mesaSeleccionada)">Eliminar mesa</button>
          <button type="button" class="big-action ghost" @click="cerrarMesa">Cerrar</button>
        </div>
      </div>

      <div v-if="modalAgregarMesa" class="sheet-bg" @click.self="cerrarModalAgregarMesa">
        <div class="sheet">
          <div class="sheet-handle"></div>
          <h2>Nueva mesa</h2>
          <label class="field">Nombre
            <input v-model="nombreNuevaMesa" type="text" maxlength="30" placeholder="Ej. Mesa 5" />
          </label>
          <label class="field">Capacidad
            <select v-model="capacidadNuevaMesa">
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
            </select>
          </label>
          <button type="button" class="big-action primary" @click="agregarNuevaMesa">Crear mesa</button>
          <button type="button" class="big-action ghost" @click="cerrarModalAgregarMesa">Cancelar</button>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import AppShell from '../components/AppShell.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiService } from '../apiService.ts';

const router = useRouter();
const mesas = ref([]);
const waiters = ref([]);
const modalActivo = ref(false);
const modalAgregarMesa = ref(false);
const nombreNuevaMesa = ref('');
const capacidadNuevaMesa = ref('4');
const mesaSeleccionada = ref(null);
const selectedWaiterPhone = ref('');

function waiterLabel(mesa) {
  if (!mesa.mesero) return 'Sin mesero';
  if (typeof mesa.mesero === 'string') {
    const w = waiters.value.find((x) => x.cellphone === mesa.mesero);
    return w ? `${w.name} ${w.lastName}` : 'Mesero';
  }
  return `${mesa.mesero.name || ''} ${mesa.mesero.lastName || ''}`.trim() || 'Mesero';
}

async function refillMesas() {
  try {
    mesas.value = (await apiService.getTables()) || [];
  } catch {
    mesas.value = [];
  }
}

async function loadWaiters() {
  try {
    waiters.value = (await apiService.getWaiters()) || [];
  } catch {
    waiters.value = [];
  }
}

function abrirMesa(mesa) {
  mesaSeleccionada.value = mesa;
  selectedWaiterPhone.value =
    typeof mesa.mesero === 'string' ? mesa.mesero : mesa.mesero?.cellphone || '';
  modalActivo.value = true;
}

function irAPedido() {
  const m = mesaSeleccionada.value;
  if (!m) return;
  router.push({ path: '/menu', query: { tableId: m.id, tableName: m.nombre } });
}

function mostrarModalAgregarMesa() {
  modalAgregarMesa.value = true;
}
function cerrarModalAgregarMesa() {
  modalAgregarMesa.value = false;
  nombreNuevaMesa.value = '';
}
function cerrarMesa() {
  modalActivo.value = false;
  mesaSeleccionada.value = null;
}

async function agregarNuevaMesa() {
  try {
    const response = await apiService.createTable({
      nombre: nombreNuevaMesa.value,
      capacidad: capacidadNuevaMesa.value,
      disponible: true,
    });
    mesas.value = [...mesas.value, response];
    cerrarModalAgregarMesa();
  } catch {
    alert('No se pudo crear la mesa');
  }
}

async function eliminarMesa(mesa) {
  if (!mesa) return;
  if (!confirm(`¿Eliminar ${mesa.nombre}?`)) return;
  try {
    await apiService.deleteTable(mesa.id);
    mesas.value = mesas.value.filter((m) => m.id !== mesa.id);
    cerrarMesa();
  } catch {
    alert('No se pudo eliminar');
  }
}

async function guardarMesero() {
  if (!mesaSeleccionada.value) return;
  const updated = await apiService.editTable(mesaSeleccionada.value.id, {
    ...mesaSeleccionada.value,
    mesero: selectedWaiterPhone.value || null,
  });
  const idx = mesas.value.findIndex((m) => m.id === updated.id);
  if (idx >= 0) mesas.value[idx] = updated;
  mesaSeleccionada.value = updated;
}

async function ocuparMesa() {
  const updated = await apiService.editTable(mesaSeleccionada.value.id, {
    ...mesaSeleccionada.value,
    disponible: false,
    mesero: selectedWaiterPhone.value || mesaSeleccionada.value.mesero || null,
  });
  const idx = mesas.value.findIndex((m) => m.id === updated.id);
  if (idx >= 0) mesas.value[idx] = updated;
  cerrarMesa();
}

async function desocuparMesa() {
  const updated = await apiService.editTable(mesaSeleccionada.value.id, {
    ...mesaSeleccionada.value,
    disponible: true,
    personaTitular: null,
  });
  const idx = mesas.value.findIndex((m) => m.id === updated.id);
  if (idx >= 0) mesas.value[idx] = updated;
  cerrarMesa();
}

onMounted(async () => {
  await Promise.all([refillMesas(), loadWaiters()]);
});
</script>

<style scoped>
.floor { max-width: 1200px; margin: 0 auto; }
.floor-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
.legend { display: flex; gap: 0.5rem; }
.leg {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
}
.leg.free { background: var(--timber-success-soft); color: var(--timber-success); }
.leg.busy { background: var(--timber-danger-soft); color: var(--timber-danger); }
.add-btn {
  min-height: 3rem;
  padding: 0 1.1rem;
  border: none;
  border-radius: 0.8rem;
  background: var(--timber-primary);
  color: var(--timber-on-primary);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: var(--timber-shadow);
}

.floor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.75rem;
}

.table-tile {
  aspect-ratio: 1;
  border: none;
  border-radius: 1.15rem;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  cursor: pointer;
  box-shadow: var(--timber-shadow);
  transition: transform 0.12s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.table-tile:active { transform: scale(0.97); }
.table-tile.is-free {
  background: linear-gradient(160deg, color-mix(in srgb, var(--timber-free) 88%, white), var(--timber-free));
  color: #fff;
}
.table-tile.is-busy {
  background: linear-gradient(160deg, color-mix(in srgb, var(--timber-busy) 88%, white), var(--timber-busy));
  color: #fff;
}
.table-name {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 3.2vw, 1.55rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.table-cap { font-size: 0.85rem; opacity: 0.9; }
.table-status {
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}
.table-waiter {
  font-size: 0.75rem;
  opacity: 0.9;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty {
  text-align: center;
  color: var(--timber-muted);
  margin-top: 2rem;
  font-size: 1.05rem;
}

.sheet-bg {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(10, 16, 14, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: min(32rem, 100%);
  background: var(--timber-panel);
  color: var(--timber-ink);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 0.75rem 1rem calc(1.2rem + env(safe-area-inset-bottom, 0px));
  display: grid;
  gap: 0.55rem;
  max-height: 88vh;
  overflow: auto;
  animation: slide-up 0.22s ease;
  border: 1px solid var(--timber-line);
}
@keyframes slide-up {
  from { transform: translateY(24px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}
.sheet-handle {
  width: 2.5rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--timber-line);
  margin: 0.15rem auto 0.35rem;
}
.sheet h2 {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.sheet-sub {
  margin: 0;
  text-align: center;
  color: var(--timber-muted);
}
.big-action {
  min-height: 3.35rem;
  border: none;
  border-radius: 0.9rem;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--timber-surface);
  color: var(--timber-ink);
}
.big-action.primary {
  background: var(--timber-primary);
  color: var(--timber-on-primary);
  box-shadow: var(--timber-shadow);
}
.big-action.success { background: var(--timber-success); color: #fff; }
.big-action.danger { background: var(--timber-danger-soft); color: var(--timber-danger); }
.big-action.ghost { background: transparent; border: 1px solid var(--timber-line); }
.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.field { display: grid; gap: 0.35rem; font-weight: 600; font-size: 0.9rem; }
.field input, .field select {
  min-height: 3rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.75rem;
  padding: 0.65rem 0.8rem;
  font: inherit;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
}

@media (min-width: 900px) {
  .floor-grid {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  }
  .sheet-bg {
    align-items: center;
    padding: 1rem;
  }
  .sheet {
    border-radius: 1.2rem;
    padding: 1.15rem;
  }
}
</style>
