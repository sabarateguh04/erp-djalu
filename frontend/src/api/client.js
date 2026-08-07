const TOKEN_KEY = "erp_djalu_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const get = (path) => request(path);
const post = (path, data) => request(path, { method: "POST", body: JSON.stringify(data) });
const put = (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) });
const del = (path) => request(path, { method: "DELETE" });

export const api = {
  getSummary: () => get("/summary"),
  getProducts: () => get("/products"),
  getTrend: () => get("/trend"),
  getNotifications: () => get("/notifications"),
  getAIRecommendations: () => get("/ai-recommendations"),
  getNextRelease: () => get("/next-release"),
  getFinalProducts: () => get("/final-products"),
  markNotificationRead: (id) => put(`/notifications/${id}/read`, {}),
};

export const managementApi = {
  list: (category) => get(`/management/${category}`),
  create: (category, data) => post(`/management/${category}`, data),
  update: (category, id, data) => put(`/management/${category}/${id}`, data),
  remove: (category, id) => del(`/management/${category}/${id}`),
};

export const authApi = {
  register: (data) => post("/auth/register", data),
  login: (data) => post("/auth/login", data),
  logout: () => post("/auth/logout", {}),
  me: () => get("/auth/me"),
  updateMe: (data) => put("/auth/me", data),
};

export const usersApi = {
  list: () => get("/users"),
  create: (data) => post("/users", data),
  update: (id, data) => put(`/users/${id}`, data),
  remove: (id) => del(`/users/${id}`),
};

export const financeKategoriApi = {
  list: () => get("/finance-kategori"),
  create: (data) => post("/finance-kategori", data),
  update: (id, data) => put(`/finance-kategori/${id}`, data),
  remove: (id) => del(`/finance-kategori/${id}`),
};

export const inventoryApi = {
  listItems: () => get("/inventory/items"),
  createItem: (data) => post("/inventory/items", data),
  updateItem: (id, data) => put(`/inventory/items/${id}`, data),
  removeItem: (id) => del(`/inventory/items/${id}`),
  kartuStok: (id) => get(`/inventory/items/${id}/kartu-stok`),
  listMovements: () => get("/inventory/movements"),
  createMovement: (data) => post("/inventory/movements", data),
};

export const procurementApi = {
  listVendors: () => get("/procurement/vendors"),
  createVendor: (data) => post("/procurement/vendors", data),
  updateVendor: (id, data) => put(`/procurement/vendors/${id}`, data),
  removeVendor: (id) => del(`/procurement/vendors/${id}`),
  listPO: () => get("/procurement/purchase-orders"),
  createPO: (data) => post("/procurement/purchase-orders", data),
  submitPO: (id) => put(`/procurement/purchase-orders/${id}/submit`, {}),
  approvePO: (id) => put(`/procurement/purchase-orders/${id}/approve`, {}),
  rejectPO: (id, catatanApproval) => put(`/procurement/purchase-orders/${id}/reject`, { catatanApproval }),
  receivePO: (id) => put(`/procurement/purchase-orders/${id}/receive`, {}),
};

export const crmApi = {
  listCustomers: () => get("/crm/customers"),
  createCustomer: (data) => post("/crm/customers", data),
  updateCustomer: (id, data) => put(`/crm/customers/${id}`, data),
  removeCustomer: (id) => del(`/crm/customers/${id}`),
  listPipeline: () => get("/crm/pipeline"),
  createDeal: (data) => post("/crm/pipeline", data),
  updateDeal: (id, data) => put(`/crm/pipeline/${id}`, data),
  updateTahap: (id, tahap) => put(`/crm/pipeline/${id}/tahap`, { tahap }),
  removeDeal: (id) => del(`/crm/pipeline/${id}`),
};

export const hrApi = {
  listAttendance: () => get("/hr/attendance"),
  createAttendance: (data) => post("/hr/attendance", data),
  updateAttendance: (id, data) => put(`/hr/attendance/${id}`, data),
  removeAttendance: (id) => del(`/hr/attendance/${id}`),
  listPayroll: () => get("/hr/payroll"),
  generatePayroll: (periode) => post("/hr/payroll/generate", { periode }),
  updatePayroll: (id, data) => put(`/hr/payroll/${id}`, data),
  approvePayroll: (id) => put(`/hr/payroll/${id}/approve`, {}),
  bayarPayroll: (id) => put(`/hr/payroll/${id}/bayar`, {}),
};

export const systemApi = {
  activityLog: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return get(`/system/activity-log${qs ? `?${qs}` : ""}`);
  },
};

export const reportApi = {
  modules: () => get("/report/modules"),
  data: (modul, { from, to } = {}) => {
    const qs = new URLSearchParams(Object.entries({ from, to }).filter(([, v]) => v)).toString();
    return get(`/report/${modul}${qs ? `?${qs}` : ""}`);
  },
  async exportCsv(modul, { from, to } = {}) {
    const qs = new URLSearchParams(Object.entries({ from, to }).filter(([, v]) => v)).toString();
    const token = getToken();
    const res = await fetch(`/api/report/${modul}/export${qs ? `?${qs}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Gagal export CSV");
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `${modul}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const cabangApi = {
  list: () => get("/cabang"),
  create: (data) => post("/cabang", data),
  update: (id, data) => put(`/cabang/${id}`, data),
  remove: (id) => del(`/cabang/${id}`),
};

export const rolesApi = {
  list: () => get("/roles"),
  create: (data) => post("/roles", data),
  update: (id, data) => put(`/roles/${id}`, data),
  remove: (id) => del(`/roles/${id}`),
};
