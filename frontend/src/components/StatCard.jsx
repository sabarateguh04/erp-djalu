import { Box, Folder, Users, TrendingUp, Rocket } from "lucide-react";

const ICONS = { box: Box, folder: Folder, users: Users, trending: TrendingUp, rocket: Rocket };

const COLOR_MAP = {
  purple: "bg-purple-100 text-purple-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

export default function StatCard({ icon, value, label, sub, color }) {
  const Icon = ICONS[icon] || Box;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${COLOR_MAP[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
    </div>
  );
}
