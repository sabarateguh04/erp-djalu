import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { procurementApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = { nama: "", kontakNama: "", kontakTelepon: "", email: "", alamat: "", catatan: "" };

function VendorModal({ initial, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [error, setError] = useState("");
  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError("Nama vendor wajib diisi");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{initial ? "Edit Vendor" : "Tambah Vendor"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nama Vendor</label>
            <input
              type="text"
              value={form.nama}
              onChange={handleChange("nama")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Kontak Nama</label>
              <input
                type="text"
                value={form.kontakNama}
                onChange={handleChange("kontakNama")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Kontak Telepon</label>
              <input
                type="text"
                value={form.kontakTelepon}
                onChange={handleChange("kontakTelepon")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
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
          <div>
            <label className="text-xs font-medium text-gray-500">Catatan</label>
            <input
              type="text"
              value={form.catatan}
              onChange={handleChange("catatan")}
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

export default function VendorsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("procurement:edit");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setVendors(await procurementApi.listVendors());
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
        await procurementApi.updateVendor(editing.id, form);
      } else {
        await procurementApi.createVendor(form);
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

  const handleDelete = async (v) => {
    if (!confirm(`Hapus vendor "${v.nama}"?`)) return;
    try {
      await procurementApi.removeVendor(v.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const filtered = vendors.filter((v) => `${v.nama} ${v.kontakNama} ${v.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Procurement — Vendor</h2>
          <p className="text-sm text-gray-400 mt-0.5">{vendors.length} vendor terdaftar</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Tambah Vendor
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="relative mb-4 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari vendor..."
            className="pl-9 pr-3 py-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada vendor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium min-w-[160px]">VENDOR</th>
                  <th className="pb-2 font-medium min-w-[160px]">KONTAK</th>
                  <th className="pb-2 font-medium">ALAMAT</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{v.nama}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">
                      {v.kontakNama || "-"} {v.kontakTelepon && `· ${v.kontakTelepon}`}
                      <br />
                      {v.email || ""}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 max-w-xs truncate" title={v.alamat}>
                      {v.alamat || "-"}
                    </td>
                    {canEdit && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <button
                            onClick={() => {
                              setEditing(v);
                              setModalOpen(true);
                            }}
                            className="hover:text-brand-600"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(v)} className="hover:text-red-500" title="Hapus">
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
        <VendorModal
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
