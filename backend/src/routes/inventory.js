import { Router } from "express";
import { randomUUID } from "crypto";
import { getItems, saveItems, getMovements, saveMovements } from "../lib/inventoryStore.js";
import { addNotification } from "../lib/notificationStore.js";
import { logActivity } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

// ---- Items ----

// GET /api/inventory/items
router.get("/items", requirePermission("inventory:view"), async (req, res) => {
  try {
    res.json(await getItems());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/items
router.post("/items", requirePermission("inventory:edit"), async (req, res) => {
  try {
    const { sku, nama, kategori, satuan, stokMinimum, lokasiGudang, cabangId } = req.body || {};
    if (!sku || !nama || !kategori || !satuan || stokMinimum === undefined || stokMinimum === "") {
      return res.status(400).json({ error: "SKU, nama, kategori, satuan, dan stok minimum wajib diisi" });
    }
    const items = await getItems();
    if (items.some((i) => i.sku.toLowerCase() === String(sku).toLowerCase())) {
      return res.status(400).json({ error: "SKU sudah dipakai" });
    }

    const now = new Date().toISOString();
    const newItem = {
      id: randomUUID(),
      sku: String(sku).trim(),
      nama: nama.trim(),
      kategori,
      satuan,
      stokMinimum: Number(stokMinimum),
      stokSaatIni: 0,
      lokasiGudang: lokasiGudang || "",
      cabangId: cabangId || null,
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(newItem);
    await saveItems(items);
    await logActivity(req.user, "inventory", "create", newItem.id, `Menambahkan item inventory: ${newItem.nama}`);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/items/:id — stokSaatIni sengaja tidak bisa diedit langsung,
// itu cuma hasil hitungan movement (lihat business rule di POST /movements).
router.put("/items/:id", requirePermission("inventory:edit"), async (req, res) => {
  try {
    const items = await getItems();
    const item = items.find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });

    const { sku, nama, kategori, satuan, stokMinimum, lokasiGudang, cabangId } = req.body || {};
    if (sku !== undefined) {
      const skuNormalized = String(sku).trim();
      if (items.some((i) => i.id !== item.id && i.sku.toLowerCase() === skuNormalized.toLowerCase())) {
        return res.status(400).json({ error: "SKU sudah dipakai" });
      }
      item.sku = skuNormalized;
    }
    if (nama !== undefined) item.nama = nama;
    if (kategori !== undefined) item.kategori = kategori;
    if (satuan !== undefined) item.satuan = satuan;
    if (stokMinimum !== undefined && stokMinimum !== "") item.stokMinimum = Number(stokMinimum);
    if (lokasiGudang !== undefined) item.lokasiGudang = lokasiGudang;
    if (cabangId !== undefined) item.cabangId = cabangId || null;
    item.updatedAt = new Date().toISOString();

    await saveItems(items);
    await logActivity(req.user, "inventory", "update", item.id, `Mengubah item inventory: ${item.nama}`);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/items/:id
router.delete("/items/:id", requirePermission("inventory:edit"), async (req, res) => {
  try {
    const items = await getItems();
    const target = items.find((i) => i.id === req.params.id);
    const filtered = items.filter((i) => i.id !== req.params.id);
    if (filtered.length === items.length) {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }
    await saveItems(filtered);
    await logActivity(req.user, "inventory", "delete", req.params.id, `Menghapus item inventory: ${target?.nama || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/items/:id/kartu-stok
router.get("/items/:id/kartu-stok", requirePermission("inventory:view"), async (req, res) => {
  try {
    const items = await getItems();
    const item = items.find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });

    const movements = await getMovements();
    const history = movements
      .filter((m) => m.itemId === req.params.id)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ item, movements: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Movements ----

// GET /api/inventory/movements
router.get("/movements", requirePermission("inventory:view"), async (req, res) => {
  try {
    res.json(await getMovements());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/movements
router.post("/movements", requirePermission("inventory:edit"), async (req, res) => {
  try {
    const { tanggal, itemId, tipe, qty, referensi, catatan } = req.body || {};
    if (!tanggal || !itemId || !tipe || !qty) {
      return res.status(400).json({ error: "Tanggal, item, tipe, dan qty wajib diisi" });
    }
    if (!["Masuk", "Keluar"].includes(tipe)) {
      return res.status(400).json({ error: "Tipe harus Masuk atau Keluar" });
    }
    const qtyNum = Number(qty);
    if (!(qtyNum > 0)) {
      return res.status(400).json({ error: "Qty harus lebih dari 0" });
    }

    const items = await getItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });

    if (tipe === "Keluar" && qtyNum > item.stokSaatIni) {
      return res.status(400).json({ error: "Stok tidak cukup" });
    }

    item.stokSaatIni = tipe === "Masuk" ? item.stokSaatIni + qtyNum : item.stokSaatIni - qtyNum;
    item.updatedAt = new Date().toISOString();
    await saveItems(items);

    const movements = await getMovements();
    const newMovement = {
      id: randomUUID(),
      tanggal,
      itemId,
      tipe,
      qty: qtyNum,
      referensi: referensi || "",
      catatan: catatan || "",
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    await saveMovements(movements);

    await logActivity(
      req.user,
      "inventory",
      "update",
      item.id,
      `Movement ${tipe} ${qtyNum} ${item.satuan} untuk ${item.nama}`
    );

    if (item.stokSaatIni <= item.stokMinimum) {
      await addNotification({
        tipe: "warning",
        text: `Stok ${item.nama} di bawah minimum (${item.stokSaatIni}/${item.stokMinimum} ${item.satuan})`,
        link: "/inventory/items",
        icon: "alert",
        color: "red",
      });
    }

    res.status(201).json(newMovement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
