import { useEffect, useState } from "react";
import { systemApi } from "../api/client.js";

const MODUL_OPTIONS = [
  "",
  "auth",
  "karyawan",
  "aset",
  "operasional",
  "project",
  "finance",
  "sales",
  "inventory",
  "procurement",
  "crm",
  "hr",
];

const AKSI_BADGE = {
  create: "bg-green-50 text-green-600",
  update: "bg-blue-50 text-blue-600",
  delete: "bg-red-50 text-red-600",
  login: "bg-gray-100 text-gray-600",
  logout: "bg-gray-100 text-gray-600",
  approve: "bg-purple-50 text-purple-600",
  reject: "bg-orange-50 text-orange-600",
};

function formatDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function SystemLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modul, setModul] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await systemApi.activityLog({ modul, from, to }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Log</h2>
        <p className="text-sm text-gray-400 mt-0.5">{logs.length} aktivitas tercatat</p>
      </div>

      <form onSubmit={handleFilter} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500">Modul</label>
          <select
            value={modul}
            onChange={(e) => setModul(e.target.value)}
            className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          >
            {MODUL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m || "Semua Modul"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Dari Tanggal</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Sampai Tanggal</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700">
          Terapkan Filter
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">WAKTU</th>
                  <th className="pb-2 font-medium min-w-[140px]">USER</th>
                  <th className="pb-2 font-medium whitespace-nowrap">MODUL</th>
                  <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>
                  <th className="pb-2 font-medium">RINGKASAN</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 whitespace-nowrap text-sm text-gray-600">{formatDateTime(log.timestamp)}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{log.userNama}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{log.modul}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${AKSI_BADGE[log.aksi] || "bg-gray-100 text-gray-600"}`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{log.ringkasan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
