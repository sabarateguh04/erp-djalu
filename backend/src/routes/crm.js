import { Router } from "express";
import { randomUUID } from "crypto";
import { getCustomers, saveCustomers, getPipeline, savePipeline } from "../lib/crmStore.js";
import { logActivity } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

const SUMBER_OPTIONS = ["Referral", "Website", "Event", "Lainnya"];
const TAHAP_OPTIONS = ["Prospek", "Kualifikasi", "Proposal", "Negosiasi", "Menang", "Kalah"];

// ---- Customers ----

router.get("/customers", requirePermission("crm:view"), async (req, res) => {
  try {
    res.json(await getCustomers());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/customers", requirePermission("crm:edit"), async (req, res) => {
  try {
    const { nama, perusahaan, email, telepon, alamat, sumber, catatan } = req.body || {};
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama customer wajib diisi" });
    }
    if (sumber && !SUMBER_OPTIONS.includes(sumber)) {
      return res.status(400).json({ error: "Sumber tidak valid" });
    }
    const customers = await getCustomers();
    const now = new Date().toISOString();
    const customer = {
      id: randomUUID(),
      nama: nama.trim(),
      perusahaan: perusahaan || "",
      email: email || "",
      telepon: telepon || "",
      alamat: alamat || "",
      sumber: sumber || "Lainnya",
      catatan: catatan || "",
      createdAt: now,
      updatedAt: now,
    };
    customers.unshift(customer);
    await saveCustomers(customers);
    await logActivity(req.user, "crm", "create", customer.id, `Menambahkan customer: ${customer.nama}`);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/customers/:id", requirePermission("crm:edit"), async (req, res) => {
  try {
    const customers = await getCustomers();
    const customer = customers.find((c) => c.id === req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer tidak ditemukan" });
    const fields = ["nama", "perusahaan", "email", "telepon", "alamat", "catatan"];
    for (const f of fields) {
      if (req.body[f] !== undefined) customer[f] = req.body[f];
    }
    if (req.body.sumber !== undefined) {
      if (!SUMBER_OPTIONS.includes(req.body.sumber)) {
        return res.status(400).json({ error: "Sumber tidak valid" });
      }
      customer.sumber = req.body.sumber;
    }
    customer.updatedAt = new Date().toISOString();
    await saveCustomers(customers);
    await logActivity(req.user, "crm", "update", customer.id, `Mengubah customer: ${customer.nama}`);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/customers/:id", requirePermission("crm:edit"), async (req, res) => {
  try {
    const customers = await getCustomers();
    const target = customers.find((c) => c.id === req.params.id);
    const filtered = customers.filter((c) => c.id !== req.params.id);
    if (filtered.length === customers.length) {
      return res.status(404).json({ error: "Customer tidak ditemukan" });
    }
    await saveCustomers(filtered);
    await logActivity(req.user, "crm", "delete", req.params.id, `Menghapus customer: ${target?.nama || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Pipeline ----

router.get("/pipeline", requirePermission("crm:view"), async (req, res) => {
  try {
    res.json(await getPipeline());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pipeline", requirePermission("crm:edit"), async (req, res) => {
  try {
    const { customerId, judul, tahap, nilaiEstimasi, tanggalTarget, picId } = req.body || {};
    if (!customerId || !judul || !judul.trim() || nilaiEstimasi === undefined || nilaiEstimasi === "") {
      return res.status(400).json({ error: "Customer, judul deal, dan nilai estimasi wajib diisi" });
    }
    const customers = await getCustomers();
    if (!customers.some((c) => c.id === customerId)) {
      return res.status(400).json({ error: "Customer tidak ditemukan" });
    }
    if (tahap && !TAHAP_OPTIONS.includes(tahap)) {
      return res.status(400).json({ error: "Tahap tidak valid" });
    }

    const pipeline = await getPipeline();
    const now = new Date().toISOString();
    const deal = {
      id: randomUUID(),
      customerId,
      judul: judul.trim(),
      tahap: tahap || "Prospek",
      nilaiEstimasi: Number(nilaiEstimasi),
      tanggalTarget: tanggalTarget || null,
      picId: picId || req.user.id,
      createdAt: now,
      updatedAt: now,
    };
    pipeline.unshift(deal);
    await savePipeline(pipeline);
    await logActivity(req.user, "crm", "create", deal.id, `Menambahkan deal: ${deal.judul}`);
    res.status(201).json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/pipeline/:id", requirePermission("crm:edit"), async (req, res) => {
  try {
    const pipeline = await getPipeline();
    const deal = pipeline.find((p) => p.id === req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal tidak ditemukan" });

    const { customerId, judul, tahap, nilaiEstimasi, tanggalTarget, picId } = req.body || {};
    if (customerId !== undefined) deal.customerId = customerId;
    if (judul !== undefined) deal.judul = judul;
    if (tahap !== undefined) {
      if (!TAHAP_OPTIONS.includes(tahap)) return res.status(400).json({ error: "Tahap tidak valid" });
      deal.tahap = tahap;
    }
    if (nilaiEstimasi !== undefined && nilaiEstimasi !== "") deal.nilaiEstimasi = Number(nilaiEstimasi);
    if (tanggalTarget !== undefined) deal.tanggalTarget = tanggalTarget || null;
    if (picId !== undefined) deal.picId = picId;
    deal.updatedAt = new Date().toISOString();

    await savePipeline(pipeline);
    await logActivity(req.user, "crm", "update", deal.id, `Mengubah deal: ${deal.judul}`);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/crm/pipeline/:id/tahap — khusus update tahap (dipakai drag-drop kanban)
router.put("/pipeline/:id/tahap", requirePermission("crm:edit"), async (req, res) => {
  try {
    const { tahap } = req.body || {};
    if (!tahap || !TAHAP_OPTIONS.includes(tahap)) {
      return res.status(400).json({ error: "Tahap tidak valid" });
    }
    const pipeline = await getPipeline();
    const deal = pipeline.find((p) => p.id === req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal tidak ditemukan" });

    deal.tahap = tahap;
    deal.updatedAt = new Date().toISOString();
    await savePipeline(pipeline);
    await logActivity(req.user, "crm", "update", deal.id, `Mengubah tahap deal ${deal.judul} -> ${tahap}`);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/pipeline/:id", requirePermission("crm:edit"), async (req, res) => {
  try {
    const pipeline = await getPipeline();
    const target = pipeline.find((p) => p.id === req.params.id);
    const filtered = pipeline.filter((p) => p.id !== req.params.id);
    if (filtered.length === pipeline.length) {
      return res.status(404).json({ error: "Deal tidak ditemukan" });
    }
    await savePipeline(filtered);
    await logActivity(req.user, "crm", "delete", req.params.id, `Menghapus deal: ${target?.judul || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
