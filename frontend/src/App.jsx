import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardProgress from "./pages/DashboardProgress.jsx";
import ManagementPage from "./pages/ManagementPage.jsx";
import UsersManagementPage from "./pages/UsersManagementPage.jsx";
import RolesManagementPage from "./pages/RolesManagementPage.jsx";
import Profile from "./pages/Profile.jsx";
import ItemsPage from "./pages/inventory/ItemsPage.jsx";
import MovementsPage from "./pages/inventory/MovementsPage.jsx";
import VendorsPage from "./pages/procurement/VendorsPage.jsx";
import PurchaseOrdersPage from "./pages/procurement/PurchaseOrdersPage.jsx";
import CustomersPage from "./pages/crm/CustomersPage.jsx";
import PipelinePage from "./pages/crm/PipelinePage.jsx";
import AttendancePage from "./pages/hr/AttendancePage.jsx";
import PayrollPage from "./pages/hr/PayrollPage.jsx";
import SystemLogPage from "./pages/SystemLogPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import CabangManagementPage from "./pages/CabangManagementPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Forbidden from "./pages/Forbidden.jsx";

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/403"
        element={
          <ProtectedRoute>
            <Layout>
              <Forbidden />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute permission="dashboard">
            <Layout>
              <DashboardProgress />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/management/users"
        element={
          <ProtectedRoute permission="users:manage">
            <Layout>
              <UsersManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/roles"
        element={
          <ProtectedRoute permission="users:manage">
            <Layout>
              <RolesManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/items"
        element={
          <ProtectedRoute permission="inventory:view">
            <Layout>
              <ItemsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/movements"
        element={
          <ProtectedRoute permission="inventory:view">
            <Layout>
              <MovementsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/procurement/vendors"
        element={
          <ProtectedRoute permission="procurement:view">
            <Layout>
              <VendorsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/procurement/purchase-orders"
        element={
          <ProtectedRoute permission="procurement:view">
            <Layout>
              <PurchaseOrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/crm/customers"
        element={
          <ProtectedRoute permission="crm:view">
            <Layout>
              <CustomersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm/pipeline"
        element={
          <ProtectedRoute permission="crm:view">
            <Layout>
              <PipelinePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/attendance"
        element={
          <ProtectedRoute permission="hr:view">
            <Layout>
              <AttendancePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/payroll"
        element={
          <ProtectedRoute permission="hr:view">
            <Layout>
              <PayrollPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/report"
        element={
          <ProtectedRoute permission="report:view">
            <Layout>
              <ReportPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/system-log"
        element={
          <ProtectedRoute permission="system-log:view">
            <Layout>
              <SystemLogPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/management/cabang"
        element={
          <ProtectedRoute permission="cabang:manage">
            <Layout>
              <CabangManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/management/:category"
        element={
          <ProtectedRoute permissionFor={(params) => `${params.category}:view`}>
            <Layout>
              <ManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
