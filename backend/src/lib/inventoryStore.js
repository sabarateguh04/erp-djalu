import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/inventory");

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

const itemsFile = () => path.join(DATA_DIR, "items.json");
const movementsFile = () => path.join(DATA_DIR, "movements.json");
const itemsHistoryFile = (dateStr) => path.join(DATA_DIR, "items", "history", `${dateStr}.json`);

export const getItems = () => readJson(itemsFile(), []);
export const getMovements = () => readJson(movementsFile(), []);
export const saveMovements = (list) => writeJson(movementsFile(), list);

// Saves items.json AND a dated snapshot under items/history/<YYYY-MM-DD>.json,
// same convention as the management modul's daily snapshots.
export async function saveItems(items) {
  await writeJson(itemsFile(), items);
  const today = new Date().toISOString().slice(0, 10);
  await writeJson(itemsHistoryFile(today), items);
}
