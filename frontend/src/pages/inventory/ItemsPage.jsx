import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { inventoryApi, cabangApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCabangFilter } from "../../context/CabangFilterContext.jsx";

const emptyForm = { sku: "", nama: "", kategori: "", satuan: "", stokMinimum: "", lokasiGudang: "", cabangId: "" };

function ItemModal({ initial, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [error, setError] = useState("");
  const [cabangOptions, setCabangOptions] = useState([]);

  useEffect(() => {
    cabangApi
      .list()
      .then(setCabangOptions)
      .catch(() => setCabangOptions([]));
  }, []);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.nama.trim() || !form.kategori.trim() || !form.satuan.trim() || form.stokMinimum === "") {
      setError("SKU, nama, kategori, satuan, dan stok minimum wajib diisi");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-800 mb-4">{initial ? "Edit Item" : "Tambah Item"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={handleChange("sku")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Nama Item</label>
              <input
                type="text"
                value={form.nama}
                onChange={handleChange("nama")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Kategori</label>
              <input
                type="text"
                value={form.kategori}
                onChange={handleChange("kategori")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Satuan</label>
              <input
                type="text"
                value={form.satuan}
                onChange={handleChange("satuan")}
                placeholder="pcs, unit, box..."
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Stok Minimum</label>
              <input
                type="number"
                value={form.stokMinimum}
                onChange={handleChange("stokMinimum")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Lokasi Gudang</label>
              <input
                type="text"
                value={form.lokasiGudang}
                onChange={handleChange("lokasiGudang")}
                placeholder="Opsional"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Cabang</label>
            <select
              value={form.cabangId || ""}
              onChange={handleChange("cabangId")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            >
              <option value="">- Pilih cabang -</option>
              {cabangOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          {initial && (
            <p className="text-xs text-gray-400">
              Stok saat ini: <span className="font-medium text-gray-600">{initial.stokSaatIni}</span> {form.satuan}{" "}
              (diubah lewat halaman Barang Masuk/Keluar, bukan di sini)
            </p>
          )}

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

export default function ItemsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("inventory:edit");
  const { filterByCabang } = useCabangFilter();
  const [items, setItems] = useState([]);
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
      setItems(await inventoryApi.listItems());
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
        await inventoryApi.updateItem(editing.id, form);
      } else {
        await inventoryApi.createItem(form);
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

  const handleDelete = async (item) => {
    if (!confirm(`Hapus item "${item.nama}"?`)) return;
    try {
      await inventoryApi.removeItem(item.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const filtered = filterByCabang(items).filter((i) =>
    `${i.sku} ${i.nama} ${i.kategori}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory — Item</h2>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} item terdaftar</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Tambah Item
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
            placeholder="Cari SKU/nama/kategori..."
            className="pl-9 pr-3 py-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada item.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">SKU</th>
                  <th className="pb-2 font-medium min-w-[160px]">NAMA</th>
                  <th className="pb-2 font-medium whitespace-nowrap">KATEGORI</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STOK</th>
                  <th className="pb-2 font-medium whitespace-nowrap">LOKASI</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const low = i.stokSaatIni <= i.stokMinimum;
                  return (
                    <tr key={i.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{i.sku}</td>
                      <td className="py-3 pr-4 text-sm font-medium text-gray-800">{i.nama}</td>
                      <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{i.kategori}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${
                            low ? "text-red-600" : "text-gray-700"
                          }`}
                        >
                          {low && <AlertTriangle size={13} />}
                          {i.stokSaatIni} / min {i.stokMinimum} {i.satuan}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">{i.lokasiGudang || "-"}</td>
                      {canEdit && (
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3 text-gray-400">
                            <button
                              onClick={() => {
                                setEditing(i);
                                setModalOpen(true);
                              }}
                              className="hover:text-brand-600"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(i)} className="hover:text-red-500" title="Hapus">
                              <Trash2 size={15} />
                            </button>
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

      {modalOpen && (
        <ItemModal
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
