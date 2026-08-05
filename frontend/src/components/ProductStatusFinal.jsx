import { Box, Boxes, Calendar, ChevronDown, MoreVertical } from "lucide-react";

const ICONS = { box: Box, cube: Boxes };
const ICON_COLOR = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
};

function FinalCard({ product }) {
  const Icon = ICONS[product.icon] || Box;
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ICON_COLOR[product.color]}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">{product.name}</p>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
              Final
            </span>
          </div>
          <p className="text-xs text-gray-400">{product.version}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Calendar size={11} /> {product.note}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden md:flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={12} /> {product.releaseDateLabel}
        </span>
        <button className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">
          Lihat Detail
        </button>
        <MoreVertical size={15} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function ProductStatusFinal({ products }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">PRODUK STATUS FINAL</h3>
      <div className="flex flex-col md:flex-row gap-4">
        {products.map((p) => (
          <FinalCard key={p.id} product={p} />
        ))}
      </div>
      <button className="mt-4 text-sm text-brand-600 font-medium flex items-center gap-1 hover:underline">
        Lihat semua produk final <ChevronDown size={14} />
      </button>
    </div>
  );
}
