import { useEffect, useState } from "react";
import { Search, Bell, ChevronDown, LogOut, UserCircle, AlertTriangle, Clock, Info } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { managementConfig } from "../config/managementConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCabangFilter } from "../context/CabangFilterContext.jsx";
import { api } from "../api/client.js";

// Rute yang tidak mengikuti pola /management/:category dipetakan manual di
// sini; ditambah tiap kali ada modul/halaman baru.
const ROUTE_BREADCRUMBS = {
  "/management/users": ["Dashboard", "Administrasi", "Kelola User"],
  "/management/roles": ["Dashboard", "Administrasi", "Kelola Role"],
  "/management/cabang": ["Dashboard", "Administrasi", "Kelola Cabang"],
  "/profile": ["Dashboard", "Profile Saya"],
  "/inventory/items": ["Dashboard", "Inventory", "Item"],
  "/inventory/movements": ["Dashboard", "Inventory", "Barang Masuk/Keluar"],
  "/procurement/vendors": ["Dashboard", "Procurement", "Vendor"],
  "/procurement/purchase-orders": ["Dashboard", "Procurement", "Purchase Order"],
  "/crm/customers": ["Dashboard", "CRM", "Customer"],
  "/crm/pipeline": ["Dashboard", "CRM", "Pipeline"],
  "/hr/attendance": ["Dashboard", "Human Capital", "Absensi"],
  "/hr/payroll": ["Dashboard", "Human Capital", "Payroll"],
  "/system-log": ["Dashboard", "System Log"],
  "/report": ["Dashboard", "Report & Export"],
};

function useBreadcrumb() {
  const { pathname } = useLocation();
  if (ROUTE_BREADCRUMBS[pathname]) return ROUTE_BREADCRUMBS[pathname];
  if (pathname.startsWith("/management/")) {
    const category = pathname.split("/")[2];
    const config = managementConfig[category];
    if (config) return config.breadcrumb;
  }
  return ["Dashboard", "Produk", "Development Progress"];
}

const TIPE_ICON = { info: Info, warning: AlertTriangle, "approval-request": Clock };
const TIPE_COLOR = { info: "text-blue-500", warning: "text-red-500", "approval-request": "text-orange-500" };

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function Topbar() {
  const crumbs = useBreadcrumb();
  const { user, role, logout, isAuthenticated } = useAuth();
  const { cabangList, selectedCabangId, setSelectedCabangId } = useCabangFilter();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    if (!isAuthenticated) return;
    api
      .getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((n) => !n.sudahDibaca).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotifClick = async (n) => {
    if (!n.sudahDibaca) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, sudahDibaca: true } : x)));
      } catch {
        // best-effort
      }
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <nav className="text-sm text-gray-400 flex items-center gap-1.5">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            {i === crumbs.length - 1 ? <span className="text-gray-600">{c}</span> : <span>{c}</span>}
            {i < crumbs.length - 1 && <span>›</span>}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {cabangList.length > 0 && (
          <select
            value={selectedCabangId}
            onChange={(e) => setSelectedCabangId(e.target.value)}
            title="Filter berdasarkan cabang"
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          >
            <option value="">Semua Cabang</option>
            {cabangList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk, project, atau modul..."
            className="pl-9 pr-4 py-2 w-72 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              if (!notifOpen) loadNotifications();
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200"
          >
            <Bell size={16} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Notifikasi</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 px-3 py-4 text-center">Tidak ada notifikasi.</p>
                ) : (
                  notifications.slice(0, 10).map((n) => {
                    const Icon = TIPE_ICON[n.tipe] || Info;
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                          !n.sudahDibaca ? "bg-orange-50/40" : ""
                        }`}
                      >
                        <Icon size={15} className={`mt-0.5 shrink-0 ${TIPE_COLOR[n.tipe] || "text-gray-400"}`} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-gray-700">{n.text}</span>
                          {n.createdAt && <span className="block text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</span>}
                        </span>
                        {!n.sudahDibaca && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-600">
              {user?.avatarInisial || "?"}
            </div>
            <div className="text-sm leading-tight text-left">
              <p className="font-medium text-gray-800">{user?.nama || "-"}</p>
              <p className="text-xs text-gray-400">{role?.nama || "-"}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <UserCircle size={15} /> Profile Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
