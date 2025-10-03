'use client';

import { useState, useEffect } from 'react';
import BlackoutHeader from '@/components/blackout/BlackoutHeader';
import BlackoutMap from '@/components/blackout/BlackoutMap';
import BlackoutSimulator from '@/components/blackout/BlackoutSimulator';
import ZonePowerPanel from '@/components/blackout/ZonePowerPanel';
import IncidentPanel from '@/components/blackout/IncidentPanel';

interface PowerZone {
  id: string;
  name: string;
  zone_type: string;
  priority: string;
  power_state: string;
  current_load_mw: number;
  capacity_mw: number;
  backup_available: boolean;
  backup_capacity_mw: number;
  backup_duration_hours: number;
  affected_population: number;
  critical_facilities: string[];
  power_allocation_percent: number;
  lat: number;
  lon: number;
}

interface BlackoutIncident {
  incident_id: string;
  severity: string;
  affected_zones: string[];
  cause: string;
  total_capacity_lost_mw: number;
  estimated_recovery_hours: number;
  status: string;
  initiated_at: string;
  resolved_at?: string;
  weather_related: boolean;
  cascade_risk: number;
}

interface BlackoutDashboardData {
  zones: PowerZone[];
  active_incidents: BlackoutIncident[];
  total_grid_capacity_mw: number;
  current_grid_load_mw: number;
  available_backup_mw: number;
  grid_health_score: number;
}

interface SOARAnalysis {
  grid_analysis?: any;
  weather_impact?: any;
  allocation_plan?: any;
  execution_status?: any;
}

export default function BlackoutPage() {
  const [dashboardData, setDashboardData] = useState<BlackoutDashboardData | null>(null);
  const [selectedZone, setSelectedZone] = useState<PowerZone | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<BlackoutIncident | null>(null);
  const [soarAnalysis, setSoarAnalysis] = useState<SOARAnalysis | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchBlackoutData();
  }, []);

  // Setup WebSocket
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8002/ws/blackout');
    
    websocket.onopen = () => {
      console.log('[Blackout WS] Connected');
      setConnectionStatus('connected');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('[Blackout WS] Message:', message);

      if (message.type === 'blackout_alert') {
        // Refresh data on new blackout
        fetchBlackoutData();
      } else if (message.type === 'blackout_update') {
        // Update zones and incident data
        if (message.data.zones) {
          setDashboardData((prev) => prev ? { ...prev, zones: message.data.zones } : null);
        }
        if (message.data.incident) {
          setSelectedIncident(message.data.incident);
        }
        if (message.data.soar_analysis) {
          setSoarAnalysis(message.data.soar_analysis);
        }
      } else if (message.type === 'recovery_progress') {
        // Update zones with recovery progress
        if (message.data.zones) {
          setDashboardData((prev) => {
            if (!prev) return null;
            const updatedZones = prev.zones.map(zone => {
              const updatedZone = message.data.zones.find((z: PowerZone) => z.id === zone.id);
              return updatedZone || zone;
            });
            return { ...prev, zones: updatedZones };
          });
        }
      } else if (message.type === 'blackout_resolved') {
        // Refresh all data
        fetchBlackoutData();
        setSelectedIncident(null);
        setSoarAnalysis(null);
      } else if (message.type === 'manual_allocation') {
        // Update zones after manual allocation
        if (message.data.zones) {
          setDashboardData((prev) => {
            if (!prev) return null;
            const updatedZones = prev.zones.map(zone => {
              const updatedZone = message.data.zones.find((z: PowerZone) => z.id === zone.id);
              return updatedZone || zone;
            });
            return { ...prev, zones: updatedZones };
          });
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('[Blackout WS] Error:', error);
      setConnectionStatus('disconnected');
    };

    websocket.onclose = () => {
      console.log('[Blackout WS] Disconnected');
      setConnectionStatus('disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const fetchBlackoutData = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/blackout/initial-state');
      const data = await response.json();
      setDashboardData(data);
      
      // Auto-select first incident if exists
      if (data.active_incidents && data.active_incidents.length > 0) {
        setSelectedIncident(data.active_incidents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch blackout data:', error);
    }
  };

  const handleZoneSelect = (zone: PowerZone) => {
    setSelectedZone(zone);
  };

  const handleSimulationComplete = (result: any) => {
    if (result.incident) {
      setSelectedIncident(result.incident);
    }
    if (result.soar_result) {
      setSoarAnalysis({
        grid_analysis: result.soar_result.grid_analysis,
        weather_impact: result.soar_result.weather_impact,
        allocation_plan: result.soar_result.power_allocation_plan,
        execution_status: result.soar_result.execution_status
      });
    }
    fetchBlackoutData();
  };

  const handleManualAllocation = async (allocations: Record<string, number>) => {
    if (!selectedIncident) return;

    try {
      await fetch(`http://localhost:8002/api/v1/blackout/incidents/${selectedIncident.incident_id}/manual-allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocations)
      });
    } catch (error) {
      console.error('Failed to apply manual allocation:', error);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await fetch(`http://localhost:8002/api/v1/blackout/incidents/${incidentId}/resolve`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading Blackout Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <BlackoutHeader 
        dashboardData={dashboardData}
        connectionStatus={connectionStatus}
      />

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 h-[calc(100vh-64px)] overflow-y-auto">
          {/* Blackout Simulator */}
          <BlackoutSimulator 
            zones={dashboardData.zones}
            onSimulationComplete={handleSimulationComplete}
          />
          
          {/* Active Incident Details */}
          {selectedIncident && (
            <IncidentPanel 
              incident={selectedIncident}
              soarAnalysis={soarAnalysis}
              zones={dashboardData.zones}
              onManualAllocation={handleManualAllocation}
              onResolve={handleResolveIncident}
            />
          )}

          {/* Selected Zone Details */}
          {selectedZone && !selectedIncident && (
            <ZonePowerPanel 
              zone={selectedZone}
              onRefresh={fetchBlackoutData}
            />
          )}
        </div>

        {/* Main Content - Map */}
        <div className="flex-1 h-[calc(100vh-64px)]">
          <BlackoutMap 
            zones={dashboardData.zones}
            selectedZone={selectedZone}
            activeIncidents={dashboardData.active_incidents}
            onZoneSelect={handleZoneSelect}
          />
        </div>
      </div>
    </div>
  );
}

