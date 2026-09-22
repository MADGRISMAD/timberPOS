<template>
  <div class="landing" ref="root" @scroll.passive="onScroll">
    <header class="nav">
      <a href="#top" class="nav-brand">
        <img src="/logo.svg" alt="" width="36" height="36" />
        <span>Timber</span>
      </a>
      <nav class="nav-links" aria-label="Secciones">
        <a href="#dispositivos">Dispositivos</a>
        <a href="#nube">Nube</a>
        <a href="#inventario-magico">Inventario Mágico</a>
        <a href="#planes">Planes</a>
        <a href="#hardware">Hardware</a>
      </nav>
      <div class="nav-actions">
        <template v-if="loggedIn">
          <router-link class="btn ghost" :to="{ name: homeRoute }">Ir al sistema</router-link>
        </template>
        <template v-else>
          <router-link class="btn ghost" to="/login">Ingresar</router-link>
          <router-link class="btn amber" to="/register">Probar gratis</router-link>
        </template>
      </div>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-copy">
            <p class="eyebrow">POS en la nube para abarrotes</p>
            <h1>Timber</h1>
            <p class="hero-line">
              La misma caja en el celular, la tablet o la PC. Sin instalar.
            </p>
            <div class="hero-cta">
              <router-link v-if="!loggedIn" class="btn amber lg" to="/register">
                Empezar prueba gratis
              </router-link>
              <router-link v-else class="btn amber lg" :to="{ name: homeRoute }">
                Abrir caja
              </router-link>
              <a class="btn line lg" href="#inventario-magico">Ver Inventario Mágico</a>
            </div>
          </div>
          <div class="hero-visual" aria-hidden="true" :style="drift(0.08)">
            <div class="shot">
              <div class="shot-top">
                <img src="/logo.svg" alt="" width="18" height="18" />
                <span>Abarrotes López</span>
                <span class="shot-nav on">Vender</span>
                <span class="shot-nav">Productos</span>
                <span class="shot-nav">Caja</span>
                <span class="shot-clock">14:32</span>
              </div>
              <div class="shot-fkeys">
                <span>F2 Anular</span>
                <span>F4 Precio</span>
                <span>F9 Dcto</span>
                <span class="cobrar">F12 Cobrar</span>
              </div>
              <div class="shot-status">
                <span>Abarrotes López</span>
                <span>2 arts</span>
                <span class="hint">Escáner listo</span>
              </div>
              <div class="shot-desk">
                <div class="shot-scan">
                  <span>Código / búsqueda</span>
                  <div>7501234567890</div>
                </div>
                <div class="shot-total">
                  <p>2 arts</p>
                  <p class="lbl">Total</p>
                  <strong>$40.00</strong>
                  <p class="tax">IVA $5.52 · Neto $34.48</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cant.</th>
                    <th>Descripción</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="on">
                    <td>750123</td>
                    <td>1</td>
                    <td>Coca 600 ml</td>
                    <td>$22.00</td>
                  </tr>
                  <tr>
                    <td>750456</td>
                    <td>1</td>
                    <td>Sabritas</td>
                    <td>$18.00</td>
                  </tr>
                </tbody>
              </table>
              <div class="shot-foot">
                <div>
                  <strong>Coca 600 ml</strong>
                  <span>1 × $22.00 = $22.00</span>
                </div>
                <span class="cobrar">COBRAR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dispositivos" class="band devices-band">
        <div class="section">
          <p class="section-kicker">Donde cobras</p>
          <h2>Celular, tablet o computadora</h2>
          <p class="section-lede">
            Abres el navegador y ya estás en caja. Si se daña un equipo, entras desde otro.
          </p>
          <div class="device-row" :style="drift(0.05)">
            <figure>
              <div class="device phone">
                <div class="bezel">
                  <span class="notch" aria-hidden="true"></span>
                  <div class="screen">
                    <p>Vender</p>
                    <strong>$40.00</strong>
                  </div>
                </div>
              </div>
              <figcaption>Celular</figcaption>
            </figure>
            <figure>
              <div class="device tablet">
                <div class="bezel">
                  <span class="cam" aria-hidden="true"></span>
                  <div class="screen">
                    <p>Ticket · 2 arts</p>
                    <strong>$40.00</strong>
                  </div>
                </div>
              </div>
              <figcaption>Tablet</figcaption>
            </figure>
            <figure>
              <div class="device pc">
                <div class="monitor">
                  <div class="bezel">
                    <div class="screen">
                      <p>Escáner listo</p>
                      <strong class="pay">COBRAR</strong>
                    </div>
                  </div>
                  <span class="neck" aria-hidden="true"></span>
                  <span class="base" aria-hidden="true"></span>
                </div>
              </div>
              <figcaption>Computadora</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="nube" class="band cloud">
        <div class="section">
          <p class="section-kicker">100% nube</p>
          <h2>Superior a los sistemas locales</h2>
          <p class="section-lede">
            Cero instalaciones. Cero bases de datos en la PC del cajero.
            Si la computadora falla, abres Timber en una tablet o el celular y sigues cobrando.
          </p>
          <ul class="pillars">
            <li>
              <h3>Cero rescates técnicos</h3>
              <p>
                Sin instalar nada ni bases de datos locales.
                Virus o disco muerto ya no paralizan la tienda.
              </p>
            </li>
            <li>
              <h3>Mejoras al instante</h3>
              <p>
                Cada función nueva llega a todas las tiendas al refrescar.
                Sin parches ni visitas al local.
              </p>
            </li>
            <li>
              <h3>Ventas desde donde estés</h3>
              <p>
                Mira el día desde el teléfono, sin esperar el corte de la noche.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section id="inventario-magico" class="band magic">
        <div class="section">
          <p class="section-kicker">Función estrella</p>
          <h2>¿Qué es Inventario Mágico?</h2>
          <p class="section-lede">
            El dueño anota en un papelito: “Coca 600ml a 22, Sabritas a 18”.
            Pega ese texto (o una foto de la factura del camión) y Timber actualiza
            el catálogo solo — sin buscar producto por producto.
          </p>

          <div class="magic-flow">
            <article>
              <span class="step">1</span>
              <h3>Escribes o pegas</h3>
              <p>El bloc de notas con precios nuevos, tal como lo tienes.</p>
            </article>
            <article>
              <span class="step">2</span>
              <h3>La nube entiende</h3>
              <p>
                La IA vive en la nube: el hardware viejo de la tienda no tiene que
                procesar nada pesado.
              </p>
            </article>
            <article>
              <span class="step">3</span>
              <h3>Catálogo al día</h3>
              <p>Precios (y en Pro, costos de factura) aplicados en segundos.</p>
            </article>
          </div>

          <div class="magic-example" aria-label="Ejemplo">
            <pre>Coca 600ml a 22
Sabritas a 18
Aceite 1L  48 pesos</pre>
            <span class="arrow" aria-hidden="true">→</span>
            <ul>
              <li>Coca 600 ml · <strong>$22.00</strong></li>
              <li>Sabritas · <strong>$18.00</strong></li>
              <li>Aceite 1 L · <strong>$48.00</strong></li>
            </ul>
          </div>

          <p class="magic-note">
            Incluido en todos los planes, con distinta cantidad de usos al mes.
            En Pro también lee la foto de la factura impresa del proveedor.
          </p>
        </div>
      </section>

      <section id="planes" class="band plans">
        <div class="section">
          <p class="section-kicker">Precios claros</p>
          <h2>Elige tu ritmo</h2>
          <p class="section-lede">
            Prueba 14 días. Cancela cuando quieras. Pagos en MXN.
          </p>

          <div class="plan-grid">
            <article v-for="p in plans" :key="p.id" :class="{ hot: p.highlight }">
              <p v-if="p.badge" class="badge">{{ p.badge }}</p>
              <h3>{{ p.name }}</h3>
              <p class="tag">{{ p.tagline }}</p>
              <p class="price">${{ formatInt(p.price) }} <span>/ mes</span></p>
              <p class="im-line">
                <InventarioMagicoTerm /> · {{ p.aiQuotaLabel }}
              </p>
              <ul>
                <li v-for="(f, i) in p.features" :key="i">{{ f }}</li>
              </ul>
              <router-link
                class="btn"
                :class="p.highlight ? 'amber' : 'blue'"
                :to="loggedIn ? { name: 'billing' } : '/register'"
              >
                {{ loggedIn ? "Ver en facturación" : "Empezar" }}
              </router-link>
            </article>
          </div>

          <aside class="plan-extra">
            <p>
              También hay <strong>licencia perpetua</strong> por $4,990, pago único,
              si prefieres no pagar cada mes.
            </p>
            <router-link :to="loggedIn ? { name: 'billing' } : '/register'">
              Preguntar
            </router-link>
          </aside>
        </div>
      </section>

      <section id="hardware" class="band hardware">
        <div class="section">
          <p class="section-kicker">Equipo</p>
          <h2>Si lo necesitas, vendemos el hardware</h2>
          <p class="section-lede">
            Puedes usar el celular, tablet o PC que ya tienes.
            Si prefieres no andar comprando por tu cuenta, te vendemos e instalamos
            tablet, impresora térmica, escáner o terminal All-in-One.
          </p>
          <ul class="hw-list">
            <li>Tablet para caja</li>
            <li>Impresora de tickets 80 mm</li>
            <li>Escáner de códigos</li>
            <li>Terminal All-in-One</li>
          </ul>
        </div>
      </section>

      <section class="band final-cta">
        <div class="section">
          <h2>Deja el disco duro local atrás</h2>
          <p>
            Tu caja en celular, tablet o PC — en la nube.
          </p>
          <router-link v-if="!loggedIn" class="btn amber lg" to="/register">
            Crear cuenta gratis
          </router-link>
          <router-link v-else class="btn amber lg" :to="{ name: homeRoute }">
            Ir al sistema
          </router-link>
        </div>
      </section>
    </main>

    <footer class="foot">
      <span>Timber</span>
      <router-link to="/login">Ingresar</router-link>
      <router-link to="/register">Registro</router-link>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { apiService } from "../apiService";
import { authStore, homeForRole } from "../authStore";
import InventarioMagicoTerm from "../components/InventarioMagicoTerm.vue";

const route = useRoute();
const root = ref(null);
const scrollY = ref(0);
const reduceMotion = ref(false);
let raf = 0;
let pendingScroll = 0;
const plans = ref([]);
const loggedIn = computed(() => Boolean(authStore.token));
const homeRoute = computed(() => homeForRole());

function formatInt(n) {
  return Number(n || 0).toLocaleString("es-MX");
}

function drift(speed) {
  if (reduceMotion.value) return undefined;
  const y = Math.round(scrollY.value * speed * -1);
  return { transform: `translate3d(0, ${y}px, 0)` };
}

function onScroll(event) {
  pendingScroll = event?.target?.scrollTop || 0;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    scrollY.value = pendingScroll;
    raf = 0;
  });
}

const fallbackPlans = [
  {
    id: "basic",
    name: "Básico",
    tagline: "Entra desde cualquier pantalla y cobra",
    price: 150,
    aiQuotaLabel: "2 al mes",
    highlight: false,
    badge: null,
    features: [
      "Sin instalar nada",
      "Inventario y ventas en la nube",
      "Inventario Mágico: 2 al mes",
      "Tickets 80 mm · 1 sucursal",
    ],
  },
  {
    id: "growth",
    name: "Crecimiento",
    tagline: "Pedidos y cobro donde estés",
    price: 399,
    aiQuotaLabel: "10 al mes",
    highlight: true,
    badge: "Recomendado",
    features: [
      "Todo lo del Básico",
      "Inventario Mágico: 10 al mes",
      "WhatsApp y delivery en una pantalla",
      "Cobro en pasillo con el celular",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Varias sucursales, un solo tablero",
    price: 799,
    aiQuotaLabel: "Ilimitado",
    highlight: false,
    badge: null,
    features: [
      "Todo lo de Crecimiento",
      "Inventario Mágico ilimitado",
      "Foto de facturas de proveedores",
      "Tablero de todas las sucursales",
    ],
  },
];

async function loadPlans() {
  try {
    const res = await apiService.getBillingPlans();
    plans.value = res.plans?.length ? res.plans : fallbackPlans;
  } catch {
    plans.value = fallbackPlans;
  }
}

function scrollToHash() {
  const hash = route.hash?.replace("#", "");
  if (!hash) return;
  nextTick(() => {
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

onMounted(async () => {
  reduceMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await loadPlans();
  scrollToHash();
});

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf);
});

watch(() => route.hash, scrollToHash);
</script>

<style scoped>
.landing {
  position: relative;
  height: 100%;
  overflow: auto;
  background: var(--timber-surface);
  color: var(--timber-ink);
  font-family: var(--font-sans);
}

.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.45rem 1rem;
  background: var(--timber-topbar);
  color: var(--timber-topbar-text);
}
.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #fff;
  font-weight: 800;
  font-family: var(--font-display);
  font-size: 1.05rem;
}
.nav-brand img { border-radius: 0.4rem; }
.nav-links { display: none; gap: 1rem; }
.nav-links a {
  color: color-mix(in srgb, var(--timber-topbar-text) 72%, transparent);
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 700;
}
.nav-links a:hover { color: #fff; }
.nav-actions { margin-left: auto; display: flex; gap: 0.4rem; }
@media (min-width: 880px) {
  .nav-links { display: flex; }
  .nav { padding-inline: 1.5rem; }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  padding: 0 0.9rem;
  border-radius: 0.55rem;
  font-weight: 800;
  font-size: 0.86rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
}
.btn.lg { min-height: 2.85rem; padding: 0 1.15rem; font-size: 0.95rem; }
.btn.blue {
  background: var(--timber-primary);
  color: var(--timber-on-primary);
}
.btn.amber {
  background: var(--timber-accent);
  color: #1a1208;
}
.btn.ghost {
  background: transparent;
  color: var(--timber-topbar-text);
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.btn.line {
  background: var(--timber-panel);
  color: var(--timber-ink);
  border: 1px solid var(--timber-line);
}

.hero {
  position: relative;
  z-index: 1;
  padding: 2.25rem 1.15rem 2.75rem;
  background: var(--timber-topbar);
  color: var(--timber-topbar-text);
  overflow: hidden;
}
.hero .btn.line {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.hero-inner {
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 2rem;
  align-items: center;
}
@media (min-width: 960px) {
  .hero { padding: 3rem 1.75rem 3.5rem; }
  .hero-inner { grid-template-columns: 0.9fr 1.1fr; gap: 2.5rem; }
}
.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9ec4ef;
}
.hero h1 {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #ffffff;
}
.hero-line {
  margin: 0.85rem 0 0;
  max-width: 22rem;
  font-size: 1.05rem;
  line-height: 1.45;
  color: #d6e4f5;
}
.hero-cta { margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }

.device-row {
  margin-top: 1.5rem;
  display: grid;
  gap: 1.25rem;
  justify-items: center;
}
@media (min-width: 800px) {
  .device-row { grid-template-columns: repeat(3, 1fr); align-items: end; }
}
.device-row figure { margin: 0; text-align: center; }
.device-row figcaption {
  margin-top: 0.75rem;
  font-weight: 800;
}
.device { margin: 0 auto; }
.bezel {
  position: relative;
  background: #1a2332;
  box-shadow: var(--timber-shadow);
}
.screen {
  background: var(--timber-panel);
  color: var(--timber-ink);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.2rem;
}
.screen p {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--timber-muted);
}
.screen strong { font-size: 1.05rem; color: var(--timber-primary); }

.phone .bezel {
  width: 8.2rem;
  height: 15.4rem;
  padding: 0.85rem 0.45rem 0.55rem;
  border-radius: 1.55rem;
  border: 3px solid #0e1520;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.phone .notch {
  position: absolute;
  top: 0.38rem;
  left: 50%;
  width: 2.6rem;
  height: 0.42rem;
  margin-left: -1.3rem;
  border-radius: 999px;
  background: #0e1520;
}
.phone .screen {
  flex: 1;
  border-radius: 1.05rem;
}

.tablet .bezel {
  width: 13.5rem;
  height: 9.4rem;
  padding: 0.5rem 0.5rem 0.5rem 0.85rem;
  border-radius: 1rem;
  border: 3px solid #0e1520;
  display: flex;
  box-sizing: border-box;
}
.tablet .cam {
  position: absolute;
  left: 0.32rem;
  top: 50%;
  width: 0.32rem;
  height: 0.32rem;
  margin-top: -0.16rem;
  border-radius: 50%;
  background: #3a4658;
}
.tablet .screen {
  flex: 1;
  border-radius: 0.4rem;
}

.pc .monitor { width: 15rem; }
.pc .bezel {
  padding: 0.45rem 0.45rem 0.7rem;
  border-radius: 0.55rem 0.55rem 0.2rem 0.2rem;
  border: 3px solid #0e1520;
}
.pc .screen {
  height: 8.2rem;
  border-radius: 0.2rem;
}
.pc .pay {
  background: var(--timber-accent);
  color: #1a1208;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  padding: 0.28rem 0.5rem;
  border-radius: 0.3rem;
}
.pc .neck {
  display: block;
  width: 1.6rem;
  height: 1.15rem;
  margin: 0 auto;
  background: #1a2332;
}
.pc .base {
  display: block;
  width: 5.2rem;
  height: 0.38rem;
  margin: 0 auto;
  border-radius: 0 0 0.35rem 0.35rem;
  background: #0e1520;
}

.hero-visual {
  display: flex;
  justify-content: center;
  will-change: transform;
}
.shot {
  width: min(100%, 34rem);
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  box-shadow: var(--timber-shadow);
  font-size: 0.72rem;
  color: var(--timber-ink);
}
.shot-top {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.5rem;
  background: var(--timber-topbar);
  color: var(--timber-topbar-text);
  font-weight: 700;
}
.shot-top img { border-radius: 0.3rem; }
.shot-nav {
  padding: 0.2rem 0.45rem;
  border-radius: 0.35rem;
  color: color-mix(in srgb, var(--timber-topbar-text) 75%, transparent);
  font-weight: 700;
}
.shot-nav.on { background: rgba(255, 255, 255, 0.14); color: #fff; }
.shot-clock { margin-left: auto; font-variant-numeric: tabular-nums; opacity: 0.85; }
.shot-fkeys {
  display: flex;
  gap: 0.25rem;
  padding: 0.28rem 0.4rem;
  background: var(--timber-topbar);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.shot-fkeys span {
  padding: 0.28rem 0.4rem;
  border-radius: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--timber-topbar-text);
  font-weight: 700;
}
.cobrar {
  background: var(--timber-accent);
  color: #1a1208 !important;
  border-color: transparent !important;
  font-weight: 800;
}
.shot-status {
  display: flex;
  gap: 0.75rem;
  padding: 0.22rem 0.55rem;
  background: color-mix(in srgb, var(--timber-primary) 88%, #0a1a30);
  color: #dce8f6;
  font-weight: 600;
  font-size: 0.68rem;
}
.shot-status .hint { margin-left: auto; opacity: 0.75; }
.shot-desk {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 0.35rem;
  padding: 0.4rem;
  background: var(--timber-surface);
}
.shot-scan {
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  border-radius: 0.45rem;
  padding: 0.35rem 0.45rem;
}
.shot-scan span {
  display: block;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--timber-muted);
  margin-bottom: 0.25rem;
}
.shot-scan div {
  border: 2px solid var(--timber-ink);
  border-radius: 0.35rem;
  padding: 0.28rem 0.4rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background: var(--timber-panel-elevated);
}
.shot-total {
  background: #0d1624;
  color: #e8eef6;
  border-radius: 0.45rem;
  padding: 0.4rem 0.5rem;
}
.shot-total p { margin: 0; }
.shot-total .lbl {
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a8ea8;
  font-weight: 700;
}
.shot-total strong {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #5ec8ff;
  line-height: 1.05;
}
.shot-total .tax { color: #8a9bb0; font-size: 0.62rem; margin-top: 0.15rem; }
.shot table { width: 100%; border-collapse: collapse; }
.shot th {
  text-align: left;
  font-size: 0.58rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--timber-muted);
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid var(--timber-line);
  font-weight: 800;
}
.shot td {
  padding: 0.32rem 0.45rem;
  border-bottom: 1px solid var(--timber-line);
  font-weight: 600;
}
.shot tr.on { background: var(--timber-primary-soft); }
.shot-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-top: 1px solid var(--timber-line);
}
.shot-foot strong { display: block; font-size: 0.78rem; }
.shot-foot span { color: var(--timber-muted); font-weight: 700; }
.shot-foot .cobrar {
  padding: 0.45rem 0.7rem;
  border-radius: 0.4rem;
  letter-spacing: 0.05em;
}

.band {
  position: relative;
  z-index: 1;
}
.section {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 2.75rem 1.15rem;
  scroll-margin-top: 4rem;
  will-change: transform;
}
.section-kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--timber-primary);
}
.section h2 {
  margin: 0.3rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 2.6vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}
.section-lede {
  margin: 0.6rem 0 0;
  max-width: 36rem;
  color: var(--timber-muted);
  font-size: 1rem;
  line-height: 1.5;
}

.pillars {
  margin: 1.4rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 800px) {
  .pillars { grid-template-columns: repeat(3, 1fr); }
}
.pillars li {
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  border-radius: var(--timber-radius);
  padding: 1rem 1rem 1.05rem;
  box-shadow: var(--timber-shadow);
}
.pillars h3 { margin: 0; font-size: 1rem; font-weight: 800; }
.pillars p { margin: 0.4rem 0 0; color: var(--timber-muted); font-size: 0.9rem; line-height: 1.4; }

.magic-flow {
  margin-top: 1.4rem;
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 800px) {
  .magic-flow { grid-template-columns: repeat(3, 1fr); }
}
.magic-flow article {
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  border-radius: var(--timber-radius);
  padding: 1rem;
}
.step {
  display: inline-flex;
  width: 1.6rem;
  height: 1.6rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--timber-primary-soft);
  color: var(--timber-primary);
  font-weight: 800;
  font-size: 0.8rem;
}
.magic-flow h3 { margin: 0.5rem 0 0; font-size: 1rem; }
.magic-flow p { margin: 0.3rem 0 0; color: var(--timber-muted); font-size: 0.88rem; line-height: 1.4; }

.magic-example {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  border-radius: var(--timber-radius);
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
}
@media (min-width: 700px) {
  .magic-example { grid-template-columns: 1fr auto 1fr; }
}
.magic-example pre {
  margin: 0;
  padding: 0.7rem 0.8rem;
  border-radius: 0.5rem;
  background: var(--timber-panel-elevated);
  border: 1px solid var(--timber-line);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
.arrow { text-align: center; font-weight: 800; color: var(--timber-primary); }
.magic-example ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.35rem; }
.magic-example li {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0.15rem;
  border-bottom: 1px solid var(--timber-line);
  font-weight: 600;
  font-size: 0.9rem;
}
.magic-note { margin: 0.9rem 0 0; color: var(--timber-muted); font-size: 0.9rem; line-height: 1.45; }

.plan-grid {
  margin-top: 1.4rem;
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 900px) {
  .plan-grid { grid-template-columns: repeat(3, 1fr); }
}
.plan-grid article {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  padding: 1.1rem;
  border-radius: var(--timber-radius);
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  box-shadow: var(--timber-shadow);
}
.plan-grid article.hot { border-color: var(--timber-primary); }
.badge {
  margin: 0;
  width: fit-content;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--timber-primary-soft);
  color: var(--timber-primary);
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
}
.plan-grid h3 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.tag { margin: 0; color: var(--timber-muted); font-size: 0.86rem; min-height: 2.4em; }
.price {
  margin: 0.15rem 0 0;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--timber-ink);
}
.price span { font-size: 0.8rem; font-weight: 600; color: var(--timber-muted); }
.im-line { margin: 0; font-size: 0.82rem; color: var(--timber-muted); font-weight: 600; }
.plan-grid ul {
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.3rem;
  flex: 1 1 auto;
}
.plan-grid li {
  position: relative;
  padding-left: 0.85rem;
  font-size: 0.84rem;
  color: var(--timber-muted);
  line-height: 1.35;
}
.plan-grid li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.45em;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: var(--timber-primary);
}
.plan-grid .btn { width: 100%; margin-top: auto; align-self: end; }

.plan-extra {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.7rem;
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
}
.plan-extra p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--timber-muted);
  line-height: 1.4;
}
.plan-extra strong { color: var(--timber-ink); font-weight: 700; }
.plan-extra a {
  color: var(--timber-primary);
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
}

.hw-list {
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
  grid-template-columns: 1fr 1fr;
}
@media (min-width: 700px) {
  .hw-list { grid-template-columns: repeat(4, 1fr); }
}
.hw-list li {
  padding: 0.85rem 0.9rem;
  border-radius: var(--timber-radius);
  background: var(--timber-panel);
  border: 1px solid var(--timber-line);
  box-shadow: var(--timber-shadow);
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
}

.band.cloud,
.band.plans,
.band.hardware {
  background: transparent;
}
.band.devices-band,
.band.magic {
  background: var(--timber-panel);
}

.final-cta { text-align: center; position: relative; z-index: 1; }

@media (prefers-reduced-motion: reduce) {
  .hero-visual,
  .device-row {
    transform: none !important;
  }
}
.final-cta h2 { margin-inline: auto; }
.final-cta p {
  margin: 0.5rem auto 1rem;
  max-width: 26rem;
  color: var(--timber-muted);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  padding: 1.25rem 1rem 2rem;
  border-top: 1px solid var(--timber-line);
  background: var(--timber-panel);
  font-size: 0.86rem;
  color: var(--timber-muted);
}
.foot a { color: var(--timber-primary); font-weight: 700; text-decoration: none; }
.foot span:first-child { font-weight: 800; color: var(--timber-ink); }
</style>
