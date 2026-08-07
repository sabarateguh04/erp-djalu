import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert size={40} className="text-red-400" />
      <h2 className="text-lg font-semibold text-gray-800">403 - Tidak punya akses</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Akun Anda tidak memiliki izin untuk membuka halaman ini. Hubungi admin kalau Anda
        merasa ini seharusnya diizinkan.
      </p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 rounded-lg text-sm bg-brand-600 text-white font-medium hover:bg-brand-700"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
