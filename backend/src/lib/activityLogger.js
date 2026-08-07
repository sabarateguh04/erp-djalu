import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, "../../../data/system/activity-log.json");

async function readLog() {
  try {
    const raw = await readFile(LOG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeLog(entries) {
  await mkdir(path.dirname(LOG_FILE), { recursive: true });
  await writeFile(LOG_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

// Generic activity logger used by every modul's CRUD routes. Never throws —
// a logging failure must not break the actual business operation that
// triggered it, so errors are swallowed (and reported to the console).
export async function logActivity(user, modul, aksi, targetId, ringkasan) {
  try {
    const entries = await readLog();
    entries.unshift({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      userNama: user?.nama || "System",
      modul,
      aksi,
      targetId: targetId || null,
      ringkasan,
    });
    await writeLog(entries);
  } catch (err) {
    console.error("[activity-log] gagal mencatat aktivitas:", err.message);
  }
}

export async function getActivityLog({ modul, userId, from, to } = {}) {
  let entries = await readLog();
  if (modul) entries = entries.filter((e) => e.modul === modul);
  if (userId) entries = entries.filter((e) => e.userId === userId);
  if (from) entries = entries.filter((e) => e.timestamp.slice(0, 10) >= from);
  if (to) entries = entries.filter((e) => e.timestamp.slice(0, 10) <= to);
  return entries;
}
