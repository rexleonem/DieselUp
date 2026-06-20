import { useAuth } from '@/providers/AuthProvider';
import { CustomerDashboard } from '@/features/dashboard/CustomerDashboard';
import { SupplierDashboard } from '@/features/dashboard/SupplierDashboard';
import { DriverDashboard } from '@/features/dashboard/DriverDashboard';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';

export default function DashboardScreen() {
  const { profile } = useAuth();
  if (profile?.role === 'supplier') return <SupplierDashboard />;
  if (profile?.role === 'driver') return <DriverDashboard />;
  if (profile?.role === 'admin' || profile?.role === 'super_admin') return <AdminDashboard />;
  return <CustomerDashboard />;
}
