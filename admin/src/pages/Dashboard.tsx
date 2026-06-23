import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Users, Package, DollarSign } from 'lucide-react';
import { db } from '../lib/firebase';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  quantityLitres: number;
  money: { total: number };
  createdAt: any;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeSuppliers: 0,
    loading: true
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const ordersSnap = await getDocs(query(collection(db, 'orders'), limit(100)));
        const suppliersCountSnap = await getDocs(query(collection(db, 'suppliers')));
        
        let revenue = 0;
        let ordersCount = 0;
        
        ordersSnap.forEach((doc) => {
          ordersCount++;
          const data = doc.data();
          if (data.money?.total) {
            revenue += data.money.total;
          }
        });

        setStats({
          totalOrders: ordersCount, // in real app, use count() query
          totalRevenue: revenue,
          activeSuppliers: suppliersCountSnap.size,
          loading: false
        });

        // Fetch recent orders
        const recentSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)));
        const orders: Order[] = [];
        recentSnap.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        setRecentOrders(orders);
      } catch (error) {
        console.error("Error fetching data:", error);
        setStats(s => ({ ...s, loading: false }));
      }
    }
    fetchData();
  }, []);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  if (stats.loading) {
    return <div className="animate-fade-in"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Overview</h1>
        <button className="btn btn-primary">
          Download Report
        </button>
      </div>

      <div className="stats-grid">
        <div className="glass-panel stat-card delay-1">
          <div className="stat-header">
            <span>Total Revenue</span>
            <DollarSign size={20} className="text-accent" />
          </div>
          <div className="stat-value">{formatNaira(stats.totalRevenue)}</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="glass-panel stat-card delay-2">
          <div className="stat-header">
            <span>Total Orders</span>
            <Package size={20} className="text-accent" />
          </div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} />
            <span>+8.2% from last month</span>
          </div>
        </div>

        <div className="glass-panel stat-card delay-3">
          <div className="stat-header">
            <span>Active Suppliers</span>
            <Users size={20} className="text-accent" />
          </div>
          <div className="stat-value">{stats.activeSuppliers}</div>
          <div className="stat-trend trend-down">
            <TrendingDown size={16} />
            <span>-2 this week</span>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-fade-in delay-3">
        <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>Recent Orders</h2>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500 }}>{order.orderNumber || order.id.slice(0, 8)}</td>
                  <td>{order.quantityLitres?.toLocaleString() || 0} L</td>
                  <td style={{ fontWeight: 500 }}>{formatNaira(order.money?.total || 0)}</td>
                  <td>
                    <span className={`badge badge-${order.status === 'paid' || order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'pending'}`}>
                      {order.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
