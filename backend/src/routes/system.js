import { Router } from "express";
import { getActivityLog } from "../lib/activityLogger.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

// GET /api/system/activity-log?modul=&userId=&from=&to=
router.get("/activity-log", requirePermission("system-log:view"), async (req, res) => {
  try {
    const { modul, userId, from, to } = req.query;
    res.json(await getActivityLog({ modul, userId, from, to }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
