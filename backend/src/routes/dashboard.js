import { Router } from "express";
import { readJson } from "../lib/readData.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth, requirePermission("dashboard"));

function handle(fileName) {
  return async (req, res) => {
    try {
      const data = await readJson(fileName);
      res.json(data);
    } catch (err) {
      console.error(`Failed to read ${fileName}:`, err.message);
      res.status(500).json({ error: `Failed to load ${fileName}` });
    }
  };
}

router.get("/summary", handle("executive-summary.json"));
router.get("/products", handle("products.json"));
router.get("/trend", handle("trend.json"));
router.get("/ai-recommendations", handle("ai-recommendations.json"));
router.get("/next-release", handle("next-release.json"));
router.get("/final-products", handle("final-products.json"));

export default router;
