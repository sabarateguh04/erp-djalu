import { Rocket, Calendar } from "lucide-react";

export default function NextReleaseCard({ release }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <Rocket size={15} className="text-brand-600" />
        NEXT RELEASE
      </h3>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-lg font-bold text-gray-900">{release.product}</p>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
          {release.version}
        </span>
      </div>
      <p className="text-sm text-gray-500 flex items-center gap-1.5">
        <Calendar size={13} />
        {release.dateLabel}
      </p>
      <p className="text-xs text-green-600 mt-0.5">{release.daysLeftNote}</p>
      <button className="mt-4 w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
        Lihat detail release
      </button>
    </div>
  );
}
