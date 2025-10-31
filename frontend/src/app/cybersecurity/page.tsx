'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar'; // Import the main Sidebar
import CyberHeader from '@/components/cyber/CyberHeader';
import AttackSimulator from '@/components/cyber/AttackSimulator';
import ZoneStatusPanel from '@/components/cyber/ZoneStatusPanel';
import LiveClockAndWeather from '@/components/analytics/LiveClockAndWeather';

// Dynamically import map
const CyberMap = dynamic(() => import('@/components/cyber/CyberMap'), { 
  ssr: false 
});

interface CyberZone {
  id: string;
  name: string;
  zone_type: string;
  security_state: 'GREEN' | 'YELLOW' | 'RED';
  critical_assets: string[];
  active_incidents: number;
  threat_level: string;
  compliance_status: string;
}

interface CyberDashboardData {
  zones: CyberZone[];
  active_incidents: any[];
  recent_events: any[];
  global_threat_level: string;
}

export default function CybersecurityPage() {
  const [dashboardData, setDashboardData] = useState<CyberDashboardData | null>(null);
  const [selectedZone, setSelectedZone] = useState<CyberZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Fetch initial data
  useEffect(() => {
    fetchCyberData();
    setupWebSocket();
  }, []);

  const fetchCyberData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/v1/cyber/initial-state');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        if (data.zones.length > 0 && !selectedZone) {
          setSelectedZone(data.zones[0]); // Select first zone by default
        }
        setConnectionStatus('connected');
      } else {
        console.error('Failed to fetch cyber data');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching cyber data:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Ensure WebSocket is only created on the client side
    if (typeof window === 'undefined') {
      return;
    }

    const ws = new WebSocket('ws://localhost:8001/ws/updates');
    
    ws.onopen = () => {
      console.log('✅ Cyber WebSocket connected');
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'cyber_alert' || message.type === 'cyber_update') {
        // Update zone security state in real-time
        setDashboardData(prev => {
          if (!prev) return prev;
          
          const updatedZones = prev.zones.map(zone => 
            zone.id === message.data.zone_id 
              ? { ...zone, security_state: message.data.security_state }
              : zone
          );
          
          return { ...prev, zones: updatedZones };
        });

        // Update selected zone if it's the affected one
        if (selectedZone?.id === message.data.zone_id) {
          setSelectedZone(prev => prev ? { ...prev, security_state: message.data.security_state } : null);
        }
      }
    };

    ws.onclose = () => {
      console.log('🔌 Cyber WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('❌ Cyber WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    // Clean up WebSocket connection when component unmounts
    return () => {
      ws.close();
    };
  };

  const handleZoneSelect = (zone: CyberZone) => {
    setSelectedZone(zone);
  };

  // --- Define the controls to be passed to the sidebar ---
  const cyberControls = (
    <div className="space-y-4">
      <AttackSimulator zones={dashboardData?.zones || []} />
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900 text-white">
        {/* Render sidebar even during loading for consistent layout */}
        <Sidebar cyberControls={cyberControls} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Initializing Cyber Defense Systems...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* 1. Add the main Sidebar, passing in the controls */}
      <Sidebar cyberControls={cyberControls} />

      {/* 2. This is the main content area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <LiveClockAndWeather />
          <div className="my-6 border-t border-gray-700"></div>
          
          <CyberHeader 
            dashboardData={dashboardData}
            connectionStatus={connectionStatus}
          />
        </div>
        
        {/* --- Main Content 2-Column Layout --- */}
        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
          
          {/* Column 1: Map (Takes up remaining space) */}
          <div className="flex-1 h-full rounded-lg overflow-hidden">
            <CyberMap 
              zones={dashboardData?.zones || []}
              selectedZone={selectedZone}
              onZoneSelect={handleZoneSelect}
            />
          </div>

          {/* Column 2: Zone Details (Fixed width, scrolls internally) */}
          <div className="w-96 h-full flex flex-col gap-6 overflow-y-auto">
            {selectedZone && (
              <ZoneStatusPanel 
                zone={selectedZone}
                onRefresh={fetchCyberData}
              />
            )}
            {/* Fallback if no zone is selected */}
            {!selectedZone && dashboardData && dashboardData.zones.length > 0 && (
              <ZoneStatusPanel 
              zone={dashboardData.zones[0]}
              onRefresh={fetchCyberData}
            />
            )}
          </div>
        </div>
        {/* --- END OF LAYOUT --- */}

      </div>
    </div>
  );
}

