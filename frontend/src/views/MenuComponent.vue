<template>
  <AppShell>
    <div class="pos" :class="{ manage: mode === 'manage' }">
      <!-- ═══════════ MODO VENTA — escritorio tipo Mr Tienda ═══════════ -->
      <template v-if="mode === 'pos'">
        <div class="desk">
          <!-- Barra de funciones: en móvil sin teclas F ni Cobrar duplicado -->
          <nav class="fkey-bar" aria-label="Funciones rápidas">
            <button type="button" class="fkey" @click="removeSelected" :disabled="selectedIdx < 0">
              <span class="fk only-pc">F2</span>
              <span class="fl">Anular</span>
            </button>
            <button type="button" class="fkey" @click="showPriceCheck = true">
              <span class="fk only-pc">F4</span>
              <span class="fl">Precio</span>
            </button>
            <button type="button" class="fkey" @click="showDiscount = true">
              <span class="fk only-pc">F9</span>
              <span class="fl">Dcto</span>
            </button>
            <button
              type="button"
              class="fkey accent hide-mobile"
              @click="finalizeOrder"
              :disabled="!lines.length || sending"
            >
              <span class="fk only-pc">F12</span>
              <span class="fl">Cobrar</span>
            </button>
            <button type="button" class="fkey ghost" @click="clearCart" :disabled="!lines.length">
              <span class="fl">Vaciar</span>
            </button>
          </nav>

          <div class="status-bar">
            <span class="hide-mobile">{{ businessName }}</span>
            <span>{{ itemCount }} arts</span>
            <span v-if="ticketDiscount">Dcto {{ ticketDiscount }}%</span>
            <span class="status-hint only-pc">Escáner listo · Enter agrega</span>
            <span class="status-hint only-tablet">Listo para escanear</span>
          </div>

          <div class="desk-top">
            <div class="scan-box" :class="{ flash: scanFlash, err: !!scanError }">
              <label class="scan-label" for="pos-scan">Código / búsqueda</label>
              <input
                id="pos-scan"
                ref="scanInput"
                v-model="scanCode"
                type="text"
                class="scan-input"
                placeholder="Escanea o escribe…"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                @keydown.enter.prevent="onScanEnter"
              />
              <p v-if="scanError" class="scan-msg err">{{ scanError }}</p>
              <p v-else-if="lastAdded" class="scan-msg ok">+ {{ lastAdded.name }}</p>

              <div v-if="nameHits.length" class="hits">
                <button
                  v-for="p in nameHits"
                  :key="p.id"
                  type="button"
                  class="hit"
                  @click="addProduct(p)"
                >
                  <span>{{ p.name }}</span>
                  <strong>{{ money(p.price) }}</strong>
                </button>
              </div>
            </div>

            <aside class="total-box">
              <p class="arts">{{ itemCount }} arts</p>
              <p class="total-label">Total</p>
              <p class="total-num">{{ money(total) }}</p>
              <p class="tax-line">
                IVA {{ money(tax) }} · Neto {{ money(totals.net) }}
                <template v-if="ticketDiscount"> · Dcto −{{ ticketDiscount }}%</template>
              </p>
            </aside>
          </div>

          <div class="ticket-wrap">
            <table class="ticket-table">
              <thead>
                <tr>
                  <th class="c-code">Código</th>
                  <th class="c-qty">Cant.</th>
                  <th class="c-name">Descripción</th>
                  <th class="c-price">Precio</th>
                  <th class="c-imp">Importe</th>
                  <th class="c-act"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in pagedRows"
                  :key="row.i + '-' + row.line.id"
                  :class="{ on: selectedIdx === row.i }"
                  @click="selectedIdx = row.i"
                >
                  <td class="c-code">{{ row.line.barcode || row.line.sku || '—' }}</td>
                  <td class="c-qty">
                    <div class="qty">
                      <button type="button" @click.stop="bumpQty(row.i, -1)">−</button>
                      <span>{{ formatQty(row.line.quantity) }}</span>
                      <button type="button" @click.stop="bumpQty(row.i, 1)">+</button>
                    </div>
                  </td>
                  <td class="c-name">{{ row.line.name }}</td>
                  <td class="c-price">{{ money(row.line.price) }}</td>
                  <td class="c-imp">{{ money(lineGross(row.line)) }}</td>
                  <td class="c-act">
                    <button type="button" class="x" @click.stop="removeAt(row.i)" aria-label="Quitar">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!lines.length" class="ticket-empty">
              Escanea productos. El catálogo se administra en Productos.
            </p>
            <div v-if="pageCount > 1" class="ticket-pager">
              <button type="button" :disabled="ticketPage <= 0" @click="ticketPage--">‹</button>
              <span>Pág. {{ ticketPage + 1 }} / {{ pageCount }}</span>
              <button type="button" :disabled="ticketPage >= pageCount - 1" @click="ticketPage++">›</button>
            </div>
          </div>

          <footer class="last-bar">
            <div class="last-thumb hide-mobile" :class="{ empty: !displayLast?.imgUrl }">
              <img v-if="displayLast?.imgUrl" :src="displayLast.imgUrl" alt="" />
              <span v-else>{{ displayLast ? initial(displayLast.name) : '·' }}</span>
            </div>
            <div class="last-meta">
              <template v-if="displayLast">
                <p class="last-name">{{ displayLast.name }}</p>
                <p class="last-math hide-mobile">
                  {{ formatQty(lastLineQty) }} × {{ money(displayLast.price) }}
                  <template v-if="ticketDiscount"> − {{ ticketDiscount }}%</template>
                  = {{ money(lastLineTotal) }}
                </p>
              </template>
              <p v-else class="last-idle">Escanea para agregar</p>
              <p v-if="msg" class="foot-msg">{{ msg }}</p>
            </div>
            <button
              type="button"
              class="btn-cobrar"
              :disabled="!lines.length || sending"
              @click="finalizeOrder"
            >
              {{ sending ? '…' : 'COBRAR' }}
            </button>
          </footer>
        </div>
      </template>

      <!-- ═══════════ MODO CATÁLOGO ═══════════ -->
      <template v-else>
        <div class="sell-toolbar">
          <p class="toolbar-title">Catálogo</p>
          <div class="toolbar-right">
            <button type="button" class="seg" @click="goMode('pos')">Vender</button>
            <button type="button" class="seg on">Editar</button>
          </div>
        </div>

        <div class="manage-body">
          <aside class="cats-rail">
            <button
              v-for="menu in menus"
              :key="menu.id"
              type="button"
              class="cat"
              :class="{ on: selectedMenuId === menu.id }"
              @click="loadMenuProducts(menu.id)"
            >{{ menu.name }}</button>
            <button type="button" class="cat add" @click="showMenuForm = true">+ Categoría</button>
          </aside>

          <section class="grid-pane">
            <div class="products">
              <button
                v-for="producto in productos"
                :key="producto.id"
                type="button"
                class="prod"
                @click="editFood(producto)"
              >
                <div class="thumb" :class="{ empty: !producto.imgUrl }">
                  <img v-if="producto.imgUrl" :src="producto.imgUrl" :alt="producto.name" loading="lazy" />
                  <span v-else class="thumb-letter">{{ initial(producto.name) }}</span>
                </div>
                <div class="prod-meta">
                  <span class="pname">{{ producto.name }}</span>
                  <span class="psku">{{ producto.barcode || producto.sku || 'Sin código' }} · {{ producto.priceIncludesTax ? 'Bruto' : 'Neto' }}</span>
                  <span class="price">{{ money(producto.price) }}</span>
                </div>
              </button>
              <p v-if="!productos.length" class="empty">Crea categorías y productos con su código de barras.</p>
              <button
                v-if="selectedMenuId"
                type="button"
                class="add-food"
                @click="showFoodForm = true"
              >+ Producto</button>
            </div>
          </section>
        </div>
      </template>

      <!-- Precio F4 -->
      <Teleport to="body">
        <div v-if="showPriceCheck" class="sheet-bg" @click.self="closePriceCheck">
          <form class="sheet" @submit.prevent="runPriceCheck">
            <h3>Consulta de precio</h3>
            <p class="sheet-hint">Escanea o escribe el código (F4)</p>
            <input
              ref="priceInput"
              v-model="priceCode"
              class="inp"
              placeholder="Código de barras"
              autocomplete="off"
              autofocus
            />
            <div v-if="priceResult" class="price-card">
              <strong>{{ priceResult.name }}</strong>
              <span>{{ money(priceResult.price) }}</span>
            </div>
            <p v-if="priceErr" class="scan-msg err">{{ priceErr }}</p>
            <button type="submit" class="act primary">Consultar</button>
            <button type="button" class="act" @click="closePriceCheck">Cerrar</button>
          </form>
        </div>
      </Teleport>

      <!-- Descuento F9 -->
      <Teleport to="body">
        <div v-if="showDiscount" class="sheet-bg" @click.self="showDiscount = false">
          <form class="sheet" @submit.prevent="applyDiscount">
            <h3>Descuento del ticket</h3>
            <label class="field">
              <span>Porcentaje (0–100)</span>
              <input v-model.number="discountDraft" class="inp" type="number" min="0" max="100" step="1" />
            </label>
            <button type="submit" class="act primary">Aplicar</button>
            <button type="button" class="act" @click="clearDiscount">Quitar descuento</button>
          </form>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="showMenuForm" class="sheet-bg" @click.self="showMenuForm = false">
          <form class="sheet" @submit.prevent="createMenu">
            <h3>Nueva categoría</h3>
            <input v-model="menuForm.name" class="inp" placeholder="Nombre" required />
            <input v-model="menuForm.description" class="inp" placeholder="Descripción" />
            <button type="submit" class="act primary">Crear</button>
            <button type="button" class="act" @click="showMenuForm = false">Cancelar</button>
          </form>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="showFoodForm" class="sheet-bg" @click.self="closeFoodForm">
          <form class="sheet" @submit.prevent="createFood">
            <h3>{{ editingFood ? 'Editar' : 'Nuevo' }} producto</h3>
            <input v-model="foodForm.name" class="inp" placeholder="Nombre" required />
            <input v-model.number="foodForm.price" class="inp" type="number" min="0" step="0.01" placeholder="Precio" required />
            <fieldset class="price-mode">
              <legend>El precio es</legend>
              <label class="radio">
                <input v-model="foodForm.priceMode" type="radio" value="net" />
                <span>Neto <small>sin IVA — se suma al vender</small></span>
              </label>
              <label class="radio">
                <input v-model="foodForm.priceMode" type="radio" value="gross" />
                <span>Bruto <small>con IVA incluido</small></span>
              </label>
              <p class="price-preview">
                Neto {{ money(foodPricePreview.net) }}
                · IVA {{ money(foodPricePreview.tax) }}
                · Bruto {{ money(foodPricePreview.gross) }}
              </p>
            </fieldset>
            <label class="field">
              <span>Código de barras / SKU</span>
              <input v-model="foodForm.barcode" class="inp" placeholder="Escanea o escribe el código" autocomplete="off" />
            </label>
            <input v-model="foodForm.description" class="inp" placeholder="Descripción" />
            <input v-model="foodForm.imgUrl" class="inp" type="url" placeholder="URL de imagen (https://…)" />
            <div v-if="foodForm.imgUrl" class="preview">
              <img :src="foodForm.imgUrl" alt="Vista previa" />
            </div>
            <button type="submit" class="act primary">Guardar</button>
            <button v-if="editingFood" type="button" class="act danger" @click="deleteFood">Eliminar</button>
            <button type="button" class="act" @click="closeFoodForm">Cancelar</button>
          </form>
        </div>
      </Teleport>
    </div>
  </AppShell>
</template>

<script>
import AppShell from "../components/AppShell.vue";
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiService } from "../apiService";
import { store } from "../store";
import { venueStore } from "../venueStore";
import { cartTotals, lineBreakdown, TAX_RATE } from "../tax";

export default {
  components: { AppShell },
  props: {
    initialMode: { type: String, default: "pos" },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const menus = ref([]);
    const productos = ref([]);
    const selectedMenuId = ref("");
    const mode = ref(props.initialMode === "manage" || route.name === "products" ? "manage" : "pos");

    const scanInput = ref(null);
    const priceInput = ref(null);
    const scanCode = ref("");
    const scanError = ref("");
    const scanFlash = ref(false);
    const lastAdded = ref(null);
    const nameHits = ref([]);
    const scanning = ref(false);
    const selectedIdx = ref(-1);
    const sending = ref(false);
    const msg = ref("");
    const ticketPage = ref(0);
    const PAGE_SIZE = 7;

    const ticketDiscount = ref(0);
    const showDiscount = ref(false);
    const discountDraft = ref(0);
    const showPriceCheck = ref(false);
    const priceCode = ref("");
    const priceResult = ref(null);
    const priceErr = ref("");

    const showMenuForm = ref(false);
    const showFoodForm = ref(false);
    const editingFood = ref(null);
    const menuForm = reactive({ name: "", description: "" });
    const foodForm = reactive({
      name: "",
      price: 0,
      description: "",
      imgUrl: "",
      barcode: "",
      priceMode: "net", // net = neto sin IVA, gross = bruto con IVA
    });

    let flashTimer = null;
    let searchTimer = null;

    const businessName = computed(() => venueStore.businessName || "Tienda");
    const lines = computed(() => store.platillosSeleccionados);
    const itemCount = computed(() =>
      lines.value.reduce((s, p) => s + Number(p.quantity || 0), 0)
    );
    const totals = computed(() =>
      cartTotals(lines.value, {
        discountPercent: ticketDiscount.value,
        taxRate: TAX_RATE,
      })
    );
    const tax = computed(() => totals.value.tax);
    const total = computed(() => totals.value.total);
    const subtotalAfterDiscount = computed(() => totals.value.total - totals.value.tax);

    const foodPricePreview = computed(() => {
      const p = Number(foodForm.price) || 0;
      if (foodForm.priceMode === "gross") {
        const net = TAX_RATE > 0 ? p / (1 + TAX_RATE) : p;
        return { net, tax: p - net, gross: p };
      }
      return { net: p, tax: p * TAX_RATE, gross: p * (1 + TAX_RATE) };
    });

    function lineGross(line) {
      return lineBreakdown(line.price, line.quantity, line.priceIncludesTax, TAX_RATE).gross;
    }

    const displayLast = computed(() => {
      if (lastAdded.value) return lastAdded.value;
      if (selectedIdx.value >= 0 && lines.value[selectedIdx.value]) {
        return lines.value[selectedIdx.value];
      }
      return lines.value.length ? lines.value[lines.value.length - 1] : null;
    });

    const lastLineQty = computed(() => {
      if (!displayLast.value) return 0;
      const found = lines.value.find((l) => l.id === displayLast.value.id);
      return found ? found.quantity : 1;
    });
    const lastLineTotal = computed(() => {
      if (!displayLast.value) return 0;
      const found = lines.value.find((l) => l.id === displayLast.value.id);
      const qty = found ? found.quantity : 1;
      const gross = lineBreakdown(
        displayLast.value.price,
        qty,
        displayLast.value.priceIncludesTax,
        TAX_RATE
      ).gross;
      const d = Math.min(100, Math.max(0, Number(ticketDiscount.value) || 0));
      return gross * (1 - d / 100);
    });

    const pageCount = computed(() =>
      Math.max(1, Math.ceil(lines.value.length / PAGE_SIZE) || 1)
    );
    const pagedRows = computed(() => {
      const start = ticketPage.value * PAGE_SIZE;
      return lines.value.slice(start, start + PAGE_SIZE).map((line, offset) => ({
        line,
        i: start + offset,
      }));
    });

    watch(selectedIdx, (i) => {
      if (i >= 0) ticketPage.value = Math.floor(i / PAGE_SIZE);
    });

    watch(
      () => lines.value.length,
      () => {
        const maxPage = Math.max(0, pageCount.value - 1);
        if (ticketPage.value > maxPage) ticketPage.value = maxPage;
      }
    );

    function money(n) {
      return Number(n || 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    function formatQty(n) {
      const v = Number(n || 0);
      return Number.isInteger(v) ? String(v) : v.toFixed(3);
    }
    function initial(name) {
      return String(name || "?").trim().charAt(0).toUpperCase();
    }

    function focusScan() {
      nextTick(() => {
        if (mode.value === "pos" && !showPriceCheck.value && !showDiscount.value && scanInput.value) {
          scanInput.value.focus();
        }
      });
    }

    function goMode(next) {
      mode.value = next;
      scanCode.value = "";
      scanError.value = "";
      nameHits.value = [];
      router.push(next === "manage" ? "/products" : "/pos");
      if (next === "pos") focusScan();
    }

    function addProduct(producto) {
      const idx = store.platillosSeleccionados.findIndex((p) => p.id === producto.id);
      if (idx >= 0) {
        store.platillosSeleccionados[idx].quantity += 1;
        selectedIdx.value = idx;
      } else {
        store.platillosSeleccionados.push({ ...producto, quantity: 1 });
        selectedIdx.value = store.platillosSeleccionados.length - 1;
      }
      lastAdded.value = producto;
      scanError.value = "";
      nameHits.value = [];
      scanFlash.value = true;
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => {
        scanFlash.value = false;
      }, 220);
      scanCode.value = "";
      focusScan();
    }

    async function onScanEnter() {
      const code = scanCode.value.trim();
      if (!code || scanning.value) return;
      scanning.value = true;
      scanError.value = "";
      nameHits.value = [];
      try {
        const res = await apiService.lookupFood(code);
        if (res && res.id) {
          addProduct(res);
          return;
        }
        const matches = Array.isArray(res?.matches) ? res.matches : [];
        if (matches.length === 1) {
          addProduct(matches[0]);
          return;
        }
        if (matches.length > 1) {
          nameHits.value = matches;
          scanError.value = `${matches.length} coincidencias — elige una`;
          return;
        }
        scanError.value = `No encontrado: ${code}`;
        scanCode.value = "";
        focusScan();
      } catch {
        scanError.value = "Error al buscar producto";
        focusScan();
      } finally {
        scanning.value = false;
      }
    }

    watch(scanCode, (val) => {
      clearTimeout(searchTimer);
      const q = String(val || "").trim();
      if (q.length < 2 || mode.value !== "pos") {
        if (!q) nameHits.value = [];
        return;
      }
      if (/^[0-9]{6,}$/.test(q)) return;
      searchTimer = setTimeout(async () => {
        try {
          const res = await apiService.lookupFood(q);
          if (res?.id) nameHits.value = [res];
          else nameHits.value = Array.isArray(res?.matches) ? res.matches : [];
        } catch {
          nameHits.value = [];
        }
      }, 220);
    });

    function bumpQty(i, delta) {
      const line = store.platillosSeleccionados[i];
      if (!line) return;
      const next = Number(line.quantity) + delta;
      if (next <= 0) removeAt(i);
      else line.quantity = next;
      selectedIdx.value = Math.min(i, store.platillosSeleccionados.length - 1);
      focusScan();
    }

    function removeAt(i) {
      store.platillosSeleccionados.splice(i, 1);
      if (!store.platillosSeleccionados.length) selectedIdx.value = -1;
      else selectedIdx.value = Math.min(i, store.platillosSeleccionados.length - 1);
      focusScan();
    }

    function removeSelected() {
      if (selectedIdx.value < 0) return;
      removeAt(selectedIdx.value);
    }

    function clearCart() {
      store.platillosSeleccionados.splice(0, store.platillosSeleccionados.length);
      selectedIdx.value = -1;
      lastAdded.value = null;
      ticketDiscount.value = 0;
      focusScan();
    }

    function applyDiscount() {
      ticketDiscount.value = Math.min(100, Math.max(0, Number(discountDraft.value) || 0));
      showDiscount.value = false;
      focusScan();
    }
    function clearDiscount() {
      ticketDiscount.value = 0;
      discountDraft.value = 0;
      showDiscount.value = false;
      focusScan();
    }

    function closePriceCheck() {
      showPriceCheck.value = false;
      priceCode.value = "";
      priceResult.value = null;
      priceErr.value = "";
      focusScan();
    }

    async function runPriceCheck() {
      const code = priceCode.value.trim();
      if (!code) return;
      priceErr.value = "";
      priceResult.value = null;
      try {
        const res = await apiService.lookupFood(code);
        if (res?.id) priceResult.value = res;
        else if (res?.matches?.length === 1) priceResult.value = res.matches[0];
        else if (res?.matches?.length > 1) priceErr.value = "Varias coincidencias — sé más específico";
        else priceErr.value = "Producto no encontrado";
      } catch {
        priceErr.value = "Error al consultar";
      }
    }

    async function finalizeOrder() {
      if (!lines.value.length || sending.value) return;
      sending.value = true;
      msg.value = "";
      try {
        const response = await apiService.createOrder({
          tableId: null,
          tableName: "Mostrador",
          modality: "retail",
          status: "pending",
          discountPercent: ticketDiscount.value || 0,
          items: lines.value.map((p) => ({
            foodId: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            priceIncludesTax: Boolean(p.priceIncludesTax),
          })),
        });
        clearCart();
        msg.value = `Ticket ${String(response.id || "").slice(-6)} listo`;
        setTimeout(() => router.push("/orders"), 350);
      } catch (error) {
        msg.value = error.response?.data || "Error al registrar la venta.";
      } finally {
        sending.value = false;
      }
    }

    function onHotkey(e) {
      if (mode.value !== "pos") return;
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "F2") {
        e.preventDefault();
        removeSelected();
      } else if (e.key === "F4") {
        e.preventDefault();
        showPriceCheck.value = true;
        nextTick(() => priceInput.value?.focus());
      } else if (e.key === "F9") {
        e.preventDefault();
        discountDraft.value = ticketDiscount.value;
        showDiscount.value = true;
      } else if (e.key === "F12") {
        e.preventDefault();
        finalizeOrder();
      } else if (!typing && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        removeSelected();
      } else if (!typing && e.key === "ArrowUp") {
        e.preventDefault();
        if (lines.value.length) {
          selectedIdx.value = selectedIdx.value <= 0 ? lines.value.length - 1 : selectedIdx.value - 1;
        }
      } else if (!typing && e.key === "ArrowDown") {
        e.preventDefault();
        if (lines.value.length) {
          selectedIdx.value = (selectedIdx.value + 1) % lines.value.length;
        }
      }
    }

    async function fetchMenus() {
      try {
        menus.value = (await apiService.getAllMenus()) || [];
        if (mode.value === "manage" && menus.value[0]) loadMenuProducts(menus.value[0].id);
      } catch {
        menus.value = [];
      }
    }

    async function loadMenuProducts(menuId) {
      selectedMenuId.value = menuId;
      try {
        const menu = await apiService.getMenuById(menuId);
        productos.value = Array.isArray(menu.foods) ? menu.foods : [];
      } catch {
        productos.value = [];
      }
    }

    async function createMenu() {
      const created = await apiService.createMenu({ ...menuForm });
      menus.value.push(created);
      menuForm.name = "";
      menuForm.description = "";
      showMenuForm.value = false;
      loadMenuProducts(created.id);
    }

    function editFood(producto) {
      editingFood.value = producto;
      foodForm.name = producto.name;
      foodForm.price = producto.price;
      foodForm.description = producto.description || "";
      foodForm.imgUrl = producto.imgUrl || "";
      foodForm.barcode = producto.barcode || producto.sku || "";
      foodForm.priceMode = producto.priceIncludesTax ? "gross" : "net";
      showFoodForm.value = true;
    }

    function closeFoodForm() {
      showFoodForm.value = false;
      editingFood.value = null;
      foodForm.name = "";
      foodForm.price = 0;
      foodForm.description = "";
      foodForm.imgUrl = "";
      foodForm.barcode = "";
      foodForm.priceMode = "net";
    }

    async function createFood() {
      const payload = {
        name: foodForm.name,
        price: foodForm.price,
        description: foodForm.description,
        imgUrl: (foodForm.imgUrl || "").trim(),
        barcode: (foodForm.barcode || "").trim(),
        sku: (foodForm.barcode || "").trim(),
        priceIncludesTax: foodForm.priceMode === "gross",
        menuId: selectedMenuId.value,
      };
      if (editingFood.value) {
        const updated = await apiService.editFood(editingFood.value.id, payload);
        const idx = productos.value.findIndex((p) => p.id === updated.id);
        if (idx >= 0) productos.value[idx] = updated;
      } else {
        productos.value.push(await apiService.createFood(payload));
      }
      closeFoodForm();
    }

    async function deleteFood() {
      if (!editingFood.value) return;
      await apiService.deleteFood(editingFood.value.id);
      productos.value = productos.value.filter((p) => p.id !== editingFood.value.id);
      closeFoodForm();
    }

    watch(
      () => route.name,
      (name) => {
        mode.value = name === "products" ? "manage" : "pos";
        if (mode.value === "pos") focusScan();
        else if (menus.value[0] && !selectedMenuId.value) loadMenuProducts(menus.value[0].id);
      }
    );

    watch(showPriceCheck, (v) => {
      if (v) nextTick(() => priceInput.value?.focus());
    });

    onMounted(async () => {
      await fetchMenus();
      focusScan();
      window.addEventListener("keydown", onHotkey);
      window.addEventListener("focus", focusScan);
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", onHotkey);
      window.removeEventListener("focus", focusScan);
      clearTimeout(flashTimer);
      clearTimeout(searchTimer);
    });

    return {
      mode,
      menus,
      productos,
      selectedMenuId,
      businessName,
      scanInput,
      priceInput,
      scanCode,
      scanError,
      scanFlash,
      lastAdded,
      displayLast,
      nameHits,
      lines,
      itemCount,
      totals,
      subtotalAfterDiscount,
      tax,
      total,
      selectedIdx,
      sending,
      msg,
      ticketDiscount,
      showDiscount,
      discountDraft,
      showPriceCheck,
      priceCode,
      priceResult,
      priceErr,
      showMenuForm,
      showFoodForm,
      menuForm,
      foodForm,
      foodPricePreview,
      editingFood,
      lastLineQty,
      lastLineTotal,
      ticketPage,
      pageCount,
      pagedRows,
      goMode,
      onScanEnter,
      addProduct,
      bumpQty,
      removeAt,
      removeSelected,
      clearCart,
      finalizeOrder,
      applyDiscount,
      clearDiscount,
      closePriceCheck,
      runPriceCheck,
      loadMenuProducts,
      createMenu,
      createFood,
      editFood,
      closeFoodForm,
      deleteFood,
      lineGross,
      money,
      formatQty,
      initial,
    };
  },
};
</script>

<style scoped>
.pos {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--timber-surface);
  overflow: hidden;
}

/* —— Escritorio POS —— */
.desk {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--timber-panel);
  overflow: hidden;
}

.fkey-bar {
  display: flex;
  gap: 0.3rem;
  padding: 0.3rem 0.4rem;
  overflow-x: auto;
  background: var(--timber-topbar);
  border-bottom: 1px solid color-mix(in srgb, var(--timber-topbar-text) 12%, transparent);
  flex-shrink: 0;
}
.fkey {
  flex: 0 0 auto;
  min-width: 4.2rem;
  min-height: 2.55rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid color-mix(in srgb, var(--timber-topbar-text) 18%, transparent);
  border-radius: 0.45rem;
  background: color-mix(in srgb, #fff 8%, transparent);
  color: var(--timber-topbar-text);
  display: grid;
  place-content: center;
  gap: 0.05rem;
  cursor: pointer;
  font: inherit;
}
.fkey:disabled { opacity: 0.35; cursor: not-allowed; }
.fkey .fk {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  opacity: 0.7;
}
.fkey .fl { font-size: 0.78rem; font-weight: 700; }
.fkey.accent {
  background: var(--timber-accent);
  color: #1a1208;
  border-color: transparent;
}
.fkey.ghost { opacity: 0.85; }

.status-bar {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.65rem 1rem;
  padding: 0.22rem 0.65rem;
  background: color-mix(in srgb, var(--timber-primary) 88%, #0a1a30);
  color: #dce8f6;
  font-size: 0.72rem;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}
.status-hint { margin-left: auto; opacity: 0.75; font-weight: 500; white-space: nowrap; }

.desk-top {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  background: var(--timber-surface);
  border-bottom: 1px solid var(--timber-line);
  flex-shrink: 0;
}

.scan-box {
  position: relative;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  border-radius: 0.6rem;
  padding: 0.4rem 0.55rem 0.45rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.scan-box.flash {
  border-color: var(--timber-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--timber-success) 22%, transparent);
}
.scan-box.err { border-color: var(--timber-danger); }
.scan-label {
  display: block;
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--timber-muted);
}
.scan-input {
  width: 100%;
  min-height: 2.65rem;
  border: 2px solid var(--timber-ink);
  border-radius: 0.45rem;
  padding: 0.35rem 0.65rem;
  font: inherit;
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  box-sizing: border-box;
}
.scan-msg { margin: 0.25rem 0 0; font-size: 0.8rem; font-weight: 700; }
.scan-msg.ok { color: var(--timber-success); }
.scan-msg.err { color: var(--timber-danger); }

.hits {
  position: absolute;
  left: 0.4rem;
  right: 0.4rem;
  top: calc(100% - 0.15rem);
  z-index: 20;
  display: grid;
  gap: 0.25rem;
  max-height: 10rem;
  overflow: auto;
  padding: 0.35rem;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  border-radius: 0.55rem;
  box-shadow: var(--timber-shadow);
}
.hit {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  text-align: left;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.55rem;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  font-weight: 600;
  cursor: pointer;
}

.total-box {
  background: #0d1624;
  color: #e8eef6;
  border-radius: 0.6rem;
  padding: 0.45rem 0.75rem;
  display: grid;
  align-content: center;
  gap: 0.05rem;
}
.arts {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8eb4e0;
}
.total-label {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7a8ea8;
}
.total-num {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 4.5vw, 2.35rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: #5ec8ff;
  line-height: 1.05;
}
.tax-line {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: #8a9bb0;
}

.ticket-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: var(--timber-panel);
  position: relative;
  display: flex;
  flex-direction: column;
}
.ticket-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}
.ticket-table th {
  background: var(--timber-panel-elevated);
  border-bottom: 1px solid var(--timber-line);
  padding: 0.4rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--timber-muted);
}
.ticket-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--timber-line);
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ticket-table tbody tr {
  cursor: pointer;
}
.ticket-table tbody tr.on {
  background: color-mix(in srgb, var(--timber-primary) 12%, transparent);
}
.ticket-table tbody tr:hover {
  background: color-mix(in srgb, var(--timber-primary) 6%, transparent);
}
.c-code {
  width: 18%;
  text-align: left;
  color: var(--timber-muted);
  font-size: 0.8rem;
}
.c-qty {
  width: 7.5rem;
  text-align: center;
}
.c-name {
  width: auto;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  white-space: normal;
  line-height: 1.2;
}
.c-price,
.c-imp {
  width: 16%;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.c-imp { font-weight: 800; }
.c-act {
  width: 2.5rem;
  text-align: center;
}
.ticket-table th.c-qty,
.ticket-table th.c-price,
.ticket-table th.c-imp,
.ticket-table th.c-act { text-align: center; }
.ticket-table th.c-price,
.ticket-table th.c-imp { text-align: right; }
.ticket-table th.c-code,
.ticket-table th.c-name { text-align: left; }

.qty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  background: var(--timber-surface);
  border-radius: 0.45rem;
  padding: 0.1rem;
  margin: 0 auto;
}
.qty button {
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  border-radius: 0.35rem;
  background: var(--timber-panel);
  color: var(--timber-ink);
  font-weight: 800;
  cursor: pointer;
}
.qty span { min-width: 1.6rem; text-align: center; font-weight: 800; }
.x {
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  border-radius: 0.35rem;
  background: var(--timber-surface);
  color: var(--timber-muted);
  font-size: 1.1rem;
  cursor: pointer;
}
.ticket-empty {
  margin: auto;
  padding: 1rem;
  text-align: center;
  color: var(--timber-muted);
  font-size: 0.9rem;
}
.ticket-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.3rem;
  border-top: 1px solid var(--timber-line);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--timber-muted);
  flex-shrink: 0;
}
.ticket-pager button {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.4rem;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  font-weight: 800;
  cursor: pointer;
}
.ticket-pager button:disabled { opacity: 0.35; }

.last-bar {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.55rem;
  border-top: 1px solid var(--timber-line);
  background: var(--timber-panel-elevated);
  flex-shrink: 0;
  margin-top: auto;
}
.last-meta {
  flex: 1;
  min-width: 0;
}
.last-thumb {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.45rem;
  overflow: hidden;
  background: var(--timber-surface);
  display: grid;
  place-items: center;
  font-weight: 800;
  color: var(--timber-primary);
  font-size: 1rem;
  flex-shrink: 0;
}
.last-thumb img { width: 100%; height: 100%; object-fit: cover; }
.last-name {
  margin: 0;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--timber-success);
  font-size: 0.95rem;
  line-height: 1.2;
}
.last-math {
  margin: 0.15rem 0 0;
  font-weight: 700;
  color: var(--timber-accent);
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
}
.last-idle { margin: 0; color: var(--timber-muted); font-size: 0.88rem; }
.btn-cobrar {
  min-height: 2.85rem;
  min-width: 6.8rem;
  padding: 0 0.9rem;
  border: none;
  border-radius: 0.55rem;
  background: var(--timber-accent);
  color: #1a1208;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(224, 138, 30, 0.28);
  flex-shrink: 0;
}
.btn-cobrar:disabled { opacity: 0.45; cursor: not-allowed; }
.foot-msg {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--timber-success);
}

.price-card {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border-radius: 0.75rem;
  background: var(--timber-surface);
  border: 1px solid var(--timber-line);
}
.price-card strong { font-size: 1.05rem; }
.price-card span {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--timber-primary);
  font-variant-numeric: tabular-nums;
}

/* —— Catálogo —— */
.sell-toolbar {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  background: var(--timber-panel);
  border-bottom: 1px solid var(--timber-line);
  flex-shrink: 0;
}
.toolbar-title {
  margin: 0;
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
}
.toolbar-right {
  display: flex;
  background: var(--timber-surface);
  border-radius: 0.7rem;
  padding: 0.15rem;
  border: 1px solid var(--timber-line);
}
.seg {
  min-height: 2.6rem;
  padding: 0 0.9rem;
  border: none;
  border-radius: 0.55rem;
  background: transparent;
  color: var(--timber-muted);
  font-weight: 700;
  cursor: pointer;
}
.seg.on {
  background: var(--timber-primary);
  color: var(--timber-on-primary);
}
.manage-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}
.cats-rail {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.55rem 0.65rem;
  background: var(--timber-panel);
  border-bottom: 1px solid var(--timber-line);
}
.cat {
  flex: 0 0 auto;
  min-height: 2.75rem;
  padding: 0 0.95rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.65rem;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  white-space: nowrap;
}
.cat.on {
  background: var(--timber-ink);
  color: var(--timber-panel);
  border-color: transparent;
}
.cat.add {
  border-style: dashed;
  color: var(--timber-primary);
}
.grid-pane {
  min-height: 0;
  overflow: auto;
  padding: 0.55rem;
}
.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.45rem;
}
.prod {
  border: 1px solid var(--timber-line);
  border-radius: 0.85rem;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  cursor: pointer;
  text-align: left;
  min-height: 8.2rem;
}
.thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.6rem;
  overflow: hidden;
  background: var(--timber-surface);
  display: grid;
  place-items: center;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-letter {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--timber-primary);
  opacity: 0.55;
}
.prod-meta { display: grid; gap: 0.1rem; padding: 0 0.15rem 0.15rem; }
.pname {
  font-weight: 700;
  font-size: 0.82rem;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.psku {
  font-size: 0.68rem;
  color: var(--timber-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.price {
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--timber-primary);
}
.empty { color: var(--timber-muted); grid-column: 1 / -1; margin: 1.5rem 0; text-align: center; }
.add-food {
  grid-column: 1 / -1;
  min-height: 3rem;
  border: 1px dashed var(--timber-primary);
  border-radius: 0.85rem;
  background: transparent;
  color: var(--timber-primary);
  font-weight: 700;
  cursor: pointer;
}

.sheet-bg {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(10, 18, 32, 0.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: min(28rem, 100%);
  background: var(--timber-panel);
  color: var(--timber-ink);
  border-radius: 1.2rem 1.2rem 0 0;
  padding: 1rem 1rem calc(1.2rem + env(safe-area-inset-bottom));
  display: grid;
  gap: 0.55rem;
  border: 1px solid var(--timber-line);
}
.sheet h3 { margin: 0; font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
.sheet-hint { margin: -0.25rem 0 0; color: var(--timber-muted); font-size: 0.88rem; }
.field { display: grid; gap: 0.3rem; font-size: 0.82rem; font-weight: 700; color: var(--timber-muted); }
.price-mode {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.75rem;
  display: grid;
  gap: 0.45rem;
  background: var(--timber-surface);
}
.price-mode legend {
  padding: 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--timber-muted);
}
.price-mode .radio {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-weight: 700;
  color: var(--timber-ink);
  cursor: pointer;
}
.price-mode .radio small {
  display: block;
  font-weight: 500;
  color: var(--timber-muted);
  font-size: 0.78rem;
  margin-top: 0.1rem;
}
.price-mode input[type="radio"] {
  margin-top: 0.2rem;
  accent-color: var(--timber-primary);
}
.price-preview {
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--timber-primary);
}
.inp {
  min-height: 3rem;
  border: 1px solid var(--timber-line);
  border-radius: 0.75rem;
  padding: 0.65rem 0.8rem;
  font: inherit;
  background: var(--timber-panel-elevated);
  color: var(--timber-ink);
  width: 100%;
  box-sizing: border-box;
}
.act {
  min-height: 3.2rem;
  border: none;
  border-radius: 0.85rem;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  background: var(--timber-surface);
  color: var(--timber-ink);
}
.act.primary { background: var(--timber-primary); color: var(--timber-on-primary); }
.act.danger { background: var(--timber-danger-soft); color: var(--timber-danger); }
.preview {
  width: 100%; aspect-ratio: 16/9; border-radius: 0.75rem; overflow: hidden;
  background: var(--timber-surface); border: 1px solid var(--timber-line);
}
.preview img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 767.98px) {
  .fkey {
    min-width: 0;
    flex: 1;
    min-height: 2.75rem;
  }
  .fkey .fl { font-size: 0.78rem; }
  .desk-top {
    grid-template-columns: 1fr;
    gap: 0.35rem;
    padding: 0.35rem 0.45rem;
  }
  .total-box {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
  }
  .total-box .arts,
  .total-box .tax-line { display: none; }
  .total-label { margin: 0; }
  .total-num {
    font-size: 1.55rem;
    margin: 0;
  }
  .scan-input { min-height: 2.85rem; font-size: 1.05rem; }
  .c-code,
  .c-price,
  .ticket-table th.c-code,
  .ticket-table th.c-price { display: none; }
  .c-qty { width: 6.5rem; }
  .c-imp { width: 28%; }
  .btn-cobrar {
    min-width: 6.2rem;
    min-height: 3.1rem;
    font-size: 1rem;
  }
  .toolbar-right { display: none; }
}

@media (min-width: 768px) and (max-width: 1099.98px) {
  .desk-top {
    grid-template-columns: 1.2fr 0.8fr;
  }
  .fkey { min-width: 4.4rem; }
  .total-num { font-size: 2rem; }
  .manage-body {
    grid-template-columns: 8.5rem 1fr;
    grid-template-rows: 1fr;
  }
  .cats-rail {
    flex-direction: column;
    overflow: hidden;
    border-bottom: none;
    border-right: 1px solid var(--timber-line);
  }
  .cat { width: 100%; white-space: normal; text-align: left; }
  .c-code { width: 14%; }
  .sheet-bg { align-items: center; padding: 1rem; }
  .sheet { border-radius: 1.15rem; }
}

@media (min-width: 1100px) {
  .desk-top {
    grid-template-columns: minmax(18rem, 1.15fr) minmax(14rem, 0.7fr);
  }
  .total-num { font-size: 2.55rem; }
  .fkey { min-width: 5rem; min-height: 2.85rem; }
  .manage-body {
    grid-template-columns: 10rem 1fr;
    grid-template-rows: 1fr;
  }
  .cats-rail {
    flex-direction: column;
    overflow: hidden;
    border-bottom: none;
    border-right: 1px solid var(--timber-line);
  }
  .cat { width: 100%; white-space: normal; text-align: left; }
  .sheet-bg { align-items: center; padding: 1rem; }
  .sheet { border-radius: 1.15rem; }
  .toolbar-right .seg:first-child { display: none; }
}

</style>
