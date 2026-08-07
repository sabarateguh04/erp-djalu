import { useEffect, useState } from "react";
import { Plus, Trash2, X, CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { usersApi, rolesApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_BADGE = {
  Aktif: "bg-green-50 text-green-600",
  Nonaktif: "bg-red-50 text-red-600",
  "Menunggu Verifikasi": "bg-orange-50 text-orange-600",
};

function formatDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function UserModal({ roles, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    username: "",
    password: "",
    roleId: roles[0]?.id || "",
    status: "Aktif",
  });
  const [error, setError] = useState("");

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim() || !form.username.trim() || !form.password || !form.roleId) {
      setError("Semua field wajib diisi");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Tambah User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={handleChange("nama")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs font-medium text-gray-500">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange("username")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Password Awal</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Role</label>
              <select
                value={form.roleId}
                onChange={handleChange("roleId")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                value={form.status}
                onChange={handleChange("status")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              </select>
            </div>
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

export default function UsersManagementPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [u, r] = await Promise.all([usersApi.list(), rolesApi.list()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await usersApi.create(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (u, status) => {
    setBusyId(u.id);
    try {
      await usersApi.update(u.id, { status });
      await load();
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const updateRole = async (u, roleId) => {
    setBusyId(u.id);
    try {
      await usersApi.update(u.id, { roleId });
      await load();
    } catch (err) {
      alert(`Gagal mengubah role: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Hapus user "${u.nama}"?`)) return;
    setBusyId(u.id);
    try {
      await usersApi.remove(u.id);
      await load();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola User</h2>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} user terdaftar</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> Tambah User
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
                  <th className="pb-2 font-medium min-w-[180px]">USER</th>
                  <th className="pb-2 font-medium whitespace-nowrap">ROLE</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
                  <th className="pb-2 font-medium whitespace-nowrap">LOGIN TERAKHIR</th>
                  <th className="pb-2 font-medium whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-gray-800">{u.nama}</p>
                      <p className="text-xs text-gray-400">
                        {u.username} · {u.email}
                      </p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <select
                        value={u.roleId}
                        onChange={(e) => updateRole(u, e.target.value)}
                        disabled={busyId === u.id || u.id === me?.id}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nama}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          STATUS_BADGE[u.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(u.lastLoginAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        {u.status === "Menunggu Verifikasi" && (
                          <button
                            onClick={() => updateStatus(u, "Aktif")}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}
                        {u.status === "Aktif" && (
                          <button
                            onClick={() => updateStatus(u, "Nonaktif")}
                            disabled={busyId === u.id || u.id === me?.id}
                            className="flex items-center gap-1 text-xs text-orange-600 hover:underline disabled:opacity-50"
                            title="Nonaktifkan"
                          >
                            <Ban size={14} /> Nonaktifkan
                          </button>
                        )}
                        {u.status === "Nonaktif" && (
                          <button
                            onClick={() => updateStatus(u, "Aktif")}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50"
                            title="Aktifkan"
                          >
                            <RotateCcw size={14} /> Aktifkan
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id || u.id === me?.id}
                          className="hover:text-red-500 disabled:opacity-30"
                          title="Hapus"
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

      {modalOpen && <UserModal roles={roles} onClose={() => setModalOpen(false)} onSubmit={handleCreate} saving={saving} />}
    </div>
  );
}
