import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import ExecutiveSummary from "../components/ExecutiveSummary.jsx";
import TrendChart from "../components/TrendChart.jsx";
import OverallDevelopment from "../components/OverallDevelopment.jsx";
import ProgressTable from "../components/ProgressTable.jsx";
import AIRecommendationPanel from "../components/AIRecommendationPanel.jsx";
import NextReleaseCard from "../components/NextReleaseCard.jsx";
import NotificationList from "../components/NotificationList.jsx";
import ProductStatusFinal from "../components/ProductStatusFinal.jsx";

export default function DashboardProgress() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, products, trend, notifications, aiRecommendations, nextRelease, finalProducts] =
        await Promise.all([
          api.getSummary(),
          api.getProducts(),
          api.getTrend(),
          api.getNotifications(),
          api.getAIRecommendations(),
          api.getNextRelease(),
          api.getFinalProducts(),
        ]);
      setData({ summary, products, trend, notifications, aiRecommendations, nextRelease, finalProducts });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-400">Memuat dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-500">
        Gagal memuat data{error ? `: ${error}` : ""}. Pastikan backend berjalan di port 4000.
      </div>
    );
  }

  const { summary, products, trend, notifications, aiRecommendations, nextRelease, finalProducts } = data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progres development produk</h2>
          <button
            onClick={load}
            className="text-sm text-gray-400 flex items-center gap-1.5 mt-1 hover:text-gray-600"
          >
            <RefreshCw size={13} />
            {summary.updatedLabel}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-sm text-gray-500">Enterprise Health</span>
          <span className="text-sm font-bold text-gray-900">{summary.enterpriseHealth.value}%</span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            {summary.enterpriseHealth.label} <TrendingUp size={12} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summary.stats.map((s) => (
          <StatCard key={s.key} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <ExecutiveSummary boxes={summary.summaryBoxes} />
        <div className="lg:col-span-1">
          <TrendChart data={trend} />
        </div>
        <OverallDevelopment {...summary.overallDevelopment} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <ProgressTable products={products} />
        </div>
        <div className="flex flex-col gap-5">
          <AIRecommendationPanel items={aiRecommendations} />
          <NextReleaseCard release={nextRelease} />
          <NotificationList items={notifications} />
        </div>
      </div>

      <ProductStatusFinal products={finalProducts} />
    </div>
  );
}
