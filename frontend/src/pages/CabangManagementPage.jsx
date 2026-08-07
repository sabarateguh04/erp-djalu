import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cabangApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { nama: "", alamat: "" };

function CabangModal({ initial, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [error, setError] = useState("");
  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError("Nama cabang wajib diisi");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{initial ? "Edit Cabang" : "Tambah Cabang"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nama Cabang</label>
            <input
              type="text"
              value={form.nama}
              onChange={handleChange("nama")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Alamat</label>
            <textarea
              value={form.alamat}
              onChange={handleChange("alamat")}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none"
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

export default function CabangManagementPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("cabang:manage");
  const [cabang, setCabang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setCabang(await cabangApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await cabangApi.update(editing.id, form);
      } else {
        await cabangApi.create(form);
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Hapus cabang "${c.nama}"?`)) return;
    try {
      await cabangApi.remove(c.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Cabang</h2>
          <p className="text-sm text-gray-400 mt-0.5">{cabang.length} cabang terdaftar</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Tambah Cabang
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : cabang.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada cabang.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium min-w-[160px]">NAMA CABANG</th>
                  <th className="pb-2 font-medium">ALAMAT</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {cabang.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{c.nama}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{c.alamat || "-"}</td>
                    {canEdit && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <button
                            onClick={() => {
                              setEditing(c);
                              setModalOpen(true);
                            }}
                            className="hover:text-brand-600"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(c)} className="hover:text-red-500" title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
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
        <CabangModal
          initial={editing}
          saving={saving}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
