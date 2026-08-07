import { Router } from "express";
import { randomUUID } from "crypto";
import {
  getVendors,
  saveVendors,
  getPurchaseOrders,
  savePurchaseOrders,
  nextNomorPO,
} from "../lib/procurementStore.js";
import { getItems, saveItems, getMovements, saveMovements } from "../lib/inventoryStore.js";
import { addNotification, addNotificationForPermission } from "../lib/notificationStore.js";
import { logActivity } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

// ---- Vendors ----

router.get("/vendors", requirePermission("procurement:view"), async (req, res) => {
  try {
    res.json(await getVendors());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/vendors", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const { nama, kontakNama, kontakTelepon, email, alamat, catatan } = req.body || {};
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama vendor wajib diisi" });
    }
    const vendors = await getVendors();
    const now = new Date().toISOString();
    const vendor = {
      id: randomUUID(),
      nama: nama.trim(),
      kontakNama: kontakNama || "",
      kontakTelepon: kontakTelepon || "",
      email: email || "",
      alamat: alamat || "",
      catatan: catatan || "",
      createdAt: now,
      updatedAt: now,
    };
    vendors.unshift(vendor);
    await saveVendors(vendors);
    await logActivity(req.user, "procurement", "create", vendor.id, `Menambahkan vendor: ${vendor.nama}`);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/vendors/:id", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const vendors = await getVendors();
    const vendor = vendors.find((v) => v.id === req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor tidak ditemukan" });
    const fields = ["nama", "kontakNama", "kontakTelepon", "email", "alamat", "catatan"];
    for (const f of fields) {
      if (req.body[f] !== undefined) vendor[f] = req.body[f];
    }
    vendor.updatedAt = new Date().toISOString();
    await saveVendors(vendors);
    await logActivity(req.user, "procurement", "update", vendor.id, `Mengubah vendor: ${vendor.nama}`);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/vendors/:id", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const vendors = await getVendors();
    const target = vendors.find((v) => v.id === req.params.id);
    const filtered = vendors.filter((v) => v.id !== req.params.id);
    if (filtered.length === vendors.length) {
      return res.status(404).json({ error: "Vendor tidak ditemukan" });
    }
    await saveVendors(filtered);
    await logActivity(req.user, "procurement", "delete", req.params.id, `Menghapus vendor: ${target?.nama || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Purchase Orders ----

router.get("/purchase-orders", requirePermission("procurement:view"), async (req, res) => {
  try {
    res.json(await getPurchaseOrders());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/purchase-orders", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const { tanggal, vendorId, items } = req.body || {};
    if (!tanggal || !vendorId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Tanggal, vendor, dan minimal 1 item wajib diisi" });
    }
    const vendors = await getVendors();
    if (!vendors.some((v) => v.id === vendorId)) {
      return res.status(400).json({ error: "Vendor tidak ditemukan" });
    }

    const normalizedItems = items.map((it) => {
      const qty = Number(it.qty) || 0;
      const hargaSatuan = Number(it.hargaSatuan) || 0;
      return {
        itemId: it.itemId || null,
        nama: it.nama || "",
        qty,
        hargaSatuan,
        subtotal: qty * hargaSatuan,
      };
    });
    const total = normalizedItems.reduce((sum, it) => sum + it.subtotal, 0);

    const pos = await getPurchaseOrders();
    const year = new Date(tanggal).getFullYear() || new Date().getFullYear();
    const now = new Date().toISOString();
    const po = {
      id: randomUUID(),
      nomorPO: nextNomorPO(pos, year),
      tanggal,
      vendorId,
      items: normalizedItems,
      total,
      status: "Draft",
      requestedBy: req.user.id,
      approvedBy: null,
      catatanApproval: "",
      createdAt: now,
      updatedAt: now,
    };
    pos.unshift(po);
    await savePurchaseOrders(pos);
    await logActivity(req.user, "procurement", "create", po.id, `Membuat PO ${po.nomorPO}`);
    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function loadPO(req, res) {
  const pos = await getPurchaseOrders();
  const po = pos.find((p) => p.id === req.params.id);
  if (!po) {
    res.status(404).json({ error: "PO tidak ditemukan" });
    return null;
  }
  return { pos, po };
}

// PUT /api/procurement/purchase-orders/:id/submit
router.put("/purchase-orders/:id/submit", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const found = await loadPO(req, res);
    if (!found) return;
    const { pos, po } = found;
    if (po.status !== "Draft") {
      return res.status(400).json({ error: "Hanya PO berstatus Draft yang bisa disubmit" });
    }
    po.status = "Menunggu Approval";
    po.updatedAt = new Date().toISOString();
    await savePurchaseOrders(pos);
    await logActivity(req.user, "procurement", "update", po.id, `Submit PO ${po.nomorPO} untuk approval`);
    await addNotificationForPermission("procurement:approve", {
      tipe: "approval-request",
      text: `PO ${po.nomorPO} menunggu approval Anda`,
      link: "/procurement/purchase-orders",
      icon: "clock",
      color: "orange",
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/procurement/purchase-orders/:id/approve
router.put("/purchase-orders/:id/approve", requirePermission("procurement:approve"), async (req, res) => {
  try {
    const found = await loadPO(req, res);
    if (!found) return;
    const { pos, po } = found;
    if (po.status !== "Menunggu Approval") {
      return res.status(400).json({ error: "Hanya PO berstatus Menunggu Approval yang bisa disetujui" });
    }
    po.status = "Disetujui";
    po.approvedBy = req.user.id;
    po.catatanApproval = "";
    po.updatedAt = new Date().toISOString();
    await savePurchaseOrders(pos);
    await logActivity(req.user, "procurement", "approve", po.id, `Menyetujui PO ${po.nomorPO}`);
    await addNotification({
      userId: po.requestedBy,
      tipe: "info",
      text: `PO ${po.nomorPO} disetujui`,
      link: "/procurement/purchase-orders",
      icon: "check",
      color: "green",
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/procurement/purchase-orders/:id/reject
router.put("/purchase-orders/:id/reject", requirePermission("procurement:approve"), async (req, res) => {
  try {
    const found = await loadPO(req, res);
    if (!found) return;
    const { pos, po } = found;
    if (po.status !== "Menunggu Approval") {
      return res.status(400).json({ error: "Hanya PO berstatus Menunggu Approval yang bisa ditolak" });
    }
    po.status = "Ditolak";
    po.approvedBy = req.user.id;
    po.catatanApproval = req.body?.catatanApproval || "";
    po.updatedAt = new Date().toISOString();
    await savePurchaseOrders(pos);
    await logActivity(req.user, "procurement", "reject", po.id, `Menolak PO ${po.nomorPO}`);
    await addNotification({
      userId: po.requestedBy,
      tipe: "warning",
      text: `PO ${po.nomorPO} ditolak${po.catatanApproval ? `: ${po.catatanApproval}` : ""}`,
      link: "/procurement/purchase-orders",
      icon: "alert",
      color: "red",
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/procurement/purchase-orders/:id/receive — trigger inventory movement Masuk
router.put("/purchase-orders/:id/receive", requirePermission("procurement:edit"), async (req, res) => {
  try {
    const found = await loadPO(req, res);
    if (!found) return;
    const { pos, po } = found;
    if (po.status !== "Disetujui") {
      return res.status(400).json({ error: "Hanya PO berstatus Disetujui yang bisa diterima" });
    }

    const items = await getItems();
    const movements = await getMovements();
    const now = new Date().toISOString();
    let linkedCount = 0;

    for (const line of po.items) {
      if (!line.itemId) continue;
      const item = items.find((i) => i.id === line.itemId);
      if (!item) continue;
      item.stokSaatIni += line.qty;
      item.updatedAt = now;
      movements.unshift({
        id: randomUUID(),
        tanggal: new Date().toISOString().slice(0, 10),
        itemId: item.id,
        tipe: "Masuk",
        qty: line.qty,
        referensi: po.nomorPO,
        catatan: `Penerimaan PO ${po.nomorPO}`,
        createdBy: req.user.id,
        createdAt: now,
      });
      linkedCount += 1;
    }
    if (linkedCount > 0) {
      await saveItems(items);
      await saveMovements(movements);
    }

    po.status = "Diterima";
    po.updatedAt = now;
    await savePurchaseOrders(pos);
    await logActivity(
      req.user,
      "procurement",
      "update",
      po.id,
      `Menerima PO ${po.nomorPO}${linkedCount > 0 ? ` (${linkedCount} item masuk inventory)` : ""}`
    );
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
