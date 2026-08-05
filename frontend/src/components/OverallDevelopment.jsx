import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function OverallDevelopment({ value, label }) {
  const data = [{ name: "progress", value, fill: "#f97316" }];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">OVERALL DEVELOPMENT</h3>
      <div className="flex-1 flex items-center justify-center relative">
        <RadialBarChart
          width={180}
          height={180}
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={20} clockWise />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{value}%</span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
