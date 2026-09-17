<template>
  <div class="auth-shell">
    <div class="auth-atmosphere" aria-hidden="true"></div>

    <div class="auth-panel">
      <div class="brand-block">
        <img src="/logo.svg" alt="Timber" class="brand-logo" />
        <h1 class="brand-name">Timber</h1>
        <p class="brand-tagline">Gestión de salón para tu negocio</p>
      </div>

      <h2 class="auth-heading">Ingresar</h2>
      <form @submit.prevent="login" class="auth-form">
        <label class="field">
          <span>Usuario o correo</span>
          <input v-model="username" type="text" placeholder="tu@negocio.com" required />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </label>
        <button type="submit" class="btn-primary">Ingresar</button>
        <p v-if="error" class="error-text">Usuario o contraseña incorrectos</p>
      </form>

      <router-link to="/register" class="auth-link">
        ¿No tienes cuenta? Regístrate
      </router-link>
    </div>
  </div>
</template>

<script>
import { isSetupComplete } from "../venueStore";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: false,
    };
  },
  methods: {
        login() {
            if (import.meta.env.DEV) {
                this.$router.push(isSetupComplete() ? "/main" : "/setup");
            } else {
                this.error = true;
            }
        },
  },
};
</script>

<style scoped>
.auth-shell {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: var(--font-sans);
}

.auth-atmosphere {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 12% 18%, rgba(184, 149, 108, 0.32), transparent 55%),
    radial-gradient(ellipse 55% 40% at 88% 78%, rgba(26, 74, 56, 0.45), transparent 50%),
    linear-gradient(155deg, #0f241c 0%, #1a3f32 42%, #2a4d40 100%);
}

.auth-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 26rem;
  background: rgba(255, 252, 248, 0.94);
  backdrop-filter: blur(12px);
  border-radius: 1.35rem;
  padding: 2.1rem 1.7rem 1.7rem;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.32);
  animation: rise 0.55s ease-out;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.brand-block { text-align: center; margin-bottom: 1.5rem; }
.brand-logo {
  width: 3.6rem; height: 3.6rem; border-radius: 0.95rem;
  margin: 0 auto 0.85rem; display: block;
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
}
.brand-name {
  font-family: var(--font-display);
  font-size: 2.1rem;
  margin: 0;
  color: var(--timber-primary);
  letter-spacing: -0.02em;
  font-weight: 800;
}
.brand-tagline { margin: 0.4rem 0 0; color: var(--timber-muted); font-size: 0.92rem; }
.auth-heading { font-size: 1.05rem; font-weight: 600; margin: 0 0 1rem; color: var(--timber-ink); }
.auth-form { display: grid; gap: 0.9rem; }
.field { display: grid; gap: 0.35rem; font-size: 0.85rem; font-weight: 500; color: #3a433d; }
.field input {
  border: 1px solid rgba(18,24,22,.12);
  border-radius: 0.7rem;
  padding: 0.75rem 0.85rem;
  font: inherit;
  background: #fff;
}
.field input:focus {
  outline: none;
  border-color: var(--timber-primary);
  box-shadow: 0 0 0 3px rgba(26, 74, 56, 0.14);
}
.btn-primary {
  margin-top: 0.25rem;
  border: none;
  border-radius: 0.7rem;
  padding: 0.8rem;
  background: var(--timber-primary);
  color: #f8f6f2;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(26,74,56,.25);
  transition: transform 0.15s ease, background 0.15s ease;
}
.btn-primary:hover { background: #14382b; transform: translateY(-1px); }
.error-text { margin: 0; text-align: center; color: #b42318; font-size: 0.85rem; }
.auth-link {
  display: block; text-align: center; margin-top: 1.15rem;
  font-size: 0.875rem; color: var(--timber-muted); text-decoration: none;
}
.auth-link:hover { color: var(--timber-primary); }
</style>
