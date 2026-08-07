import { Router } from "express";
import { getNotifications, saveNotifications } from "../lib/notificationStore.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// GET /api/notifications — gabungan notifikasi global (userId: null) + yang
// khusus ditujukan ke user yang sedang login.
router.get("/", async (req, res) => {
  try {
    const list = await getNotifications();
    const mine = list
      .filter((n) => n.userId === null || n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(mine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const list = await getNotifications();
    const notif = list.find((n) => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: "Notifikasi tidak ditemukan" });
    if (notif.userId !== null && notif.userId !== req.user.id) {
      return res.status(403).json({ error: "Anda tidak punya akses ke notifikasi ini" });
    }
    notif.sudahDibaca = true;
    await saveNotifications(list);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
