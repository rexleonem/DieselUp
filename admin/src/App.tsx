import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/suppliers', label: 'Suppliers', icon: <Users size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

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
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<div className="glass-panel animate-fade-in"><h2>Orders Management</h2><p>Coming soon...</p></div>} />
            <Route path="/suppliers" element={<div className="glass-panel animate-fade-in"><h2>Supplier Management</h2><p>Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="glass-panel animate-fade-in"><h2>System Settings</h2><p>Coming soon...</p></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
