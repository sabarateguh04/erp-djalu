import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { crmApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const TAHAP_OPTIONS = ["Prospek", "Kualifikasi", "Proposal", "Negosiasi", "Menang", "Kalah"];
const TAHAP_BADGE = {
  Prospek: "bg-gray-100 text-gray-600",
  Kualifikasi: "bg-blue-50 text-blue-600",
  Proposal: "bg-purple-50 text-purple-600",
  Negosiasi: "bg-orange-50 text-orange-600",
  Menang: "bg-green-50 text-green-600",
  Kalah: "bg-red-50 text-red-600",
};

function formatRupiah(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

function DealModal({ customers, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    judul: "",
    tahap: "Prospek",
    nilaiEstimasi: "",
    tanggalTarget: "",
  });
  const [error, setError] = useState("");
  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerId || !form.judul.trim() || !form.nilaiEstimasi) {
      setError("Customer, judul deal, dan nilai estimasi wajib diisi");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Tambah Deal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Customer</label>
            <select
              value={form.customerId}
              onChange={handleChange("customerId")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} {c.perusahaan ? `(${c.perusahaan})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Judul Deal</label>
            <input
              type="text"
              value={form.judul}
              onChange={handleChange("judul")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Tahap</label>
              <select
                value={form.tahap}
                onChange={handleChange("tahap")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {TAHAP_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Nilai Estimasi (Rp)</label>
              <input
                type="number"
                value={form.nilaiEstimasi}
                onChange={handleChange("nilaiEstimasi")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Target Closing</label>
            <input
              type="date"
              value={form.tanggalTarget}
              onChange={handleChange("tanggalTarget")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("crm:edit");
  const [pipeline, setPipeline] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c] = await Promise.all([crmApi.listPipeline(), crmApi.listCustomers()]);
      setPipeline(p);
      setCustomers(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const customerNama = (id) => customers.find((c) => c.id === id)?.nama || "-";

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await crmApi.createDeal(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTahapChange = async (deal, tahap) => {
    setBusyId(deal.id);
    try {
      await crmApi.updateTahap(deal.id, tahap);
      await load();
    } catch (err) {
      alert(`Gagal mengubah tahap: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (deal) => {
    if (!confirm(`Hapus deal "${deal.judul}"?`)) return;
    try {
      await crmApi.removeDeal(deal.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const totalPipeline = pipeline
    .filter((p) => !["Menang", "Kalah"].includes(p.tahap))
    .reduce((sum, p) => sum + p.nilaiEstimasi, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM — Pipeline</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pipeline.length} deal · potensi aktif {formatRupiah(totalPipeline)}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            disabled={customers.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            title={customers.length === 0 ? "Tambah customer dulu" : ""}
          >
            <Plus size={16} /> Tambah Deal
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : pipeline.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada deal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium min-w-[160px]">DEAL</th>
                  <th className="pb-2 font-medium min-w-[140px]">CUSTOMER</th>
                  <th className="pb-2 font-medium whitespace-nowrap">NILAI</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TARGET</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TAHAP</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {pipeline.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{p.judul}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{customerNama(p.customerId)}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatRupiah(p.nilaiEstimasi)}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">
                      {p.tanggalTarget ? new Date(p.tanggalTarget).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {canEdit ? (
                        <select
                          value={p.tahap}
                          onChange={(e) => handleTahapChange(p, e.target.value)}
                          disabled={busyId === p.id}
                          className={`text-xs font-medium px-2 py-1.5 rounded-lg border-0 outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50 ${TAHAP_BADGE[p.tahap]}`}
                        >
                          {TAHAP_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TAHAP_BADGE[p.tahap]}`}>{p.tahap}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 pr-4">
                        <button onClick={() => handleDelete(p)} className="text-gray-400 hover:text-red-500" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <DealModal customers={customers} saving={saving} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
