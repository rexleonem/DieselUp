import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface MarketSettings {
  dieselPricePerLitre: number;
  systemFeePercent: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<MarketSettings>({ dieselPricePerLitre: 1200, systemFeePercent: 2.5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'market'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as MarketSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      await setDoc(doc(db, 'settings', 'market'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-fade-in"><p>Loading settings...</p></div>;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>System Settings</h1>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <SettingsIcon className="text-accent" size={24} />
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Market Configuration</h2>
        </div>

        {message && (
          <div className="badge badge-success" style={{ display: 'block', marginBottom: '24px', padding: '12px', fontSize: '14px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Diesel Market Price (NGN / Litre)</label>
            <input 
              type="number" 
              value={settings.dieselPricePerLitre}
              onChange={(e) => setSettings({ ...settings, dieselPricePerLitre: Number(e.target.value) })}
              required
              min="0"
              step="0.01"
              placeholder="e.g. 1200"
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              This price serves as a baseline or fallback indicator.
            </small>
          </div>

          <div className="form-group">
            <label>System Platform Fee (%)</label>
            <input 
              type="number" 
              value={settings.systemFeePercent}
              onChange={(e) => setSettings({ ...settings, systemFeePercent: Number(e.target.value) })}
              required
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 2.5"
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              Percentage fee taken by the platform per transaction.
            </small>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
