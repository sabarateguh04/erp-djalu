import { Sparkles, ArrowRight } from "lucide-react";

const TONE_COLOR = {
  positive: "text-green-600",
  warning: "text-orange-600",
  info: "text-blue-600",
};

export default function AIRecommendationPanel({ items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-brand-600" />
        AI RECOMMENDATION
      </h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2 text-sm">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TONE_COLOR[item.tone] || "text-gray-400"} bg-current`} />
            <span className={TONE_COLOR[item.tone] || "text-gray-600"}>{item.text}</span>
          </li>
        ))}
      </ul>
      <button className="mt-4 text-sm text-brand-600 font-medium flex items-center gap-1 hover:underline">
        Lihat semua insight AI <ArrowRight size={14} />
      </button>
    </div>
  );
}
