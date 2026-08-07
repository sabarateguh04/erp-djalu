import { Router } from "express";
import { randomUUID } from "crypto";
import { getAttendance, saveAttendance, getPayroll, savePayroll, HARI_KERJA_PER_BULAN } from "../lib/hrStore.js";
import { readCategory } from "../lib/managementStore.js";
import { addNotificationForPermission } from "../lib/notificationStore.js";
import { logActivity } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

const ATTENDANCE_STATUS = ["Hadir", "Izin", "Sakit", "Cuti", "Alpha"];
const PAYROLL_STATUS = ["Draft", "Disetujui", "Dibayar"];

// ---- Attendance ----

router.get("/attendance", requirePermission("hr:view"), async (req, res) => {
  try {
    res.json(await getAttendance());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/attendance", requirePermission("hr:edit"), async (req, res) => {
  try {
    const { karyawanId, tanggal, jamMasuk, jamPulang, status, catatan } = req.body || {};
    if (!karyawanId || !tanggal || !status) {
      return res.status(400).json({ error: "Karyawan, tanggal, dan status wajib diisi" });
    }
    if (!ATTENDANCE_STATUS.includes(status)) {
      return res.status(400).json({ error: "Status absensi tidak valid" });
    }
    const list = await getAttendance();
    const now = new Date().toISOString();
    const entry = {
      id: randomUUID(),
      karyawanId,
      tanggal,
      jamMasuk: jamMasuk || "",
      jamPulang: jamPulang || "",
      status,
      catatan: catatan || "",
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(entry);
    await saveAttendance(list);
    await logActivity(req.user, "hr", "create", entry.id, `Mencatat absensi ${status} (${tanggal})`);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/attendance/:id", requirePermission("hr:edit"), async (req, res) => {
  try {
    const list = await getAttendance();
    const entry = list.find((a) => a.id === req.params.id);
    if (!entry) return res.status(404).json({ error: "Data absensi tidak ditemukan" });
    const { tanggal, jamMasuk, jamPulang, status, catatan } = req.body || {};
    if (status !== undefined) {
      if (!ATTENDANCE_STATUS.includes(status)) return res.status(400).json({ error: "Status absensi tidak valid" });
      entry.status = status;
    }
    if (tanggal !== undefined) entry.tanggal = tanggal;
    if (jamMasuk !== undefined) entry.jamMasuk = jamMasuk;
    if (jamPulang !== undefined) entry.jamPulang = jamPulang;
    if (catatan !== undefined) entry.catatan = catatan;
    entry.updatedAt = new Date().toISOString();
    await saveAttendance(list);
    await logActivity(req.user, "hr", "update", entry.id, `Mengubah absensi (${entry.tanggal})`);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/attendance/:id", requirePermission("hr:edit"), async (req, res) => {
  try {
    const list = await getAttendance();
    const filtered = list.filter((a) => a.id !== req.params.id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: "Data absensi tidak ditemukan" });
    }
    await saveAttendance(filtered);
    await logActivity(req.user, "hr", "delete", req.params.id, "Menghapus data absensi");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Payroll ----

router.get("/payroll", requirePermission("hr:view"), async (req, res) => {
  try {
    res.json(await getPayroll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hr/payroll/generate — { periode: "2026-08" }
// Loop semua karyawan aktif yang punya gajiPokok, hitung potongan dari
// jumlah "Alpha" di bulan itu, buat/replace payroll Draft utk periode ini.
router.post("/payroll/generate", requirePermission("hr:edit"), async (req, res) => {
  try {
    const { periode } = req.body || {};
    if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
      return res.status(400).json({ error: "Periode wajib diisi format YYYY-MM" });
    }

    const karyawanList = await readCategory("karyawan");
    const aktifKaryawan = karyawanList.filter((k) => k.status === "Aktif" && k.gajiPokok);
    if (aktifKaryawan.length === 0) {
      return res.status(400).json({ error: "Tidak ada karyawan aktif dengan gajiPokok terisi" });
    }

    const attendance = await getAttendance();
    const existingPayroll = await getPayroll();
    const now = new Date().toISOString();
    const generated = [];

    for (const k of aktifKaryawan) {
      const alreadyExists = existingPayroll.find((p) => p.karyawanId === k.id && p.periode === periode);
      if (alreadyExists) continue; // jangan generate ulang yang sudah ada

      const alphaCount = attendance.filter(
        (a) => a.karyawanId === k.id && a.tanggal.startsWith(periode) && a.status === "Alpha"
      ).length;
      const gajiPokok = Number(k.gajiPokok);
      const gajiHarian = gajiPokok / HARI_KERJA_PER_BULAN;
      const potongan = Math.round(gajiHarian * alphaCount);
      const tunjangan = 0;
      const totalGaji = gajiPokok + tunjangan - potongan;

      const record = {
        id: randomUUID(),
        karyawanId: k.id,
        periode,
        gajiPokok,
        tunjangan,
        potongan,
        totalGaji,
        status: "Draft",
        createdAt: now,
        updatedAt: now,
      };
      existingPayroll.unshift(record);
      generated.push(record);
    }

    await savePayroll(existingPayroll);
    await logActivity(req.user, "hr", "create", null, `Generate payroll periode ${periode} (${generated.length} karyawan)`);

    if (generated.length > 0) {
      await addNotificationForPermission("hr:edit", {
        tipe: "info",
        text: `Payroll periode ${periode} siap direview (${generated.length} karyawan)`,
        link: "/hr/payroll",
        icon: "clock",
        color: "blue",
      });
    }

    res.status(201).json({ generated: generated.length, skipped: aktifKaryawan.length - generated.length, items: generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hr/payroll/:id — koreksi tunjangan/potongan manual selagi Draft
router.put("/payroll/:id", requirePermission("hr:edit"), async (req, res) => {
  try {
    const list = await getPayroll();
    const record = list.find((p) => p.id === req.params.id);
    if (!record) return res.status(404).json({ error: "Data payroll tidak ditemukan" });
    if (record.status !== "Draft") {
      return res.status(400).json({ error: "Hanya payroll berstatus Draft yang bisa diubah" });
    }
    const { tunjangan, potongan } = req.body || {};
    if (tunjangan !== undefined && tunjangan !== "") record.tunjangan = Number(tunjangan);
    if (potongan !== undefined && potongan !== "") record.potongan = Number(potongan);
    record.totalGaji = record.gajiPokok + record.tunjangan - record.potongan;
    record.updatedAt = new Date().toISOString();
    await savePayroll(list);
    await logActivity(req.user, "hr", "update", record.id, `Mengubah payroll periode ${record.periode}`);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/payroll/:id/approve", requirePermission("hr:edit"), async (req, res) => {
  try {
    const list = await getPayroll();
    const record = list.find((p) => p.id === req.params.id);
    if (!record) return res.status(404).json({ error: "Data payroll tidak ditemukan" });
    if (record.status !== "Draft") {
      return res.status(400).json({ error: "Hanya payroll berstatus Draft yang bisa disetujui" });
    }
    record.status = "Disetujui";
    record.updatedAt = new Date().toISOString();
    await savePayroll(list);
    await logActivity(req.user, "hr", "approve", record.id, `Menyetujui payroll periode ${record.periode}`);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/payroll/:id/bayar", requirePermission("hr:edit"), async (req, res) => {
  try {
    const list = await getPayroll();
    const record = list.find((p) => p.id === req.params.id);
    if (!record) return res.status(404).json({ error: "Data payroll tidak ditemukan" });
    if (record.status !== "Disetujui") {
      return res.status(400).json({ error: "Hanya payroll berstatus Disetujui yang bisa dibayar" });
    }
    record.status = "Dibayar";
    record.updatedAt = new Date().toISOString();
    await savePayroll(list);
    await logActivity(req.user, "hr", "update", record.id, `Membayar payroll periode ${record.periode}`);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
