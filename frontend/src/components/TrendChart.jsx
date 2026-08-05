import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ data }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        TREND PROGRESS <span className="text-xs font-normal text-gray-400">(6 BULAN TERAKHIR)</span>
      </h3>
      <div className="h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="bulan" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <Tooltip formatter={(v) => [`${v}%`, "Progress"]} />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
