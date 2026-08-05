import { AlertTriangle, Clock, Rocket, Flag } from "lucide-react";

const ICONS = { alert: AlertTriangle, clock: Clock, rocket: Rocket, flag: Flag };
const COLOR_MAP = {
  red: "text-red-500",
  orange: "text-orange-500",
  blue: "text-blue-500",
  pink: "text-pink-500",
};

export default function NotificationList({ items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">NOTIFIKASI</h3>
        <button className="text-xs text-brand-600 font-medium hover:underline">Lihat semua</button>
      </div>
      <ul className="space-y-3">
        {items.map((n) => {
          const Icon = ICONS[n.icon] || Flag;
          return (
            <li key={n.id} className="flex items-center gap-2.5 text-sm text-gray-600">
              <Icon size={15} className={COLOR_MAP[n.color]} />
              {n.text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
