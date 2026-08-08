import express from "express";
import cors from "cors";
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

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api", dashboardRouter);
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

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "erp-djalu-backend" });
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
