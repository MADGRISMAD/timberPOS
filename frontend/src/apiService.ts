import axios from 'axios';

const publicUrl =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8081/'
    : 'https://produccion-api.com/';

axios.defaults.baseURL = publicUrl;
axios.defaults.headers.common = {
  'Content-Type': 'application/json',
};

export const apiService = {
  getAllFoods() {
    return axios.get('/foods').then((r) => r.data);
  },
  getFoodById(foodId: string) {
    return axios.get(`/foods/${foodId}`).then((r) => r.data);
  },
  createFood(foodDTO: { name: string; price: number; description?: string; imgUrl?: string; menuId: string }) {
    return axios.post('/foods', foodDTO).then((r) => r.data);
  },
  editFood(foodId: string, foodDTO: Record<string, unknown>) {
    return axios.put(`/foods/${foodId}`, foodDTO).then((r) => r.data);
  },
  deleteFood(foodId: string) {
    return axios.delete(`/foods/${foodId}`).then((r) => r.status === 200);
  },

  getAllMenus() {
    return axios.get('/menus').then((r) => r.data);
  },
  getMenuById(menuId: string) {
    return axios.get(`/menus/${menuId}`).then((r) => r.data);
  },
  createMenu(menuDTO: { name: string; description?: string }) {
    return axios.post('/menus', menuDTO).then((r) => r.data);
  },
  editMenu(menuId: string, menuDTO: Record<string, unknown>) {
    return axios.put(`/menus/${menuId}`, menuDTO).then((r) => r.data);
  },
  deleteMenu(menuId: string) {
    return axios.delete(`/menus/${menuId}`).then((r) => r.status === 200);
  },

  getOrders() {
    return axios.get('/orders').then((r) => r.data);
  },
  getOrdersById(orderId: string) {
    return axios.get(`/orders/${orderId}`).then((r) => r.data);
  },
  createOrder(orderDTO: Record<string, unknown>) {
    return axios.post('/orders', orderDTO).then((r) => r.data);
  },
  updateOrderStatus(orderId: string, status: string) {
    return axios.put(`/orders/${orderId}/status`, { status }).then((r) => r.data);
  },
  payOrder(orderId: string, paymentMethod: string) {
    return axios.put(`/orders/${orderId}/pay`, { paymentMethod }).then((r) => r.data);
  },
  editOrderAsCompleted(orderId: string) {
    return this.updateOrderStatus(orderId, 'served');
  },
  deleteOrder(_orderId: string) {
    return Promise.resolve(false);
  },

  getTables() {
    return axios.get('/tables').then((r) => r.data);
  },
  getTableById(tableId: string) {
    return axios.get(`/tables/${tableId}`).then((r) => r.data);
  },
  createTable(tableDTO: Record<string, unknown>) {
    return axios.post('/tables', tableDTO).then((r) => r.data);
  },
  editTable(tableId: string, tableDTO: Record<string, unknown>) {
    return axios.put(`/tables/${tableId}`, tableDTO).then((r) => r.data);
  },
  deleteTable(tableId: string) {
    return axios.delete(`/tables/${tableId}`).then((r) => r.status === 200);
  },

  getWaiters() {
    return axios.get('/waiters').then((r) => r.data);
  },
  createWaiter(waiterDTO: Record<string, unknown>) {
    return axios.post('/waiters/add', waiterDTO).then((r) => r.data);
  },
  updateWaiter(cellphone: string, waiterDTO: Record<string, unknown>) {
    return axios.put(`/waiters/${cellphone}`, waiterDTO).then((r) => r.data);
  },
  deleteWaiter(cellphone: string) {
    return axios.delete(`/waiters/${cellphone}`).then((r) => r.data);
  },

  getWaitlist() {
    return axios.get('/usuarios/waitlist/').then((r) => r.data);
  },
  addWaitlist(data: { nombre: string; telefono: string | number }) {
    return axios.post('/usuarios/waitlist/add', data).then((r) => r.data);
  },
  deleteWaitlist(id: string | number) {
    return axios.delete(`/usuarios/waitlist/delete/${id}`).then((r) => r.data);
  },

  getSettings() {
    return axios.get('/settings').then((r) => r.data);
  },
  saveSettings(settingsDTO: Record<string, unknown>) {
    return axios.post('/settings', settingsDTO).then((r) => r.data);
  },

  getInvites() {
    return axios.get('/invites').then((r) => r.data);
  },
  createInvite(data: { email: string; role: string }) {
    return axios.post('/invites', data).then((r) => r.data);
  },
  revokeInvite(id: string) {
    return axios.put(`/invites/${id}/revoke`).then((r) => r.data);
  },
  deleteInvite(id: string) {
    return axios.delete(`/invites/${id}`).then((r) => r.data);
  },
  getInviteByToken(token: string) {
    return axios.get(`/invites/token/${token}`).then((r) => r.data);
  },
  acceptInvite(payload: Record<string, unknown>) {
    return axios.post('/invites/accept', payload).then((r) => r.data);
  },
};
