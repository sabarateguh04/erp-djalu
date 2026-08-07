import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Lock } from "lucide-react";
import { rolesApi } from "../api/client.js";

const PERMISSION_GROUPS = [
  { label: "Dashboard", codes: ["dashboard"] },
  { label: "Karyawan", codes: ["karyawan:view", "karyawan:edit"] },
  { label: "Aset", codes: ["aset:view", "aset:edit"] },
  { label: "Project", codes: ["project:view", "project:edit"] },
  { label: "Finance", codes: ["finance:view", "finance:edit"] },
  { label: "Sales", codes: ["sales:view", "sales:edit"] },
  { label: "Operasional", codes: ["operasional:view", "operasional:edit"] },
  { label: "Inventory", codes: ["inventory:view", "inventory:edit"] },
  { label: "Procurement", codes: ["procurement:view", "procurement:edit", "procurement:approve"] },
  { label: "CRM", codes: ["crm:view", "crm:edit"] },
  { label: "HR", codes: ["hr:view", "hr:edit"] },
  { label: "Report", codes: ["report:view"] },
  { label: "System Log", codes: ["system-log:view"] },
  { label: "Kelola User & Role", codes: ["users:manage"] },
  { label: "Kelola Cabang", codes: ["cabang:manage"] },
];

function RoleModal({ initial, onClose, onSubmit, saving }) {
  const [nama, setNama] = useState(initial?.nama || "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi || "");
  const [permissions, setPermissions] = useState(initial?.permissions || []);
  const [error, setError] = useState("");
  const isSuperAdmin = initial?.isSystemRole && initial.permissions.includes("*");

  const toggle = (code) => {
    setPermissions((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError("Nama role wajib diisi");
      return;
    }
    setError("");
    onSubmit({ nama, deskripsi, permissions });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">{initial ? "Edit Role" : "Tambah Role"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nama Role</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Deskripsi</label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Permissions</label>
            {isSuperAdmin ? (
              <p className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Lock size={12} /> Super Admin selalu punya akses penuh ke semua modul (*)
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {PERMISSION_GROUPS.map((g) => (
                  <div key={g.label} className="px-3 py-2 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-gray-700">{g.label}</span>
                    <div className="flex items-center gap-3">
                      {g.codes.map((code) => (
                        <label key={code} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={permissions.includes(code)}
                            onChange={() => toggle(code)}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-300"
                          />
                          {code.includes(":") ? code.split(":")[1] : "akses"}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default function RolesManagementPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRoles(await rolesApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await rolesApi.update(editing.id, form);
      } else {
        await rolesApi.create(form);
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

  const handleDelete = async (role) => {
    if (!confirm(`Hapus role "${role.nama}"?`)) return;
    try {
      await rolesApi.remove(role.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Role</h2>
          <p className="text-sm text-gray-400 mt-0.5">{roles.length} role tersedia</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> Tambah Role
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Gagal memuat data: {error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium min-w-[160px]">NAMA ROLE</th>
                  <th className="pb-2 font-medium min-w-[220px]">DESKRIPSI</th>
                  <th className="pb-2 font-medium whitespace-nowrap">PERMISSIONS</th>
                  <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{r.nama}</span>
                        {r.isSystemRole && <Lock size={12} className="text-gray-400" />}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{r.deskripsi || "-"}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">
                      {r.permissions.includes("*") ? "Akses penuh (*)" : `${r.permissions.length} permission`}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3 text-gray-400">
                        <button onClick={() => openEdit(r)} className="hover:text-brand-600" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={r.isSystemRole}
                          className="hover:text-red-500 disabled:opacity-30"
                          title={r.isSystemRole ? "Role sistem tidak bisa dihapus" : "Hapus"}
                        >
                          <Trash2 size={15} />
                        </button>
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
        <RoleModal
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
