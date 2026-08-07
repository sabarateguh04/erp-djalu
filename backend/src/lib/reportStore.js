import { readCategory } from "./managementStore.js";
import { getMovements } from "./inventoryStore.js";
import { getPurchaseOrders } from "./procurementStore.js";
import { getPipeline } from "./crmStore.js";
import { getAttendance, getPayroll } from "./hrStore.js";

// Modul 12 (BIG_SCOPE_DETAIL.md): laporan murni agregasi dari data modul
// lain, tidak punya entity sendiri. `dateField` boleh nama kolom, atau
// fungsi (record) => "YYYY-MM-DD" untuk modul yang tidak punya field
// `tanggal` langsung (mis. payroll pakai `periode`, pipeline pakai `createdAt`).
export const REPORT_MODULES = {
  karyawan: { label: "Karyawan", load: () => readCategory("karyawan"), dateField: "tanggal" },
  aset: { label: "Aset", load: () => readCategory("aset"), dateField: "tanggal" },
  operasional: { label: "Operasional", load: () => readCategory("operasional"), dateField: "tanggal" },
  project: { label: "Project", load: () => readCategory("project"), dateField: "tanggal" },
  finance: { label: "Finance", load: () => readCategory("finance"), dateField: "tanggal" },
  sales: { label: "Sales", load: () => readCategory("sales"), dateField: "tanggal" },
  "inventory-movements": { label: "Inventory — Movement", load: getMovements, dateField: "tanggal" },
  "procurement-purchase-orders": { label: "Procurement — Purchase Order", load: getPurchaseOrders, dateField: "tanggal" },
  "crm-pipeline": { label: "CRM — Pipeline", load: getPipeline, dateField: (r) => r.createdAt?.slice(0, 10) },
  "hr-attendance": { label: "HR — Absensi", load: getAttendance, dateField: "tanggal" },
  "hr-payroll": { label: "HR — Payroll", load: getPayroll, dateField: (r) => `${r.periode}-01` },
};

export function filterByDateRange(records, dateField, from, to) {
  const getDate = typeof dateField === "function" ? dateField : (r) => r[dateField];
  return records.filter((r) => {
    const d = getDate(r);
    if (!d) return true;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

// Serializer CSV minimal (tanpa dependency tambahan) — cukup untuk data
// tabular flat/JSON-array-JSON-object di dalamnya.
export function toCsv(records) {
  if (records.length === 0) return "";
  const columns = Array.from(records.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set()));

  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const lines = [columns.join(",")];
  for (const r of records) {
    lines.push(columns.map((c) => escapeCell(r[c])).join(","));
  }
  return lines.join("\n");
}
