<template>
  <div class="auth-shell">
    <div class="panel">
      <h1>Recuperar contraseña</h1>
      <p class="hint">Te enviaremos un enlace a tu correo (o lo verás en la consola del backend si no hay SMTP).</p>
      <form @submit.prevent="submit">
        <label>Correo<input v-model="email" type="email" required /></label>
        <button type="submit" class="btn" :disabled="loading">{{ loading ? 'Enviando…' : 'Enviar enlace' }}</button>
      </form>
      <p v-if="msg" class="ok">{{ msg }}</p>
      <p v-if="err" class="err">{{ err }}</p>
      <router-link to="/login">Volver al login</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { apiService } from "../apiService";

const email = ref("");
const loading = ref(false);
const msg = ref("");
const err = ref("");

async function submit() {
  loading.value = true;
  msg.value = "";
  err.value = "";
  try {
    const res = await apiService.forgotPassword(email.value);
    msg.value = res.mail?.fallback
      ? "Solicitud creada. Revisa la consola del backend (SMTP no configurado)."
      : "Si el correo existe, enviamos un enlace.";
  } catch (e) {
    err.value = e.response?.data || "No se pudo enviar";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-shell { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: var(--timber-surface); }
.panel { width: min(24rem, 100%); background: var(--timber-panel); border: 1px solid var(--timber-line); border-radius: 1rem; padding: 1.4rem; display: grid; gap: .7rem; }
h1 { margin: 0; font-size: 1.35rem; font-weight: 800; }
.hint { margin: 0; color: var(--timber-muted); font-size: .9rem; }
label { display: grid; gap: .3rem; font-size: .85rem; font-weight: 600; }
input { border: 1px solid var(--timber-line); border-radius: .65rem; padding: .7rem; background: var(--timber-panel-elevated); color: var(--timber-ink); }
.btn { border: none; border-radius: .7rem; padding: .75rem; background: var(--timber-primary); color: var(--timber-on-primary); font-weight: 700; cursor: pointer; }
.ok { color: var(--timber-success); margin: 0; }
.err { color: var(--timber-danger); margin: 0; }
a { color: var(--timber-primary); font-weight: 600; }
</style>
