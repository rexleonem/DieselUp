import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';

function Sidebar() {
  const location = useLocation();
  const { logout, profile } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/suppliers', label: 'Suppliers', icon: <Users size={20} /> },
  ];

  if (profile?.role === 'super_admin') {
    navItems.push({ path: '/settings', label: 'Settings', icon: <SettingsIcon size={20} /> });
  }

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        DieselUp Admin
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ padding: '0 16px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Logged in as <strong>{profile?.displayName || 'Admin'}</strong>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            Role: {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="login-container">Loading...</div>;
  if (!user || profile?.role !== 'super_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><AdminLayout><Suppliers /></AdminLayout></ProtectedRoute>} />
          <Route path="/settings" element={<SuperAdminRoute><AdminLayout><Settings /></AdminLayout></SuperAdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
