import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../api/client.js";

export default function Profile() {
  const { user, role, refresh } = useAuth();
  const [nama, setNama] = useState(user?.nama || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }

    setSaving(true);
    try {
      await authApi.updateMe({
        nama,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setSuccess("Profil berhasil diperbarui");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Saya</h2>
        <p className="text-sm text-gray-400 mt-0.5">Kelola nama dan password akun Anda</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-lg font-semibold">
          {user?.avatarInisial}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{user?.username}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
          <p className="text-xs text-brand-600 font-medium mt-0.5">{role?.nama}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500">Nama Lengkap</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        <hr className="my-1 border-gray-100" />
        <p className="text-xs font-medium text-gray-500">Ganti Password (opsional)</p>

        <div>
          <label className="text-xs font-medium text-gray-500">Password Saat Ini</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
