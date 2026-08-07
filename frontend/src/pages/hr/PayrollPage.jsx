import { useEffect, useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { hrApi, managementApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_BADGE = {
  Draft: "bg-gray-100 text-gray-600",
  Disetujui: "bg-blue-50 text-blue-600",
  Dibayar: "bg-green-50 text-green-600",
};

function formatRupiah(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

function currentPeriode() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("hr:edit");
  const [karyawan, setKaryawan] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState(currentPeriode());
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [k, p] = await Promise.all([managementApi.list("karyawan"), hrApi.listPayroll()]);
      setKaryawan(k);
      setPayroll(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const karyawanNama = (id) => karyawan.find((k) => k.id === id)?.nama || "-";

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await hrApi.generatePayroll(periode);
      alert(`Berhasil generate ${result.generated} payroll (${result.skipped} sudah ada/dilewati).`);
      await load();
    } catch (err) {
      alert(`Gagal generate: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const runAction = async (id, fn) => {
    setBusyId(id);
    try {
      await fn(id);
      await load();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleFieldBlur = async (record, key) => {
    const raw = editValues[`${record.id}-${key}`];
    if (raw === undefined || Number(raw) === record[key]) return;
    setBusyId(record.id);
    try {
      await hrApi.updatePayroll(record.id, { [key]: raw });
      await load();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">HR — Payroll</h2>
        <p className="text-sm text-gray-400 mt-0.5">{payroll.length} slip payroll tercatat</p>
      </div>

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Periode</label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {generating ? "Memproses..." : "Generate Payroll"}
          </button>
          <p className="text-xs text-gray-400 ml-2">
            Otomatis hitung dari karyawan aktif + potongan Alpha bulan berjalan.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : payroll.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada payroll. Generate dulu untuk periode di atas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium min-w-[160px]">KARYAWAN</th>
                  <th className="pb-2 font-medium whitespace-nowrap">PERIODE</th>
                  <th className="pb-2 font-medium whitespace-nowrap">GAJI POKOK</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TUNJANGAN</th>
                  <th className="pb-2 font-medium whitespace-nowrap">POTONGAN</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TOTAL</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {payroll.map((p) => {
                  const editable = canEdit && p.status === "Draft";
                  return (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="py-3 pr-4 text-sm font-medium text-gray-800">{karyawanNama(p.karyawanId)}</td>
                      <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{p.periode}</td>
                      <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatRupiah(p.gajiPokok)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {editable ? (
                          <input
                            type="number"
                            defaultValue={p.tunjangan}
                            onChange={(e) => setEditValues((v) => ({ ...v, [`${p.id}-tunjangan`]: e.target.value }))}
                            onBlur={() => handleFieldBlur(p, "tunjangan")}
                            disabled={busyId === p.id}
                            className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{formatRupiah(p.tunjangan)}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {editable ? (
                          <input
                            type="number"
                            defaultValue={p.potongan}
                            onChange={(e) => setEditValues((v) => ({ ...v, [`${p.id}-potongan`]: e.target.value }))}
                            onBlur={() => handleFieldBlur(p, "potongan")}
                            disabled={busyId === p.id}
                            className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{formatRupiah(p.potongan)}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-sm font-semibold text-gray-800 whitespace-nowrap">{formatRupiah(p.totalGaji)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {p.status === "Draft" && (
                              <button
                                onClick={() => runAction(p.id, hrApi.approvePayroll)}
                                disabled={busyId === p.id}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} /> Setujui
                              </button>
                            )}
                            {p.status === "Disetujui" && (
                              <button
                                onClick={() => runAction(p.id, hrApi.bayarPayroll)}
                                disabled={busyId === p.id}
                                className="flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50"
                              >
                                <Wallet size={13} /> Bayar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
