<template>
  <div class="auth-shell">
    <div class="auth-atmosphere" aria-hidden="true"></div>

    <div class="auth-panel">
      <div class="brand-block">
        <img src="/logo.svg" alt="Mi Tiendita" class="brand-logo" />
        <h1 class="brand-name"><BrandName /></h1>
        <p class="brand-tagline">Crea la cuenta de administración</p>
      </div>

      <h2 class="auth-heading">Registro</h2>
      <form @submit.prevent="register" class="auth-form">
        <div class="grid-2">
          <label class="field">
            <span>Nombre</span>
            <input v-model="firstName" type="text" placeholder="Nombre" required />
          </label>
          <label class="field">
            <span>Apellido</span>
            <input v-model="lastName" type="text" placeholder="Apellido" required />
          </label>
        </div>

        <label class="field">
          <span>Número telefónico</span>
          <input
            id="cellphone"
            v-model="cellphone"
            type="text"
            maxlength="14"
            placeholder="(xxx)-xxx-xxxx"
            required
          />
          <span v-if="formatCellphoneError" class="error-inline">Formato de número incorrecto</span>
        </label>

        <label class="field">
          <span>Usuario</span>
          <input v-model="username" type="text" placeholder="Usuario" required />
        </label>

        <label class="field">
          <span>Correo electrónico</span>
          <input v-model="email" type="email" placeholder="Correo electrónico" required />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <input v-model="password" type="password" placeholder="Contraseña" required />
        </label>

        <label class="field">
          <span>Confirmar contraseña</span>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirmar contraseña"
            required
          />
          <span v-if="differentsPassword" class="error-inline">Las contraseñas no coinciden</span>
        </label>

        <button type="submit" class="btn-primary">Registrar</button>

        <router-link
          v-if="confirmRequest"
          to="/setup"
          class="success-link"
        >
          Registro exitoso. Continúa con la configuración
        </router-link>
        <p v-if="onError" class="error-text">{{ Error }}</p>
      </form>

      <router-link to="/login" class="auth-link">¿Ya tienes cuenta? Iniciar sesión</router-link>
      <router-link to="/" class="auth-link">← Volver al inicio</router-link>
    </div>
  </div>
</template>

<script>
import { apiService } from "../apiService";
import { setSession } from "../authStore";
import BrandName from "../components/BrandName.vue";

export default {
  components: { BrandName },
  data() {
    return {
      firstName: "",
      lastName: "",
      cellphone: "",
      username: "",
      email: "",
      password: "",
      formatCellphoneError: false,
      confirmPassword: "",
      differentsPassword: false,
      confirmRequest: false,
      Error: "",
      onError: false,
    };
  },
  computed: {
    validateNum() {
      let num = this.cellphone;
      let regex = /\D/i;
      num = num.replace(/\-/g, "");
      num = num.replace(/\(/g, "");
      num = num.replace(/\)/g, "");
      num = num.replace(/\s/g, "");
      if (regex.test(num)) {
        this.formatCellphoneError = true;
      } else {
        this.formatCellphoneError = false;
        if (num.length == 10) {
          let newNum =
            "(" +
            num.substring(0, 3) +
            ")-" +
            num.substring(3, 6) +
            "-" +
            num.substring(6, 10);
          this.cellphone = newNum;
        }
      }
    },
  },
  methods: {
    async register() {
      try {
        if (this.formatCellphoneError) {
          document.getElementById("cellphone").focus();
          return;
        }
        if (this.password != this.confirmPassword) {
          this.differentsPassword = true;
          document.getElementById("confirmPassword").focus();
          return;
        }
        let num = this.cellphone;
        num = num.replace(/\-/g, "");
        num = num.replace(/\(/g, "");
        num = num.replace(/\)/g, "");
        num = num.replace(/\s/g, "");
        if (num.length != 10) {
          document.getElementById("cellphone").focus();
          this.formatCellphoneError = true;
          return;
        }
        const request = await apiService.register({
          name: this.firstName,
          lastName: this.lastName,
          email: this.email,
          username: this.username,
          password: this.password,
          cellphone: num,
        });
        setSession({
          token: request.token,
          role: request.role,
          tenantId: request.tenantId,
          username: request.username,
        });
        this.confirmRequest = true;
        this.$router.push("/setup");
      } catch (error) {
        this.onError = true;
        this.Error = error.response?.data || error.message;
        console.error(error);
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
    radial-gradient(ellipse 70% 50% at 15% 15%, rgba(224, 138, 30, 0.22), transparent 55%),
    radial-gradient(ellipse 60% 45% at 85% 75%, rgba(30, 90, 168, 0.4), transparent 50%),
    linear-gradient(155deg, #0a1a30 0%, #123056 40%, #1e5aa8 100%);
}

.auth-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 28rem;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 1.15rem;
  padding: 1.75rem 1.5rem 1.4rem;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.28);
}

.brand-block {
  text-align: center;
  margin-bottom: 1rem;
}

.brand-logo {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  margin: 0 auto 0.55rem;
  display: block;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
  color: #1e5aa8;
}

.brand-tagline {
  margin: 0.25rem 0 0;
  color: #66706a;
  font-size: 0.85rem;
}

.auth-heading {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.85rem;
}

.auth-form {
  display: grid;
  gap: 0.7rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

.field {
  display: grid;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: #3a433d;
}

.field input {
  border: 1px solid #cdd5cf;
  border-radius: 0.5rem;
  padding: 0.65rem 0.75rem;
  font: inherit;
}

.field input:focus {
  outline: none;
  border-color: #1e5aa8;
  box-shadow: 0 0 0 3px rgba(30, 90, 168, 0.18);
}

.btn-primary {
  border: none;
  border-radius: 0.55rem;
  padding: 0.75rem;
  background: #1e5aa8;
  color: #f7f4ef;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #16382b;
}

.error-inline,
.error-text {
  color: #b42318;
  font-size: 0.8rem;
}

.error-text {
  text-align: center;
  margin: 0;
}

.success-link {
  display: block;
  text-align: center;
  color: #1e5aa8;
  font-weight: 600;
  font-size: 0.9rem;
}

.auth-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #5c675f;
  text-decoration: none;
}

.auth-link:hover {
  color: #1e5aa8;
}

@media (max-width: 480px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
