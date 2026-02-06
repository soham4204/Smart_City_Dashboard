'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic'; 
import Footer from "@/components/layout/Footer"; 
import { 
  ShieldCheck, Save, Trash2, PlusCircle, Settings, AlertTriangle, ArrowLeft, Lock, Key, MapPin, Activity 
} from 'lucide-react';

// --- Dynamic Import for Map ---
const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full bg-gray-900/50 rounded-xl animate-pulse flex flex-col items-center justify-center border border-gray-800">
      <MapPin className="w-10 h-10 text-gray-700 mb-2" />
      <span className="text-gray-500 font-mono text-sm">Initializing Geospatial Engine...</span>
    </div>
  )
});

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
  rain_threshold_mm: number;
  visibility_min_km: number;
  wind_speed_alert_kph: number;
  crowd_density_limit: number;
  poles: Pole[];
  color?: string;
}

export default function AdminPanel() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  
  // --- Data State ---
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newPole, setNewPole] = useState({ id: '', lat: '', lon: '', zoneId: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchZones();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") { 
      setIsAuthenticated(true);
    } else {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
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

  const handleUpdateConfig = async (zoneId: string, formData: FormData) => {
    const config: any = {};
    formData.forEach((value, key) => { config[key] = Number(value); });

    try {
      const res = await fetch(`http://localhost:8000/api/v1/zones/${zoneId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) { setMessage({ text: 'Configuration saved successfully', type: 'success' }); fetchZones(); }
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
        setMessage({ text: `Asset ${newPole.id} added to infrastructure`, type: 'success' });
        setNewPole({ id: '', lat: '', lon: '', zoneId: '' });
        fetchZones();
      } else {
        const err = await res.json(); setMessage({ text: `Error: ${err.detail}`, type: 'error' });
      }
    } catch (error) { setMessage({ text: 'Failed to add pole.', type: 'error' }); }
  };

  const handleDeletePole = async (poleId: string) => {
    if(!confirm(`PERMANENT DELETE: Remove pole ${poleId}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/poles/${poleId}`, { method: 'DELETE' });
      if (res.ok) { setMessage({ text: `Asset ${poleId} removed.`, type: 'success' }); fetchZones(); }
    } catch (error) { setMessage({ text: 'Error connecting to server', type: 'error' }); }
  };

  const onMapLocationSelect = (lat: number, lng: number) => {
    setNewPole(prev => ({ ...prev, lat: lat.toFixed(6), lon: lng.toFixed(6) }));
  };

  const onMapZoneSelect = (zoneId: string) => {
    setNewPole(prev => ({ ...prev, zoneId: zoneId }));
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-950 text-white items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-900/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-gray-800/40 rounded-full blur-3xl"></div>
        </div>
        <div className={`relative z-10 w-full max-w-md p-1 transform transition-all duration-300 ${errorShake ? 'translate-x-[-10px]' : ''} ${errorShake ? 'shake-animation' : ''}`}>
           <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 rounded-2xl opacity-50 blur-[1px]"></div>
           <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
             <div className="bg-gray-800/50 p-8 text-center border-b border-gray-800">
               <div className="inline-flex items-center justify-center p-4 bg-gray-800 rounded-full border border-gray-700 shadow-inner mb-4">
                 <ShieldCheck className="w-10 h-10 text-blue-500" />
               </div>
               <h1 className="text-2xl font-bold text-white tracking-tight">System Access</h1>
               <p className="text-gray-400 text-sm mt-2">Smart City Central Command</p>
             </div>
             <div className="p-8 space-y-6">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Security PIN</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-600" /></div>
                        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all tracking-[0.5em] text-center font-mono text-lg shadow-inner" placeholder="••••" autoFocus maxLength={4}/>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"><Key className="w-4 h-4" />Authenticate</button>
                  </div>
                </form>
                <div className="text-center pt-4 border-t border-gray-800">
                  <Link href="/" className="inline-flex items-center gap-2 text-gray-500 text-xs hover:text-gray-300 transition-colors"><ArrowLeft className="w-3 h-3" />Return to Public Dashboard</Link>
                </div>
             </div>
           </div>
        </div>
        <style jsx>{` .shake-animation { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } `}</style>
      </div>
    );
  }

  // --- FULL WIDTH LAYOUT (Map on Right) ---
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      
      <div className="flex-grow w-full max-w-[1920px] mx-auto p-6">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              System Configuration
            </h1>
            <p className="text-gray-400 text-sm mt-1 ml-11">Manage decision thresholds, calibration, and physical infrastructure.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <button className="px-5 py-2.5 bg-gray-800 hover:bg-gray-750 rounded-lg text-sm border border-gray-700 transition-all flex items-center gap-2 font-medium">
                <ArrowLeft className="w-4 h-4" /> Return to Dashboard
              </button>
            </Link>
            <button onClick={() => setIsAuthenticated(false)} className="px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/30 text-sm font-medium transition-all">
              Secure Logout
            </button>
          </div>
        </header>

        {/* --- FEEDBACK MESSAGE --- */}
        {message && (
          <div className={`p-4 mb-8 rounded-xl border flex justify-between items-center animate-in fade-in slide-in-from-top-2 shadow-lg ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                 {message.type === 'success' ? <ShieldCheck className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
              </div>
              <span className="font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="hover:text-white transition-colors p-1 hover:bg-gray-800/50 rounded">✕</button>
          </div>
        )}

        {/* --- MAIN SPLIT LAYOUT --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ZONES LIST (Wider, Col-span-8) */}
          <div className="xl:col-span-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
               </div>
               <h2 className="text-xl font-semibold text-gray-100">Zone Parameters</h2>
            </div>
            
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                Syncing with Central Command...
              </div>
            ) : zones.map((zone) => (
              <div key={zone.id} className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-sm overflow-hidden hover:border-gray-700 transition-colors">
                <div className="bg-gray-900/80 p-5 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-12 rounded-full" style={{ backgroundColor: zone.color || '#3b82f6' }}></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{zone.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {zone.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {zone.poles.length} Active Nodes
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateConfig(zone.id, new FormData(e.currentTarget)); }}>
                    {/* Grid for Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Heat Limit (°C)</label><input name="heat_threshold" type="number" defaultValue={zone.heat_threshold} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Rain (mm)</label><input name="rain_threshold_mm" type="number" step="1" defaultValue={zone.rain_threshold_mm} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Wind (kph)</label><input name="wind_speed_alert_kph" type="number" defaultValue={zone.wind_speed_alert_kph} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Vis. Min (km)</label><input name="visibility_min_km" type="number" step="0.1" defaultValue={zone.visibility_min_km} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Congestion (0-1)</label><input name="congestion_threshold" type="number" step="0.05" max="1" defaultValue={zone.congestion_threshold} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Crowd Limit</label><input name="crowd_density_limit" type="number" defaultValue={zone.crowd_density_limit} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-800/50">
                      <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40">
                         <Save className="w-3.5 h-3.5" /> Save Calibration
                      </button>
                    </div>
                  </form>
                  <div className="mt-8">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Connected Infrastructure</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {zone.poles.map(p => (
                        <div key={p.id} className="group relative bg-gray-950 border border-gray-800 rounded-lg p-3 flex justify-between items-center hover:border-gray-600 transition-colors">
                           <div className="flex flex-col gap-1">
                             <span className="text-xs font-mono text-blue-300 font-medium">{p.id}</span>
                             <span className={`text-[10px] font-bold ${p.status === 'ONLINE' ? 'text-green-500' : 'text-red-500'}`}>{p.status}</span>
                           </div>
                           <button onClick={() => handleDeletePole(p.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md text-red-500 transition-all" title="Decommission Asset"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: MAP & DEPLOYMENT (Col-span-4, Sticky) */}
          <div className="xl:col-span-4 space-y-6 sticky top-6">
             
             {/* 1. MAP WIDGET */}
             <div className="border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                 <div className="bg-gray-900 p-3 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-blue-400" />
                       <span className="text-sm font-semibold text-gray-200">Live Map</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">SELECT LOCATION</span>
                 </div>
                 <div className="h-[350px]">
                   <AdminMap 
                     zones={zones} 
                     onLocationSelect={onMapLocationSelect} 
                     onZoneSelect={onMapZoneSelect} 
                   />
                 </div>
             </div>

             {/* 2. DEPLOY FORM */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20">
                     <PlusCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-white">Deploy Node</h2>
                     <p className="text-xs text-gray-400 mt-0.5">Add new IoT infrastructure</p>
                  </div>
                </div>

                <form onSubmit={handleAddPole} className="space-y-5 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Zone</label>
                    <select 
                      value={newPole.zoneId}
                      onChange={(e) => setNewPole({...newPole, zoneId: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none appearance-none transition-all"
                      required
                    >
                      <option value="" className="bg-gray-950 text-gray-500">-- Select Zone --</option>
                      {zones.map(z => <option key={z.id} value={z.id} className="bg-gray-950 text-white">{z.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset ID</label>
                    <input type="text" placeholder="e.g. MUM-AIR-99" value={newPole.id} onChange={(e) => setNewPole({...newPole, id: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latitude</label>
                      <input type="number" step="any" placeholder="19.0..." value={newPole.lat} onChange={(e) => setNewPole({...newPole, lat: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Longitude</label>
                      <input type="number" step="any" placeholder="72.8..." value={newPole.lon} onChange={(e) => setNewPole({...newPole, lon: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all" required />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 flex justify-center items-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Provision Node
                  </button>
                </form>
              </div>
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}