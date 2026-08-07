import { useEffect, useState } from "react";
import { Plus, X, Send, CheckCircle2, XCircle, PackageCheck } from "lucide-react";
import { procurementApi, inventoryApi } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_BADGE = {
  Draft: "bg-gray-100 text-gray-600",
  "Menunggu Approval": "bg-orange-50 text-orange-600",
  Disetujui: "bg-blue-50 text-blue-600",
  Ditolak: "bg-red-50 text-red-600",
  Diterima: "bg-green-50 text-green-600",
};

function formatRupiah(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}
function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function emptyLine() {
  return { itemId: "", nama: "", qty: "", hargaSatuan: "" };
}

function PoModal({ vendors, items, onClose, onSubmit, saving }) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");

  const updateLine = (idx, key, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      if (key === "itemId" && value) {
        const item = items.find((i) => i.id === value);
        if (item) next[idx].nama = item.nama;
      }
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const total = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.hargaSatuan) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vendorId) {
      setError("Vendor wajib dipilih");
      return;
    }
    const validLines = lines.filter((l) => l.nama.trim() && Number(l.qty) > 0);
    if (validLines.length === 0) {
      setError("Minimal 1 item dengan nama dan qty valid");
      return;
    }
    setError("");
    onSubmit({ tanggal, vendorId, items: validLines });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Buat Purchase Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Vendor</label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                <option value="">- Pilih vendor -</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Item</label>
              <button type="button" onClick={addLine} className="text-xs text-brand-600 hover:underline">
                + Tambah baris
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={line.itemId}
                    onChange={(e) => updateLine(idx, "itemId", e.target.value)}
                    className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Item bebas...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.sku} — {i.nama}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={line.nama}
                    onChange={(e) => updateLine(idx, "nama", e.target.value)}
                    placeholder="Nama item"
                    className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    type="number"
                    value={line.qty}
                    onChange={(e) => updateLine(idx, "qty", e.target.value)}
                    placeholder="Qty"
                    className="col-span-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    type="number"
                    value={line.hargaSatuan}
                    onChange={(e) => updateLine(idx, "hargaSatuan", e.target.value)}
                    placeholder="Harga satuan"
                    className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    className="col-span-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end text-sm font-medium text-gray-700">Total: {formatRupiah(total)}</div>

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
              {saving ? "Menyimpan..." : "Simpan sebagai Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("procurement:edit");
  const canApprove = hasPermission("procurement:approve");

  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, v, i] = await Promise.all([
        procurementApi.listPO(),
        procurementApi.listVendors(),
        inventoryApi.listItems().catch(() => []),
      ]);
      setPos(p);
      setVendors(v);
      setItems(i);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const vendorNama = (id) => vendors.find((v) => v.id === id)?.nama || "-";

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await procurementApi.createPO(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
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

  const handleReject = async (po) => {
    const catatan = prompt(`Alasan menolak PO ${po.nomorPO}?`) || "";
    setBusyId(po.id);
    try {
      await procurementApi.rejectPO(po.id, catatan);
      await load();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Procurement — Purchase Order</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pos.length} PO tercatat</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            disabled={vendors.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            title={vendors.length === 0 ? "Tambah vendor dulu" : ""}
          >
            <Plus size={16} /> Buat PO
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : pos.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada PO.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">NOMOR PO</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TANGGAL</th>
                  <th className="pb-2 font-medium min-w-[140px]">VENDOR</th>
                  <th className="pb-2 font-medium whitespace-nowrap">TOTAL</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
                  <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 align-top">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800 whitespace-nowrap">{po.nomorPO}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(po.tanggal)}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{vendorNama(po.vendorId)}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatRupiah(po.total)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[po.status]}`}>
                        {po.status}
                      </span>
                      {po.status === "Ditolak" && po.catatanApproval && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[160px]">{po.catatanApproval}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canEdit && po.status === "Draft" && (
                          <button
                            onClick={() => runAction(po.id, procurementApi.submitPO)}
                            disabled={busyId === po.id}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline disabled:opacity-50"
                          >
                            <Send size={13} /> Submit
                          </button>
                        )}
                        {canApprove && po.status === "Menunggu Approval" && (
                          <>
                            <button
                              onClick={() => runAction(po.id, procurementApi.approvePO)}
                              disabled={busyId === po.id}
                              className="flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(po)}
                              disabled={busyId === po.id}
                              className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {canEdit && po.status === "Disetujui" && (
                          <button
                            onClick={() => runAction(po.id, procurementApi.receivePO)}
                            disabled={busyId === po.id}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                          >
                            <PackageCheck size={13} /> Terima Barang
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <PoModal vendors={vendors} items={items} saving={saving} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
