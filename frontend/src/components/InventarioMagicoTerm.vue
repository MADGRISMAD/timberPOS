<template>
  <component
    :is="tag"
    v-bind="linkAttrs"
    class="im-term"
    :class="{ hoverable: showHover }"
    :aria-describedby="showHover ? tipId : undefined"
  >
    Inventario Mágico
    <span v-if="showHover" :id="tipId" class="im-tip" role="tooltip">
      Pegas el papelito de precios nuevos (o una foto de la factura) y Timber
      actualiza tu catálogo en segundos — desde la nube, sin buscar producto por producto.
    </span>
  </component>
</template>

<script setup>
import { computed } from "vue";
import { authStore, isAuthenticated } from "../authStore";

const tipId = `im-tip-${Math.random().toString(36).slice(2, 8)}`;

const showHover = computed(() => {
  // Depend on token so UI updates after login/logout
  void authStore.token;
  return isAuthenticated();
});

const tag = computed(() => (showHover.value ? "span" : "router-link"));

const linkAttrs = computed(() => {
  if (showHover.value) return { tabindex: 0 };
  return { to: { path: "/", hash: "#inventario-magico" } };
});
</script>

<style scoped>
.im-term {
  position: relative;
  display: inline;
  font-weight: 800;
  font-style: normal;
  color: var(--timber-primary);
  text-decoration: none;
  border-bottom: 1.5px solid color-mix(in srgb, var(--timber-primary) 45%, transparent);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.im-term:hover,
.im-term:focus-visible {
  color: var(--timber-primary);
  border-bottom-color: var(--timber-primary);
  outline: none;
}
.im-term.hoverable {
  border-bottom-style: dotted;
  cursor: help;
}
.im-tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.55rem);
  transform: translateX(-50%) translateY(4px);
  width: min(17.5rem, 72vw);
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  background: var(--timber-ink);
  color: var(--timber-panel);
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  box-shadow: var(--timber-shadow);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
  z-index: 40;
}
.im-tip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -6px;
  border: 6px solid transparent;
  border-top-color: var(--timber-ink);
}
.im-term.hoverable:hover .im-tip,
.im-term.hoverable:focus-visible .im-tip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
</style>
