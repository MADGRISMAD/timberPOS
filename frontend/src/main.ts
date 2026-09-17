import { createApp } from "vue";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import axios, { AxiosInstance } from "axios";
import "./index.css";
import { fetchVenueSettings, isSetupComplete } from "./venueStore";
import "./themeStore";

let publicUrl: string;

if (window.location.hostname === "localhost") {
  publicUrl = "http://localhost:8081/";
} else {
  publicUrl = "https://produccion-api.com/";
}

const Axios: AxiosInstance = axios.create({
  baseURL: publicUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export default Axios;

import main from "./views/MainComponent.vue";
import Login from "./views/LoginComponent.vue";
import Register from "./views/RegisterComponent.vue";
import MenuView from "./views/MenuComponent.vue";
import waitlist from "./views/WaitListComponent.vue";
import SetupWizard from "./views/SetupWizard.vue";
import DashboardView from "./views/DashboardView.vue";
import StaffView from "./views/StaffView.vue";
import OrdersView from "./views/OrdersView.vue";
import KitchenView from "./views/KitchenView.vue";
import SettingsView from "./views/SettingsView.vue";
import InviteAcceptView from "./views/InviteAcceptView.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "login", component: Login },
  { path: "/register", name: "register", component: Register },
  { path: "/setup", name: "setup", component: SetupWizard },
  { path: "/invite/:token", name: "invite", component: InviteAcceptView },
  { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresSetup: true } },
  { path: "/main", name: "main", component: main, meta: { requiresSetup: true } },
  { path: "/menu", name: "menu", component: MenuView, meta: { requiresSetup: true } },
  { path: "/meseros", redirect: "/menu" },
  { path: "/staff", name: "staff", component: StaffView, meta: { requiresSetup: true } },
  { path: "/orders", name: "orders", component: OrdersView, meta: { requiresSetup: true } },
  { path: "/kitchen", name: "kitchen", component: KitchenView, meta: { requiresSetup: true } },
  { path: "/waitlist", name: "waitlist", component: waitlist, meta: { requiresSetup: true } },
  { path: "/settings", name: "settings", component: SettingsView, meta: { requiresSetup: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (to.name === "invite" || to.name === "login" || to.name === "register") {
    return true;
  }

  if (!to.meta.requiresSetup && to.name !== "setup") {
    return true;
  }

  await fetchVenueSettings();

  if (to.meta.requiresSetup && !isSetupComplete()) {
    return { name: "setup" };
  }

  return true;
});

const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App);
app.use(router);
app.use(vuetify);
app.mount("#app");
