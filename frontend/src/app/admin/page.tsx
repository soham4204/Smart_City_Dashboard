'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from "@/components/layout/Sidebar"; 
import Footer from "@/components/layout/Footer"; 
import { 
  ShieldCheck, 
  Save, 
  Trash2, 
  PlusCircle, 
  Settings, 
  AlertTriangle,
  ArrowLeft,
  Lock,
  Key
} from 'lucide-react';

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
}

export default function AdminPanel() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false); // New state for error animation
  
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
      // Trigger shake animation
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

  // --- LOGIN SCREEN (MATCHING DASHBOARD THEME) ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-950 text-white items-center justify-center relative overflow-hidden font-sans">
        
        {/* Abstract Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-900/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-gray-800/40 rounded-full blur-3xl"></div>
        </div>

        {/* Login Card */}
        <div className={`relative z-10 w-full max-w-md p-1 transform transition-all duration-300 ${errorShake ? 'translate-x-[-10px]' : ''} ${errorShake ? 'shake-animation' : ''}`}>
           {/* Card Border Gradient */}
           <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 rounded-2xl opacity-50 blur-[1px]"></div>
           
           <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
             
             {/* Card Header */}
             <div className="bg-gray-800/50 p-8 text-center border-b border-gray-800">
               <div className="inline-flex items-center justify-center p-4 bg-gray-800 rounded-full border border-gray-700 shadow-inner mb-4">
                 <ShieldCheck className="w-10 h-10 text-blue-500" />
               </div>
               <h1 className="text-2xl font-bold text-white tracking-tight">System Access</h1>
               <p className="text-gray-400 text-sm mt-2">Smart City Central Command</p>
             </div>

             {/* Login Form */}
             <div className="p-8 space-y-6">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Security PIN
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-600" />
                        </div>
                        <input 
                          type="password" 
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all tracking-[0.5em] text-center font-mono text-lg shadow-inner"
                          placeholder="••••"
                          autoFocus
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Authenticate
                    </button>
                  </div>
                </form>

                <div className="text-center pt-4 border-t border-gray-800">
                  <Link href="/" className="inline-flex items-center gap-2 text-gray-500 text-xs hover:text-gray-300 transition-colors">
                    <ArrowLeft className="w-3 h-3" />
                    Return to Public Dashboard
                  </Link>
                </div>
             </div>
             
             {/* Status Bar */}
             <div className="bg-gray-950 p-3 flex justify-between items-center text-[10px] text-gray-600 border-t border-gray-800 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  SYSTEM ONLINE
                </span>
                <span>SECURE CONNECTION</span>
             </div>

           </div>
        </div>

        {/* CSS for Shake Animation */}
        <style jsx>{`
          .shake-animation {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}</style>
      </div>
    );
  }

  // --- MAIN ADMIN LAYOUT ---
  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto w-full flex-grow">
          
          <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-400" />
                System Configuration
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage decision thresholds and physical infrastructure.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700 transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </button>
              </Link>
              <button 
                onClick={() => setIsAuthenticated(false)} 
                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/30 text-sm font-medium transition-all"
              >
                Secure Logout
              </button>
            </div>
          </header>

          {message && (
            <div className={`p-4 mb-6 rounded-lg border flex justify-between items-center animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? <ShieldCheck className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                {message.text}
              </div>
              <button onClick={() => setMessage(null)} className="hover:text-white transition-colors">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* ZONES */}
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-lg font-semibold text-gray-200">Zone Parameters</h2>
                 <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">Live Control</span>
              </div>
              
              {loading ? <div className="text-gray-500 italic">Syncing with Central Command...</div> : zones.map((zone) => (
                <div key={zone.id} className="bg-gray-800 rounded-xl border border-gray-700/50 shadow-sm overflow-hidden">
                  
                  <div className="bg-gray-800/80 p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-white">{zone.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {zone.id}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {zone.poles.length} Active Nodes
                    </div>
                  </div>

                  <div className="p-5">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateConfig(zone.id, new FormData(e.currentTarget));
                      }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Heat Limit (°C)</label>
                          <input name="heat_threshold" type="number" defaultValue={zone.heat_threshold} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Rain (mm)</label>
                          <input name="rain_threshold_mm" type="number" step="1" defaultValue={zone.rain_threshold_mm} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Wind (kph)</label>
                          <input name="wind_speed_alert_kph" type="number" defaultValue={zone.wind_speed_alert_kph} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Vis. Min (km)</label>
                          <input name="visibility_min_km" type="number" step="0.1" defaultValue={zone.visibility_min_km} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Congestion (0-1)</label>
                          <input name="congestion_threshold" type="number" step="0.05" max="1" defaultValue={zone.congestion_threshold} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Crowd Limit</label>
                          <input name="crowd_density_limit" type="number" defaultValue={zone.crowd_density_limit} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-gray-700/50">
                        <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                          <Save className="w-3 h-3" />
                          Save Calibration
                        </button>
                      </div>
                    </form>

                    <div className="mt-6">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Connected Infrastructure</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {zone.poles.map(p => (
                          <div key={p.id} className="group relative bg-gray-900 border border-gray-700 rounded p-2 flex justify-between items-center hover:border-gray-500 transition-colors">
                             <div className="flex flex-col">
                               <span className="text-xs font-mono text-blue-300">{p.id}</span>
                               <span className={`text-[10px] font-bold ${p.status === 'ONLINE' ? 'text-green-500' : 'text-red-500'}`}>{p.status}</span>
                             </div>
                             <button 
                               onClick={() => handleDeletePole(p.id)} 
                               className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-500 transition-all"
                               title="Decommission Asset"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD NEW */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <PlusCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Deploy Node</h2>
                      <p className="text-xs text-gray-400">Add new IoT infrastructure</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddPole} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Target Zone</label>
                      <select 
                        value={newPole.zoneId}
                        onChange={(e) => setNewPole({...newPole, zoneId: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none appearance-none"
                        required
                      >
                        <option value="" className="bg-gray-900 text-gray-400">-- Select Zone --</option>
                        {zones.map(z => <option key={z.id} value={z.id} className="bg-gray-900 text-white">{z.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Asset ID (Unique)</label>
                      <input 
                        type="text" placeholder="e.g. MUM-AIR-99"
                        value={newPole.id} onChange={(e) => setNewPole({...newPole, id: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">Latitude</label>
                        <input type="number" step="any" placeholder="19.0..." value={newPole.lat} onChange={(e) => setNewPole({...newPole, lat: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">Longitude</label>
                        <input type="number" step="any" placeholder="72.8..." value={newPole.lon} onChange={(e) => setNewPole({...newPole, lon: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none" required />
                      </div>
                    </div>

                    <button type="submit" className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-green-900/20 flex justify-center items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Provision Node
                    </button>
                  </form>
                  
                  <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <h5 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      System Status
                    </h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Changes made here are broadcasted immediately to the central Decision Engine and all connected client dashboards via WebSocket secure channels.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}