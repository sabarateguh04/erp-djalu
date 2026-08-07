import {
  LayoutDashboard,
  Package,
  Boxes,
  Settings2,
  FolderKanban,
  Landmark,
  ShoppingCart,
  UserCog,
  Sparkles,
  BookOpen,
  Settings,
  FileText,
  ShieldCheck,
  Warehouse,
  ArrowLeftRight,
  Truck,
  ClipboardList,
  Contact,
  GitBranch,
  CalendarCheck,
  Wallet,
  Building2,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { inventoryApi } from "../api/client.js";

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
      {count}
    </span>
  );
}

function NavItem({ icon: Icon, label, to, active, indent, expandable, expanded, onClick, badge }) {
  const className = `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
    indent ? "pl-9" : ""
  } ${
    active
      ? "bg-orange-50 text-brand-600 border-l-2 border-orange-400 font-medium"
      : "text-gray-600 hover:bg-gray-100"
  }`;

  const content = (
    <>
      <span className="flex items-center gap-3">
        {Icon && <Icon size={18} className={active ? "text-brand-600" : "text-gray-400"} />}
        {label}
      </span>
      <NavBadge count={badge} />
      {expandable && (
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function NavGroup({ title, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(items) && items.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="px-3 mb-1 text-[11px] font-semibold tracking-wider text-gray-400">{title}</p>
      <div className="flex flex-col gap-0.5">{items}</div>
    </div>
  );
}

export default function Sidebar() {
  const [produkOpen, setProdukOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user, role, hasPermission, logout } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  const isManagement = (cat) => path === `/management/${cat}`;

  useEffect(() => {
    if (!hasPermission("inventory:view")) return;
    inventoryApi
      .listItems()
      .then((items) => setLowStockCount(items.filter((i) => i.stokSaatIni <= i.stokMinimum).length))
      .catch(() => setLowStockCount(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Djalu.Co.Id</h1>
          <p className="text-[11px] tracking-wider text-gray-400 mt-0.5">ENTERPRISE SUITE</p>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {hasPermission("dashboard") && (
          <NavItem icon={LayoutDashboard} label="Dashboard" to="/" active={path === "/"} />
        )}

        <NavGroup title="MANAGEMENT">
          {hasPermission("karyawan:view") && (
            <NavItem icon={UserCog} label="Karyawan" to="/management/karyawan" active={isManagement("karyawan")} />
          )}
          {hasPermission("aset:view") && (
            <NavItem icon={Boxes} label="Aset" to="/management/aset" active={isManagement("aset")} />
          )}
          {hasPermission("dashboard") && (
            <NavItem
              icon={Package}
              label="Produk"
              expandable
              expanded={produkOpen}
              onClick={() => setProdukOpen((v) => !v)}
            />
          )}
          {hasPermission("dashboard") && produkOpen && (
            <>
              <NavItem label="Final" to="/" indent />
              <NavItem label="Progress" to="/" indent active={path === "/"} />
            </>
          )}
          {hasPermission("operasional:view") && (
            <NavItem icon={Settings2} label="Operasional" to="/management/operasional" active={isManagement("operasional")} />
          )}
          {hasPermission("project:view") && (
            <NavItem icon={FolderKanban} label="Project" to="/management/project" active={isManagement("project")} />
          )}
          {hasPermission("finance:view") && (
            <NavItem icon={Landmark} label="Finance" to="/management/finance" active={isManagement("finance")} />
          )}
          {hasPermission("sales:view") && (
            <NavItem icon={ShoppingCart} label="Sales" to="/management/sales" active={isManagement("sales")} />
          )}
        </NavGroup>

        <NavGroup title="INVENTORY">
          {hasPermission("inventory:view") && (
            <NavItem
              icon={Warehouse}
              label="Item"
              to="/inventory/items"
              active={path === "/inventory/items"}
              badge={lowStockCount}
            />
          )}
          {hasPermission("inventory:view") && (
            <NavItem
              icon={ArrowLeftRight}
              label="Barang Masuk/Keluar"
              to="/inventory/movements"
              active={path === "/inventory/movements"}
            />
          )}
        </NavGroup>

        <NavGroup title="PROCUREMENT">
          {hasPermission("procurement:view") && (
            <NavItem icon={Truck} label="Vendor" to="/procurement/vendors" active={path === "/procurement/vendors"} />
          )}
          {hasPermission("procurement:view") && (
            <NavItem
              icon={ClipboardList}
              label="Purchase Order"
              to="/procurement/purchase-orders"
              active={path === "/procurement/purchase-orders"}
            />
          )}
        </NavGroup>

        <NavGroup title="CRM">
          {hasPermission("crm:view") && (
            <NavItem icon={Contact} label="Customer" to="/crm/customers" active={path === "/crm/customers"} />
          )}
          {hasPermission("crm:view") && (
            <NavItem icon={GitBranch} label="Pipeline" to="/crm/pipeline" active={path === "/crm/pipeline"} />
          )}
        </NavGroup>

        <NavGroup title="HUMAN CAPITAL">
          {hasPermission("hr:view") && (
            <NavItem icon={CalendarCheck} label="Absensi" to="/hr/attendance" active={path === "/hr/attendance"} />
          )}
          {hasPermission("hr:view") && (
            <NavItem icon={Wallet} label="Payroll" to="/hr/payroll" active={path === "/hr/payroll"} />
          )}
        </NavGroup>

        <NavGroup title="AI & INNOVATION">
          {hasPermission("dashboard") && <NavItem icon={Sparkles} label="AI Center" />}
          {hasPermission("dashboard") && <NavItem icon={BookOpen} label="Knowledge Base" />}
        </NavGroup>

        <NavGroup title="ADMINISTRASI">
          {hasPermission("users:manage") && (
            <NavItem
              icon={ShieldCheck}
              label="Kelola User"
              to="/management/users"
              active={path === "/management/users"}
            />
          )}
          {hasPermission("users:manage") && (
            <NavItem
              icon={Settings}
              label="Kelola Role"
              to="/management/roles"
              active={path === "/management/roles"}
            />
          )}
          {hasPermission("cabang:manage") && (
            <NavItem
              icon={Building2}
              label="Kelola Cabang"
              to="/management/cabang"
              active={path === "/management/cabang"}
            />
          )}
          {hasPermission("report:view") && (
            <NavItem icon={FileText} label="Report & Export" to="/report" active={path === "/report"} />
          )}
          {hasPermission("system-log:view") && (
            <NavItem icon={FileText} label="System Log" to="/system-log" active={path === "/system-log"} />
          )}
        </NavGroup>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.avatarInisial || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.nama || "-"}</p>
            <p className="text-xs text-gray-400 truncate">{role?.nama || "-"}</p>
          </div>
        </Link>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
