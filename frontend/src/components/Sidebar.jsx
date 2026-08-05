import {
  LayoutDashboard,
  Users,
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
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

function NavItem({ icon: Icon, label, active, indent, expandable, expanded, onClick, activeSub }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        indent ? "pl-9" : ""
      } ${
        active
          ? "bg-orange-50 text-brand-600 border-l-2 border-orange-400 font-medium"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="flex items-center gap-3">
        {Icon && <Icon size={18} className={active ? "text-brand-600" : "text-gray-400"} />}
        {label}
      </span>
      {expandable && (
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}

function NavGroup({ title, children }) {
  return (
    <div className="mt-5">
      <p className="px-3 mb-1 text-[11px] font-semibold tracking-wider text-gray-400">{title}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export default function Sidebar() {
  const [produkOpen, setProdukOpen] = useState(true);

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 leading-tight">Djalu.Co.Id</h1>
        <p className="text-[11px] tracking-wider text-gray-400 mt-0.5">ENTERPRISE SUITE</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavItem icon={LayoutDashboard} label="Dashboard" active />

        <NavGroup title="MANAGEMENT">
          <NavItem icon={UserCog} label="Karyawan" />
          <NavItem icon={Boxes} label="Aset" />
          <NavItem
            icon={Package}
            label="Produk"
            expandable
            expanded={produkOpen}
            onClick={() => setProdukOpen((v) => !v)}
          />
          {produkOpen && (
            <>
              <NavItem label="Final" indent />
              <NavItem label="Progress" indent active />
            </>
          )}
          <NavItem icon={Settings2} label="Operasional" />
          <NavItem icon={FolderKanban} label="Project" />
          <NavItem icon={Landmark} label="Finance" />
          <NavItem icon={ShoppingCart} label="Sales" />
        </NavGroup>

        <NavGroup title="HUMAN CAPITAL">
          <NavItem icon={Users} label="Human Capital" />
        </NavGroup>

        <NavGroup title="AI & INNOVATION">
          <NavItem icon={Sparkles} label="AI Center" />
          <NavItem icon={BookOpen} label="Knowledge Base" />
        </NavGroup>

        <NavGroup title="SETTINGS">
          <NavItem icon={Settings} label="Settings" />
          <NavItem icon={FileText} label="System Log" />
        </NavGroup>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
          RA
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">Raka A.</p>
          <p className="text-xs text-gray-400 truncate">Direktur Operasional</p>
        </div>
        <MoreVertical size={16} className="text-gray-400" />
      </div>
    </aside>
  );
}
