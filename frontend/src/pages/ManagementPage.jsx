import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { managementApi } from "../api/client.js";
import { managementConfig } from "../config/managementConfig.js";
import CrudModal from "../components/CrudModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCabangFilter } from "../context/CabangFilterContext.jsx";

const BADGE_COLOR = {
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

function formatRupiah(v) {
  if (v === null || v === undefined || v === "") return "-";
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ManagementPage() {
  const { category } = useParams();
  const config = managementConfig[category];
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(`${category}:edit`);
  const { selectedCabangId, filterByCabang } = useCabangFilter();
  const supportsCabang = config?.extraFields?.some((f) => f.key === "cabangId");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await managementApi.list(category);
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setSearch("");
  }, [category]);

  if (!config) {
    return <div className="text-sm text-red-500">Kategori tidak dikenal.</div>;
  }

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await managementApi.update(category, editing.id, form);
      } else {
        await managementApi.create(category, form);
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

  const handleDelete = async (id) => {
    if (!confirm(`Hapus data ${config.singular.toLowerCase()} ini?`)) return;
    setDeletingId(id);
    try {
      await managementApi.remove(category, id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const cabangFiltered = supportsCabang ? filterByCabang(records) : records;
  const filtered = cabangFiltered.filter((r) =>
    `${r.nama} ${r.tipe} ${r.status} ${r.catatan}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {records.length} data {config.singular.toLowerCase()} tersimpan · disimpan per tanggal
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Tambah {config.singular}
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
            placeholder={`Cari ${config.singular.toLowerCase()}...`}
            className="pl-9 pr-3 py-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data. Klik "Tambah {config.singular}" untuk mulai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium whitespace-nowrap">TANGGAL</th>
                  <th className="pb-2 font-medium min-w-[200px]">{config.namaLabel.toUpperCase()}</th>
                  <th className="pb-2 font-medium whitespace-nowrap">{config.tipeLabel.toUpperCase()}</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
                  {config.showNilai && <th className="pb-2 font-medium whitespace-nowrap">NILAI</th>}
                  <th className="pb-2 font-medium">CATATAN</th>
                  {canEdit && <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4 whitespace-nowrap text-sm text-gray-600">{formatDate(r.tanggal)}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{r.nama}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{r.tipe}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          BADGE_COLOR[config.statusColors[r.status]] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    {config.showNilai && (
                      <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">{formatRupiah(r.nilai)}</td>
                    )}
                    <td className="py-3 pr-4 text-sm text-gray-500 max-w-xs truncate" title={r.catatan}>
                      {r.catatan || "-"}
                    </td>
                    {canEdit && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <button onClick={() => openEdit(r)} className="hover:text-brand-600" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="hover:text-red-500 disabled:opacity-50"
                            title="Hapus"
                          >
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
        <CrudModal
          config={config}
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
