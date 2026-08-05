import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import DashboardProgress from "./pages/DashboardProgress.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">
          <DashboardProgress />
        </main>
      </div>
    </div>
  );
}
