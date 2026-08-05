import { Search, Bell, ChevronDown } from "lucide-react";

export default function Topbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <nav className="text-sm text-gray-400 flex items-center gap-1.5">
        <span>Dashboard</span>
        <span>›</span>
        <span>Produk</span>
        <span>›</span>
        <span className="text-gray-600">Development Progress</span>
      </nav>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk, project, atau modul..."
            className="pl-9 pr-4 py-2 w-72 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
            7
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-600">
            RA
          </div>
          <div className="text-sm leading-tight">
            <p className="font-medium text-gray-800">Raka A.</p>
            <p className="text-xs text-gray-400">Direktur Operasional</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}
