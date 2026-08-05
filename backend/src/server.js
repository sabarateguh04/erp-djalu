import express from "express";
import cors from "cors";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.use("/api", dashboardRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "erp-djalu-backend" });
});

app.listen(PORT, () => {
  console.log(`ERP Djalu backend running on http://localhost:${PORT}`);
});
