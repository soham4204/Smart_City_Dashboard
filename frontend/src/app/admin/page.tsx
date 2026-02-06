'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Types ---
interface Pole {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface Zone {
  id: string;
  name: string;
  heat_threshold: number;
  congestion_threshold: number;
  poles: Pole[];
}

export default function AdminPanel() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // --- Data State ---
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newPole, setNewPole] = useState({ id: '', lat: '', lon: '', zoneId: '' });

  // Load zones only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchZones();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // HARDCODED PIN FOR DEMO PURPOSES
    if (pin === "1234") { 
      setIsAuthenticated(true);
    } else {
      alert("Incorrect PIN");
      setPin('');
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/dashboard/initial-state');
      const data = await res.json();
      setZones(data.zones);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      setLoading(false);
    }
  };

  // ... (Keep existing API handlers: handleUpdateConfig, handleAddPole, handleDeletePole)
  const handleUpdateConfig = async (zoneId: string, heat: number, congestion: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/zones/${zoneId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heat_threshold: heat, congestion_threshold: congestion })
      });
      if (res.ok) { setMessage({ text: 'Zone config updated!', type: 'success' }); fetchZones(); }
    } catch (e) { setMessage({ text: 'Update failed', type: 'error' }); }
  };

  const handleAddPole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPole.zoneId) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/poles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPole.id, zone_id: newPole.zoneId,
          latitude: parseFloat(newPole.lat), longitude: parseFloat(newPole.lon), priority: 'Medium'
        })
      });
      if (res.ok) {
        setMessage({ text: `Pole ${newPole.id} added!`, type: 'success' });
        setNewPole({ id: '', lat: '', lon: '', zoneId: '' });
        fetchZones();
      } else {
        const err = await res.json(); setMessage({ text: `Error: ${err.detail}`, type: 'error' });
      }
    } catch (error) { setMessage({ text: 'Failed to add pole.', type: 'error' }); }
  };

  const handleDeletePole = async (poleId: string) => {
    if(!confirm(`Remove pole ${poleId}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/poles/${poleId}`, { method: 'DELETE' });
      if (res.ok) { setMessage({ text: `Pole ${poleId} deleted.`, type: 'success' }); fetchZones(); }
    } catch (error) { setMessage({ text: 'Error connecting to server', type: 'error' }); }
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-sm w-full border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">🔒 Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Security PIN</label>
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••"
                autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors">
              Access Panel
            </button>
            <div className="text-center mt-4">
              <Link href="/" className="text-slate-500 text-sm hover:text-slate-300">← Back to Dashboard</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN UI (Authenticated) ---
  if (loading) return <div className="min-h-screen bg-slate-900 p-10 text-white">Loading data...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">City Admin</h1>
          <div className="flex gap-4">
             <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 bg-red-900/50 text-red-300 hover:bg-red-900 rounded border border-red-800">
              Logout
            </button>
            <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ZONES LIST */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-slate-300">Zone Configurations</h2>
            {zones.map((zone) => (
              <div key={zone.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">{zone.name}</h3>
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{zone.poles.length} Poles</span>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateConfig(zone.id, Number(formData.get('heat')), Number(formData.get('congestion')));
                  }}
                  className="grid grid-cols-3 gap-4 mb-4"
                >
                  <div>
                    <label className="text-xs text-slate-400">Heat (°C)</label>
                    <input name="heat" type="number" defaultValue={zone.heat_threshold} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Congestion</label>
                    <input name="congestion" type="number" step="0.1" defaultValue={zone.congestion_threshold} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs text-white py-2 rounded">Update</button>
                  </div>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {zone.poles.map(p => (
                      <div key={p.id} className="bg-slate-900 p-2 rounded text-xs border border-slate-800 flex justify-between items-center group">
                         <span className={`font-mono ${p.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>{p.id}</span>
                         <button onClick={() => handleDeletePole(p.id)} className="text-slate-600 hover:text-red-500 font-bold px-2">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ADD FORM */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-4">Add Infrastructure</h2>
              <form onSubmit={handleAddPole} className="space-y-4">
                <select 
                  value={newPole.zoneId}
                  onChange={(e) => setNewPole({...newPole, zoneId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                  required
                >
                  <option value="">-- Select Zone --</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                <input 
                  type="text" placeholder="Pole ID (e.g. NEW-01)"
                  value={newPole.id} onChange={(e) => setNewPole({...newPole, id: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="any" placeholder="Lat" value={newPole.lat} onChange={(e) => setNewPole({...newPole, lat: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" required />
                  <input type="number" step="any" placeholder="Lon" value={newPole.lon} onChange={(e) => setNewPole({...newPole, lon: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" required />
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded mt-4">+ Add Light Pole</button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}