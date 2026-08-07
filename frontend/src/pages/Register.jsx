import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { nama: "", email: "", username: "", password: "", confirmPassword: "" };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
      setError("Semua field wajib diisi");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      setSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const waitingApproval = success.status === "Menunggu Verifikasi";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <h2 className="text-base font-semibold text-gray-800 mb-2">Pendaftaran berhasil</h2>
          <p className="text-sm text-gray-500">
            {waitingApproval
              ? "Akun Anda menunggu persetujuan admin. Anda akan bisa login setelah di-approve."
              : "Akun Anda sudah aktif. Silakan login."}
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700"
          >
            Ke halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Djalu.Co.Id</h1>
          <p className="text-[11px] tracking-wider text-gray-400 mt-0.5">ENTERPRISE SUITE</p>
        </div>

        <h2 className="text-base font-semibold text-gray-800 mb-4">Buat akun baru</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={handleChange("nama")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              autoFocus
            />
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
            <label className="text-xs font-medium text-gray-500">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={handleChange("username")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              placeholder="4-20 karakter, huruf kecil/angka"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Konfirmasi Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
