import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/crm");

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

const customersFile = () => path.join(DATA_DIR, "customers.json");
const pipelineFile = () => path.join(DATA_DIR, "pipeline.json");
const pipelineHistoryFile = (dateStr) => path.join(DATA_DIR, "pipeline", "history", `${dateStr}.json`);

export const getCustomers = () => readJson(customersFile(), []);
export const saveCustomers = (list) => writeJson(customersFile(), list);

export const getPipeline = () => readJson(pipelineFile(), []);

export async function savePipeline(list) {
  await writeJson(pipelineFile(), list);
  const today = new Date().toISOString().slice(0, 10);
  await writeJson(pipelineHistoryFile(today), list);
}
