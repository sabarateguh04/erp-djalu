import { Router } from "express";
import { REPORT_MODULES, filterByDateRange, toCsv } from "../lib/reportStore.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth, requirePermission("report:view"));

function checkModul(req, res, next) {
  if (!REPORT_MODULES[req.params.modul]) {
    return res.status(404).json({ error: "Modul laporan tidak dikenal" });
  }
  next();
}

// GET /api/report/modules — daftar modul yang bisa dipilih di dropdown
router.get("/modules", async (req, res) => {
  res.json(Object.entries(REPORT_MODULES).map(([key, m]) => ({ key, label: m.label })));
});

// GET /api/report/:modul?from=&to=
router.get("/:modul", checkModul, async (req, res) => {
  try {
    const { from, to } = req.query;
    const config = REPORT_MODULES[req.params.modul];
    const records = await config.load();
    res.json(filterByDateRange(records, config.dateField, from, to));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/report/:modul/export?from=&to=&format=csv
router.get("/:modul/export", checkModul, async (req, res) => {
  try {
    const { from, to } = req.query;
    const config = REPORT_MODULES[req.params.modul];
    const records = await config.load();
    const filtered = filterByDateRange(records, config.dateField, from, to);
    const csv = toCsv(filtered);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.modul}-${from || "all"}_${to || "all"}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
