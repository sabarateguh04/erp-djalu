const COLOR_MAP = {
  green: "bg-green-50 border-green-200 text-green-600",
  orange: "bg-orange-50 border-orange-200 text-orange-600",
  red: "bg-red-50 border-red-200 text-red-600",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
};

export default function ExecutiveSummary({ boxes }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-xs font-semibold tracking-wider text-gray-400 mb-4">EXECUTIVE SUMMARY</h3>
      <div className="grid grid-cols-2 gap-3">
        {boxes.map((box) => (
          <div key={box.key} className={`rounded-lg border p-3 ${COLOR_MAP[box.color]}`}>
            <p className="text-2xl font-bold leading-tight">{box.value}</p>
            <p className="text-sm font-medium mt-1">{box.label}</p>
            <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              {box.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
