import { Box, User, ScanEye, Sparkles, TrafficCone, Boxes, Eye, MessageSquare, MoreVertical, ChevronDown } from "lucide-react";

const ICONS = { box: Box, user: User, scan: ScanEye, sparkle: Sparkles, cone: TrafficCone, cube: Boxes };
const ICON_COLOR = {
  purple: "bg-purple-100 text-purple-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  pink: "bg-pink-100 text-pink-600",
  orange: "bg-orange-100 text-orange-600",
};

const STATUS_STYLE = {
  "On Track": "bg-green-50 text-green-600",
  Warning: "bg-orange-50 text-orange-600",
  Delay: "bg-red-50 text-red-600",
};

const PRIORITY_STYLE = {
  High: "bg-orange-50 text-orange-600",
  Critical: "bg-red-50 text-red-600",
  Medium: "bg-blue-50 text-blue-600",
};

function Badge({ text, styleMap }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styleMap[text] || "bg-gray-100 text-gray-600"}`}>
      {text}
    </span>
  );
}

function Timeline({ stages, stage }) {
  const activeIdx = stages.indexOf(stage);
  return (
    <div className="flex items-center">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-2.5 h-2.5 rounded-full border-2 ${
              i <= activeIdx ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"
            }`}
            title={s}
          />
          {i < stages.length - 1 && (
            <div className={`w-6 h-0.5 ${i < activeIdx ? "bg-orange-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ProductRow({ p }) {
  const Icon = ICONS[p.icon] || Box;
  const isLate = p.daysLeft < 0;

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ICON_COLOR[p.color]}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">{p.name}</p>
            <p className="text-xs text-gray-400">
              {p.tasksDone} dari {p.tasksTotal} task selesai
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 min-w-[140px]">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600">{p.progress}%</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Badge text={p.status} styleMap={STATUS_STYLE} />
        <p className="text-[11px] text-gray-400 mt-1">{p.statusNote}</p>
      </td>
      <td className="py-3 pr-4">
        <Badge text={p.priority} styleMap={PRIORITY_STYLE} />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
            {p.pic.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="text-sm text-gray-700 leading-tight">{p.pic.name}</p>
            <p className="text-[11px] text-gray-400">{p.pic.role}</p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <p className="text-sm text-gray-700">{p.deadlineLabel}</p>
        <p className={`text-[11px] ${isLate ? "text-red-500" : "text-green-600"}`}>{p.daysLeftNote}</p>
      </td>
      <td className="py-3 pr-4">
        <Timeline stages={p.timeline.stages} stage={p.timeline.stage} />
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Eye size={15} className="hover:text-gray-600 cursor-pointer" />
          <MessageSquare size={15} className="hover:text-gray-600 cursor-pointer" />
          <MoreVertical size={15} className="hover:text-gray-600 cursor-pointer" />
        </div>
      </td>
    </tr>
  );
}

export default function ProgressTable({ products }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">PROGRESS PRODUK</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] tracking-wider text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium min-w-[180px]">PRODUK</th>
              <th className="pb-2 font-medium whitespace-nowrap">PROGRESS</th>
              <th className="pb-2 font-medium whitespace-nowrap">STATUS</th>
              <th className="pb-2 font-medium">PRIORITAS</th>
              <th className="pb-2 font-medium">PIC</th>
              <th className="pb-2 font-medium">DEADLINE</th>
              <th className="pb-2 font-medium">TIMELINE</th>
              <th className="pb-2 font-medium">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow key={p.id} p={p} />
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-4 text-sm text-brand-600 font-medium flex items-center gap-1 hover:underline">
        Lihat semua produk <ChevronDown size={14} />
      </button>
    </div>
  );
}
