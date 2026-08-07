import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { reportApi } from "../api/client.js";

export default function ReportPage() {
  const [modules, setModules] = useState([]);
  const [modul, setModul] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    reportApi
      .modules()
      .then((list) => {
        setModules(list);
        setModul(list[0]?.key || "");
      })
      .catch((err) => setError(err.message));
  }, []);

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!modul) return;
    setLoading(true);
    setError("");
    try {
      setRecords(await reportApi.data(modul, { from, to }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!modul) return;
    setExporting(true);
    try {
      await reportApi.exportCsv(modul, { from, to });
    } catch (err) {
      alert(`Gagal export: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const columns = records && records.length > 0 ? Object.keys(records[0]) : [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Report &amp; Export</h2>
        <p className="text-sm text-gray-400 mt-0.5">Preview data lintas modul + export CSV</p>
      </div>

      <form onSubmit={handlePreview} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500">Modul</label>
          <select
            value={modul}
            onChange={(e) => setModul(e.target.value)}
            className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 min-w-[220px]"
          >
            {modules.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
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
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          <Search size={15} /> Preview
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !modul}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <Download size={15} /> {exporting ? "Mengekspor..." : "Export CSV"}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : records === null ? (
          <p className="text-sm text-gray-400">Pilih modul dan rentang tanggal, lalu klik Preview.</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada data untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  {columns.map((c) => (
                    <th key={c} className="pb-2 font-medium whitespace-nowrap pr-4">
                      {c.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    {columns.map((c) => (
                      <td key={c} className="py-2.5 pr-4 text-sm text-gray-600 whitespace-nowrap max-w-xs truncate">
                        {typeof r[c] === "object" && r[c] !== null ? JSON.stringify(r[c]) : String(r[c] ?? "-")}
                      </td>
                    ))}
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
