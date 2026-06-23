import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  quantityLitres: number;
  customerId: string;
  supplierId: string;
  driverId?: string;
  money: { total: number };
  createdAt: any;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const data: Order[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    } finally {
      setUpdating(null);
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
      case 'arrived':
        return <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: '4px'}}/> {status.replace('_', ' ')}</span>;
      case 'cancelled':
      case 'refunded':
        return <span className="badge badge-danger"><XCircle size={12} style={{marginRight: '4px'}}/> {status.replace('_', ' ')}</span>;
      default:
        return <span className="badge badge-pending"><Clock size={12} style={{marginRight: '4px'}}/> {status.replace('_', ' ')}</span>;
    }
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Orders Management</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Search size={20} className="text-secondary" style={{ marginRight: '8px' }} />
          <input type="text" placeholder="Search orders by ID..." style={{ flex: 1, border: 'none', background: 'transparent' }} />
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={20} className="text-secondary" />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all" style={{color: 'black'}}>All Statuses</option>
            <option value="pending" style={{color: 'black'}}>Pending</option>
            <option value="paid" style={{color: 'black'}}>Paid</option>
            <option value="cancelled" style={{color: 'black'}}>Cancelled</option>
            <option value="refunded" style={{color: 'black'}}>Refunded</option>
          </select>
        </div>
      </div>

      <div className="glass-panel">
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer ID</th>
                  <th>Volume</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>{order.orderNumber || order.id.slice(0, 8)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{order.customerId.slice(0, 8)}</td>
                    <td>{order.quantityLitres.toLocaleString()} L</td>
                    <td style={{ fontWeight: 500 }}>{formatNaira(order.money?.total || 0)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updating === order.id}
                          style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        >
                          <option value="pending" style={{color: 'black'}}>Pending</option>
                          <option value="payment_pending" style={{color: 'black'}}>Payment Pending</option>
                          <option value="paid" style={{color: 'black'}}>Paid</option>
                          <option value="supplier_assigned" style={{color: 'black'}}>Supplier Assigned</option>
                          <option value="driver_assigned" style={{color: 'black'}}>Driver Assigned</option>
                          <option value="en_route" style={{color: 'black'}}>En Route</option>
                          <option value="arrived" style={{color: 'black'}}>Arrived</option>
                          <option value="delivered" style={{color: 'black'}}>Delivered</option>
                          <option value="cancelled" style={{color: 'black'}}>Cancelled</option>
                          <option value="refunded" style={{color: 'black'}}>Refunded</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
