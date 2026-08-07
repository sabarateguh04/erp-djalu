import { Router } from "express";
import { randomUUID } from "crypto";
import { getCabang, saveCabang } from "../lib/cabangStore.js";
import { logActivity } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

// GET /api/cabang — semua user login boleh lihat (dipakai buat dropdown
// filter/pilih cabang di modul lain), tapi cuma "cabang:manage" yang boleh ubah.
router.get("/", async (req, res) => {
  try {
    res.json(await getCabang());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requirePermission("cabang:manage"), async (req, res) => {
  try {
    const { nama, alamat } = req.body || {};
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama cabang wajib diisi" });
    }
    const list = await getCabang();
    const cabang = { id: randomUUID(), nama: nama.trim(), alamat: alamat || "" };
    list.push(cabang);
    await saveCabang(list);
    await logActivity(req.user, "cabang", "create", cabang.id, `Menambahkan cabang: ${cabang.nama}`);
    res.status(201).json(cabang);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", requirePermission("cabang:manage"), async (req, res) => {
  try {
    const list = await getCabang();
    const cabang = list.find((c) => c.id === req.params.id);
    if (!cabang) return res.status(404).json({ error: "Cabang tidak ditemukan" });
    if (req.body.nama !== undefined) cabang.nama = req.body.nama.trim();
    if (req.body.alamat !== undefined) cabang.alamat = req.body.alamat;
    await saveCabang(list);
    await logActivity(req.user, "cabang", "update", cabang.id, `Mengubah cabang: ${cabang.nama}`);
    res.json(cabang);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requirePermission("cabang:manage"), async (req, res) => {
  try {
    const list = await getCabang();
    const target = list.find((c) => c.id === req.params.id);
    const filtered = list.filter((c) => c.id !== req.params.id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: "Cabang tidak ditemukan" });
    }
    if (filtered.length === 0) {
      return res.status(400).json({ error: "Minimal harus ada 1 cabang" });
    }
    await saveCabang(filtered);
    await logActivity(req.user, "cabang", "delete", req.params.id, `Menghapus cabang: ${target?.nama || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
