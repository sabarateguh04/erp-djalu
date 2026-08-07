import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { hrApi, managementApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_OPTIONS = ["Hadir", "Izin", "Sakit", "Cuti", "Alpha"];
const STATUS_BADGE = {
  Hadir: "bg-green-50 text-green-600",
  Izin: "bg-blue-50 text-blue-600",
  Sakit: "bg-orange-50 text-orange-600",
  Cuti: "bg-purple-50 text-purple-600",
  Alpha: "bg-red-50 text-red-600",
};

const emptyForm = { karyawanId: "", tanggal: new Date().toISOString().slice(0, 10), jamMasuk: "", jamPulang: "", status: "Hadir", catatan: "" };

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("hr:edit");
  const [karyawan, setKaryawan] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [k, a] = await Promise.all([managementApi.list("karyawan"), hrApi.listAttendance()]);
      const aktif = k.filter((x) => x.status === "Aktif");
      setKaryawan(aktif);
      setAttendance(a);
      setForm((f) => (f.karyawanId ? f : { ...f, karyawanId: aktif[0]?.id || "" }));
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

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.karyawanId) {
      setFormError("Karyawan wajib dipilih");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await hrApi.createAttendance(form);
      setForm((f) => ({ ...f, jamMasuk: "", jamPulang: "", catatan: "" }));
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a) => {
    if (!confirm("Hapus data absensi ini?")) return;
    try {
      await hrApi.removeAttendance(a.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const karyawanNama = (id) => karyawan.find((k) => k.id === id)?.nama || "-";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">HR — Absensi</h2>
        <p className="text-sm text-gray-400 mt-0.5">{attendance.length} catatan absensi</p>
      </div>

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Input Absensi</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Karyawan</label>
              <select
                value={form.karyawanId}
                onChange={handleChange("karyawanId")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {karyawan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Tanggal</label>
              <input
                type="date"
                value={form.tanggal}
                onChange={handleChange("tanggal")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                value={form.status}
                onChange={handleChange("status")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Jam Masuk</label>
              <input
                type="time"
                value={form.jamMasuk}
                onChange={handleChange("jamMasuk")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Jam Pulang</label>
              <input
                type="time"
                value={form.jamPulang}
                onChange={handleChange("jamPulang")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div className="col-span-2 md:col-span-5">
              <label className="text-xs font-medium text-gray-500">Catatan</label>
              <input
                type="text"
                value={form.catatan}
                onChange={handleChange("catatan")}
                placeholder="Opsional"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <button
              type="submit"
              disabled={saving || karyawan.length === 0}
              className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
          {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : attendance.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data absensi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">TANGGAL</th>
                  <th className="pb-2 font-medium min-w-[160px]">KARYAWAN</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
                  <th className="pb-2 font-medium whitespace-nowrap">JAM</th>
                  <th className="pb-2 font-medium">CATATAN</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 whitespace-nowrap text-sm text-gray-600">{formatDate(a.tanggal)}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{karyawanNama(a.karyawanId)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">
                      {a.jamMasuk || "-"} — {a.jamPulang || "-"}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 max-w-xs truncate" title={a.catatan}>
                      {a.catatan || "-"}
                    </td>
                    {canEdit && (
                      <td className="py-3 pr-4">
                        <button onClick={() => handleDelete(a)} className="text-gray-400 hover:text-red-500" title="Hapus">
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
    </div>
  );
}
