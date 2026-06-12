import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import MainLayout from '../layouts/MainLayout';
import CalculatorPage from '../pages/CalculatorPage';
import LoginPage from '../pages/LoginPage';
import AdminLayout from '../pages/admin/AdminLayout';
import CitiesPage from '../pages/admin/CitiesPage';
import DistanceMatrixPage from '../pages/admin/DistanceMatrixPage';
import FuelPage from '../pages/admin/FuelPage';
import HotelsPage from '../pages/admin/HotelsPage';
import ProvisionsPage from '../pages/admin/ProvisionsPage';
import TicketsPage from '../pages/admin/TicketsPage';
import VehiclesPage from '../pages/admin/VehiclesPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdminUser, loading } = useAuth();
  if (loading) return null;
  if (!isAdminUser) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<CalculatorPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/vehicles" replace />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="cities" element={<CitiesPage />} />
          <Route path="distances" element={<DistanceMatrixPage />} />
          <Route path="hotels" element={<HotelsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="provisions" element={<ProvisionsPage />} />
          <Route path="fuel" element={<FuelPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
