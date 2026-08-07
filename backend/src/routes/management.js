import { Router } from "express";
import { randomUUID } from "crypto";
import { readCategory, writeCategory } from "../lib/managementStore.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";
import { logActivity } from "../lib/activityLogger.js";

const router = Router();
const ALLOWED_CATEGORIES = ["karyawan", "aset", "operasional", "project", "finance", "sales"];

// Modul 2-6 di BIG_SCOPE_DETAIL.md: field tambahan per kategori di luar skema
// dasar (tanggal/nama/tipe/status/nilai/catatan). "number"/"array" dicoerce,
// selain itu disimpan sebagai string apa adanya (termasuk null kalau kosong).
const EXTRA_FIELDS = {
  karyawan: [
    { key: "nomorInduk", type: "string" },
    { key: "jabatan", type: "string" },
    { key: "tanggalMasuk", type: "string" },
    { key: "tanggalKeluar", type: "string" },
    { key: "gajiPokok", type: "number" },
    { key: "userId", type: "string" },
    { key: "cabangId", type: "string" },
  ],
  aset: [
    { key: "lokasi", type: "string" },
    { key: "penanggungJawab", type: "string" },
    { key: "tanggalPembelian", type: "string" },
    { key: "masaGaransi", type: "string" },
    { key: "cabangId", type: "string" },
  ],
  operasional: [],
  project: [
    { key: "tanggalMulai", type: "string" },
    { key: "tanggalSelesai", type: "string" },
    { key: "anggota", type: "array" },
    { key: "budget", type: "number" },
  ],
  finance: [
    { key: "kategoriId", type: "string" },
    { key: "metodePembayaran", type: "string" },
    { key: "nomorReferensi", type: "string" },
    { key: "cabangId", type: "string" },
  ],
  sales: [
    { key: "customerId", type: "string" },
    { key: "produkId", type: "string" },
  ],
};

function coerce(type, value) {
  if (type === "number") {
    return value === "" || value === undefined || value === null ? null : Number(value);
  }
  if (type === "array") {
    return Array.isArray(value) ? value : [];
  }
  return value === undefined ? "" : value;
}

// Build extra-field values for a brand new record (defaults applied).
function buildExtraFieldsForCreate(category, body) {
  const fields = EXTRA_FIELDS[category] || [];
  const out = {};
  for (const f of fields) {
    out[f.key] = coerce(f.type, body[f.key]);
  }
  return out;
}

// Merge extra-field values on update: only overwrite keys present in body,
// keep existing value otherwise.
function mergeExtraFieldsForUpdate(category, body, existing) {
  const fields = EXTRA_FIELDS[category] || [];
  const out = {};
  for (const f of fields) {
    out[f.key] = f.key in body ? coerce(f.type, body[f.key]) : existing[f.key];
  }
  return out;
}

function checkCategory(req, res, next) {
  if (!ALLOWED_CATEGORIES.includes(req.params.category)) {
    return res.status(404).json({ error: "Kategori tidak dikenal" });
  }
  next();
}

router.use(requireAuth);

// requirePermission needs a fixed code, so resolve it per-request from :category
function requireCategoryPermission(suffix) {
  return (req, res, next) => requirePermission(`${req.params.category}:${suffix}`)(req, res, next);
}

// GET /api/management/:category
router.get("/:category", checkCategory, requireCategoryPermission("view"), async (req, res) => {
  try {
    const records = await readCategory(req.params.category);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/management/:category
router.post("/:category", checkCategory, requireCategoryPermission("edit"), async (req, res) => {
  try {
    const { category } = req.params;
    const records = await readCategory(category);
    const now = new Date().toISOString();
    const newRecord = {
      id: randomUUID(),
      tanggal: req.body.tanggal || now.slice(0, 10),
      nama: req.body.nama || "",
      tipe: req.body.tipe || "",
      status: req.body.status || "",
      nilai: req.body.nilai === "" || req.body.nilai === undefined ? null : Number(req.body.nilai),
      catatan: req.body.catatan || "",
      ...buildExtraFieldsForCreate(category, req.body),
      createdAt: now,
      updatedAt: now,
    };
    records.unshift(newRecord);
    await writeCategory(category, records);
    await logActivity(req.user, category, "create", newRecord.id, `Menambahkan ${category}: ${newRecord.nama}`);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/management/:category/:id
router.put("/:category/:id", checkCategory, requireCategoryPermission("edit"), async (req, res) => {
  try {
    const { category } = req.params;
    const records = await readCategory(category);
    const idx = records.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Data tidak ditemukan" });

    records[idx] = {
      ...records[idx],
      tanggal: req.body.tanggal ?? records[idx].tanggal,
      nama: req.body.nama ?? records[idx].nama,
      tipe: req.body.tipe ?? records[idx].tipe,
      status: req.body.status ?? records[idx].status,
      nilai:
        req.body.nilai === "" || req.body.nilai === undefined
          ? records[idx].nilai
          : Number(req.body.nilai),
      catatan: req.body.catatan ?? records[idx].catatan,
      ...mergeExtraFieldsForUpdate(category, req.body, records[idx]),
      id: records[idx].id,
      updatedAt: new Date().toISOString(),
    };
    await writeCategory(category, records);
    await logActivity(req.user, category, "update", records[idx].id, `Mengubah ${category}: ${records[idx].nama}`);
    res.json(records[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/management/:category/:id
router.delete("/:category/:id", checkCategory, requireCategoryPermission("edit"), async (req, res) => {
  try {
    const { category } = req.params;
    const records = await readCategory(category);
    const target = records.find((r) => r.id === req.params.id);
    const filtered = records.filter((r) => r.id !== req.params.id);
    if (filtered.length === records.length) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }
    await writeCategory(category, filtered);
    await logActivity(req.user, category, "delete", req.params.id, `Menghapus ${category}: ${target?.nama || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
