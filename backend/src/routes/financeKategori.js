import { Router } from "express";
import { randomUUID } from "crypto";
import { getFinanceKategori, saveFinanceKategori } from "../lib/financeKategoriStore.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

// GET /api/finance-kategori
router.get("/", requirePermission("finance:view"), async (req, res) => {
  try {
    res.json(await getFinanceKategori());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance-kategori
router.post("/", requirePermission("finance:edit"), async (req, res) => {
  try {
    const { nama, kelompok } = req.body || {};
    if (!nama || !kelompok) {
      return res.status(400).json({ error: "Nama dan kelompok wajib diisi" });
    }
    if (!["Pemasukan", "Pengeluaran"].includes(kelompok)) {
      return res.status(400).json({ error: "Kelompok harus Pemasukan atau Pengeluaran" });
    }
    const list = await getFinanceKategori();
    const newItem = { id: randomUUID(), nama: nama.trim(), kelompok };
    list.push(newItem);
    await saveFinanceKategori(list);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance-kategori/:id
router.put("/:id", requirePermission("finance:edit"), async (req, res) => {
  try {
    const list = await getFinanceKategori();
    const item = list.find((k) => k.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Kategori tidak ditemukan" });
    if (req.body.nama !== undefined) item.nama = req.body.nama.trim();
    if (req.body.kelompok !== undefined) {
      if (!["Pemasukan", "Pengeluaran"].includes(req.body.kelompok)) {
        return res.status(400).json({ error: "Kelompok harus Pemasukan atau Pengeluaran" });
      }
      item.kelompok = req.body.kelompok;
    }
    await saveFinanceKategori(list);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/finance-kategori/:id
router.delete("/:id", requirePermission("finance:edit"), async (req, res) => {
  try {
    const list = await getFinanceKategori();
    const filtered = list.filter((k) => k.id !== req.params.id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }
    await saveFinanceKategori(filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
