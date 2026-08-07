import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/procurement");

async function ensureDirFor(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(filePath, data) {
  await ensureDirFor(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

const vendorsFile = () => path.join(DATA_DIR, "vendors.json");
const poFile = () => path.join(DATA_DIR, "purchase-orders.json");
const poHistoryFile = (dateStr) => path.join(DATA_DIR, "purchase-orders", "history", `${dateStr}.json`);

export const getVendors = () => readJson(vendorsFile(), []);
export const saveVendors = (list) => writeJson(vendorsFile(), list);

export const getPurchaseOrders = () => readJson(poFile(), []);

export async function savePurchaseOrders(list) {
  await writeJson(poFile(), list);
  const today = new Date().toISOString().slice(0, 10);
  await writeJson(poHistoryFile(today), list);
}

// Format PO-<tahun>-0001, sekuensial per tahun berdasarkan jumlah PO yang
// sudah ada di tahun itu.
export function nextNomorPO(existingPOs, year) {
  const prefix = `PO-${year}-`;
  const countThisYear = existingPOs.filter((po) => po.nomorPO?.startsWith(prefix)).length;
  return `${prefix}${String(countThisYear + 1).padStart(4, "0")}`;
}
