import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/management");

function currentFile(category) {
  return path.join(DATA_DIR, `${category}.json`);
}

function historyFile(category, dateStr) {
  return path.join(DATA_DIR, category, "history", `${dateStr}.json`);
}

async function ensureDirFor(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readCategory(category) {
  try {
    const raw = await readFile(currentFile(category), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

// Saves the full current state for a category, AND writes/overwrites a dated
// snapshot file for today under data/management/<category>/history/<YYYY-MM-DD>.json
// so every day that has activity gets its own JSON snapshot per category.
export async function writeCategory(category, records) {
  const filePath = currentFile(category);
  await ensureDirFor(filePath);
  await writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");

  const today = new Date().toISOString().slice(0, 10);
  const snapPath = historyFile(category, today);
  await ensureDirFor(snapPath);
  await writeFile(snapPath, JSON.stringify(records, null, 2), "utf-8");
}
