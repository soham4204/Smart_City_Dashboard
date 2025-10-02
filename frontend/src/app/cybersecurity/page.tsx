// app/cybersecurity/page.tsx
'use client';

import { useEffect, useState } from 'react';
import CyberMap from '@/components/cyber/CyberMap';
import CyberHeader from '@/components/cyber/CyberHeader';
import AttackSimulator from '@/components/cyber/AttackSimulator';
import ZoneStatusPanel from '@/components/cyber/ZoneStatusPanel';

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
    try {
      const response = await fetch('http://localhost:8001/api/v1/cyber/initial-state');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        if (data.zones.length > 0) {
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
      // Use mock data as fallback
      setDashboardData({
        zones: [
          {
            id: 'airport_zone',
            name: 'CSM International Airport',
            zone_type: 'airport_zone',
            security_state: 'GREEN',
            critical_assets: ['runway_lighting_system', 'air_traffic_control'],
            active_incidents: 0,
            threat_level: 'LOW',
            compliance_status: 'COMPLIANT'
          },
          {
            id: 'hospital_zone',
            name: 'KEM Hospital',
            zone_type: 'hospital_zone',
            security_state: 'GREEN',
            critical_assets: ['patient_records', 'life_support_systems'],
            active_incidents: 0,
            threat_level: 'LOW',
            compliance_status: 'COMPLIANT'
          }
        ],
        active_incidents: [],
        recent_events: [],
        global_threat_level: 'LOW'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
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
  };

  const handleZoneSelect = (zone: CyberZone) => {
    setSelectedZone(zone);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Cyber Defense Systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <CyberHeader 
        dashboardData={dashboardData}
        connectionStatus={connectionStatus}
      />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 h-screen overflow-y-auto">
          {/* Attack Simulator */}
          <AttackSimulator zones={dashboardData?.zones || []} />
          
          {/* Zone Status */}
          {selectedZone && (
            <ZoneStatusPanel 
              zone={selectedZone}
              onRefresh={() => fetchCyberData()}
            />
          )}
        </div>

        {/* Main Content - Map */}
        <div className="flex-1 h-screen">
          <CyberMap 
            zones={dashboardData?.zones || []}
            selectedZone={selectedZone}
            onZoneSelect={handleZoneSelect}
          />
        </div>
      </div>
    </div>
  );
}