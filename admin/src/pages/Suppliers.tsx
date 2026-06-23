import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, MapPin, CheckCircle, XCircle, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Supplier {
  id: string;
  businessName: string;
  ownerId: string;
  approvalStatus: string;
  rating: number;
  availableLitres: number;
  pricePerLitre: number;
  address: string;
  isOpen: boolean;
}

export default function Suppliers() {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'suppliers'), limit(100));
      const snap = await getDocs(q);
      const data: Supplier[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleUpdateStatus = async (supplierId: string, newStatus: string) => {
    if (!window.confirm(`Change supplier status to ${newStatus}?`)) return;
    
    setUpdating(supplierId);
    try {
      await updateDoc(doc(db, 'suppliers', supplierId), {
        approvalStatus: newStatus,
        updatedAt: serverTimestamp()
      });
      setSuppliers(suppliers.map(s => s.id === supplierId ? { ...s, approvalStatus: newStatus } : s));
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier.");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: '4px'}}/> Approved</span>;
      case 'rejected':
        return <span className="badge badge-danger"><XCircle size={12} style={{marginRight: '4px'}}/> Rejected</span>;
      case 'under_review':
        return <span className="badge badge-pending"><AlertCircle size={12} style={{marginRight: '4px'}}/> Under Review</span>;
      default:
        return <span className="badge badge-pending"><AlertCircle size={12} style={{marginRight: '4px'}}/> Pending</span>;
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const filtered = suppliers.filter(s => 
    s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Supplier Management</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Search size={20} className="text-secondary" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder="Search suppliers by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent' }} 
          />
        </div>
      </div>

      <div className="glass-panel">
        {loading ? (
          <p>Loading suppliers...</p>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Location</th>
                  <th>Stock / Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(supplier => (
                  <tr key={supplier.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{supplier.businessName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {supplier.id.slice(0, 8)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} />
                        <span style={{ fontSize: '13px' }}>{supplier.address || 'Not specified'}</span>
                      </div>
                    </td>
                    <td>
                      <div>{supplier.availableLitres?.toLocaleString() || 0} L available</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatNaira(supplier.pricePerLitre || 0)} / L</div>
                    </td>
                    <td>{getStatusBadge(supplier.approvalStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          value={supplier.approvalStatus}
                          onChange={(e) => handleUpdateStatus(supplier.id, e.target.value)}
                          disabled={updating === supplier.id || profile?.role !== 'super_admin'}
                          title={profile?.role !== 'super_admin' ? "Only Super Admins can change approval status" : "Change status"}
                          style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', cursor: profile?.role !== 'super_admin' ? 'not-allowed' : 'pointer', opacity: profile?.role !== 'super_admin' ? 0.6 : 1 }}
                        >
                          <option value="pending" style={{color: 'black'}}>Pending</option>
                          <option value="under_review" style={{color: 'black'}}>Under Review</option>
                          <option value="approved" style={{color: 'black'}}>Approved</option>
                          <option value="rejected" style={{color: 'black'}}>Rejected</option>
                        </select>
                        <button className="btn btn-outline" style={{ padding: '6px' }} title="Edit full details">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No suppliers found.</td>
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
