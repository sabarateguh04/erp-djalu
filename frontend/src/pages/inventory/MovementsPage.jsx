import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { inventoryApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = { tanggal: new Date().toISOString().slice(0, 10), itemId: "", tipe: "Masuk", qty: "", referensi: "", catatan: "" };

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function MovementsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("inventory:edit");
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [i, m] = await Promise.all([inventoryApi.listItems(), inventoryApi.listMovements()]);
      setItems(i);
      setMovements(m);
      if (!form.itemId && i.length > 0) setForm((f) => ({ ...f, itemId: i[0].id }));
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
    if (!form.itemId || !form.qty) {
      setFormError("Item dan qty wajib diisi");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await inventoryApi.createMovement(form);
      setForm((f) => ({ ...f, qty: "", referensi: "", catatan: "" }));
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const itemNama = (id) => items.find((i) => i.id === id)?.nama || id;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventory — Barang Masuk/Keluar</h2>
        <p className="text-sm text-gray-400 mt-0.5">{movements.length} transaksi tercatat</p>
      </div>

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Input Movement</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-medium text-gray-500">Tanggal</label>
              <input
                type="date"
                value={form.tanggal}
                onChange={handleChange("tanggal")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs font-medium text-gray-500">Item</label>
              <select
                value={form.itemId}
                onChange={handleChange("itemId")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku} — {i.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Tipe</label>
              <select
                value={form.tipe}
                onChange={handleChange("tipe")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Qty</label>
              <input
                type="number"
                value={form.qty}
                onChange={handleChange("qty")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Referensi</label>
              <input
                type="text"
                value={form.referensi}
                onChange={handleChange("referensi")}
                placeholder="No. PO/project"
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
              disabled={saving || items.length === 0}
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
        ) : movements.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">TANGGAL</th>
                  <th className="pb-2 font-medium min-w-[160px]">ITEM</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TIPE</th>
                  <th className="pb-2 font-medium whitespace-nowrap">QTY</th>
                  <th className="pb-2 font-medium whitespace-nowrap">REFERENSI</th>
                  <th className="pb-2 font-medium">CATATAN</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 whitespace-nowrap text-sm text-gray-600">{formatDate(m.tanggal)}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{itemNama(m.itemId)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          m.tipe === "Masuk" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {m.tipe === "Masuk" ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                        {m.tipe}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{m.qty}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">{m.referensi || "-"}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500 max-w-xs truncate" title={m.catatan}>
                      {m.catatan || "-"}
                    </td>
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
