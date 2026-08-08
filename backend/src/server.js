import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dashboardRouter from "./routes/dashboard.js";
import managementRouter from "./routes/management.js";
import financeKategoriRouter from "./routes/financeKategori.js";
import inventoryRouter from "./routes/inventory.js";
import procurementRouter from "./routes/procurement.js";
import crmRouter from "./routes/crm.js";
import hrRouter from "./routes/hr.js";
import systemRouter from "./routes/system.js";
import reportRouter from "./routes/report.js";
import notificationsRouter from "./routes/notifications.js";
import cabangRouter from "./routes/cabang.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import rolesRouter from "./routes/roles.js";
import { ensureSeedData } from "./lib/authStore.js";
import { ensureFinanceKategoriSeed } from "./lib/financeKategoriStore.js";
import { ensureNotificationSeedShape } from "./lib/notificationStore.js";
import { ensureCabangSeed } from "./lib/cabangStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "erp-djalu-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/management", managementRouter);
app.use("/api/finance-kategori", financeKategoriRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/procurement", procurementRouter);
app.use("/api/crm", crmRouter);
app.use("/api/hr", hrRouter);
app.use("/api/system", systemRouter);
app.use("/api/report", reportRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/cabang", cabangRouter);
// dashboardRouter di-mount di prefix "/api" yang luas (rute-rutenya flat:
// /summary, /products, dst) — makanya HARUS paling akhir di antara semua
// router /api/*, biar middleware requirePermission("dashboard") miliknya
// nggak "nyerobot" request yang sebetulnya buat router lain di atas.
app.use("/api", dashboardRouter);

// Endpoint /api/* yang tidak match router manapun di atas -> 404 JSON,
// bukan ikut jatuh ke fallback index.html di bawah (biar salah ketik path
// API kelihatan jelas errornya, bukan malah dapat balasan HTML).
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

// Satu port buat frontend + backend: serve hasil `npm run build` di
// frontend/dist (lihat backend/package.json -> "serve"), lalu semua rute
// selain /api/* diarahkan ke index.html supaya client-side routing React
// Router tetap jalan walau di-refresh langsung di URL selain "/".
app.use(express.static(FRONTEND_DIST));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) {
      res.status(404).send(
        "Frontend belum di-build. Jalankan `npm run build` di folder frontend/ dulu, " +
          "atau `npm run serve` di folder backend/ (otomatis build + start)."
      );
    }
  });
});

async function start() {
  await ensureSeedData();
  await ensureFinanceKategoriSeed();
  await ensureNotificationSeedShape();
  await ensureCabangSeed();
  app.listen(PORT, () => {
    console.log(`ERP Djalu backend running on http://localhost:${PORT}`);
  });
}

start();
