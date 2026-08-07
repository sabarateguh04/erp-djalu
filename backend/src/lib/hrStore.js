import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/hr");

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

const attendanceFile = () => path.join(DATA_DIR, "attendance.json");
const payrollFile = () => path.join(DATA_DIR, "payroll.json");

export const getAttendance = () => readJson(attendanceFile(), []);
export const saveAttendance = (list) => writeJson(attendanceFile(), list);

export const getPayroll = () => readJson(payrollFile(), []);
export const savePayroll = (list) => writeJson(payrollFile(), list);

// Konstanta rumus potongan Alpha — belum ada keputusan bisnis final
// (BIG_SCOPE_DETAIL.md §19), jadi dibuat gampang diubah di satu tempat:
// potongan per hari Alpha = gajiPokok / HARI_KERJA_PER_BULAN. Izin/Sakit/Cuti
// untuk sekarang tidak memotong gaji.
export const HARI_KERJA_PER_BULAN = 22;
