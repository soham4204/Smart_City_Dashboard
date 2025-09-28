// frontend/src/components/InteractiveMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/redux/store';
import { setLoading, setDashboardState, setError } from '@/lib/redux/dashboardSlice';
import dynamic from 'next/dynamic';
import { useWebSocket } from '@/hooks/useWebsocket';

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div>Loading Map...</div>
});

export default function InteractiveMap() {
  const dispatch = useDispatch<AppDispatch>();
  const { zones, status } = useSelector((state: RootState) => state.dashboard);
  const [isClient, setIsClient] = useState(false);

  // Activate the WebSocket connection
  useWebSocket();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(setLoading());
        const response = await fetch(
          'http://localhost:8000/api/v1/dashboard/initial-state'
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Convert tuple locations to arrays for frontend compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedZones = data.zones.map((zone: any) => ({
          ...zone,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          poles: zone.poles.map((pole: any) => ({
            ...pole,
            location: Array.isArray(pole.location)
              ? pole.location
              : [pole.location[0], pole.location[1]]
          }))
        }));

        dispatch(setDashboardState(processedZones));
      } catch (error) {
        console.error('Failed to fetch dashboard state:', error);
        dispatch(setError());
      }
    };

    fetchData();
  }, [dispatch]);

  if (!isClient) return <div>Loading Map...</div>;
  if (status === 'loading') return <div>Loading Map Data...</div>;
  if (status === 'failed') return <div>Failed to load map data. Please try again.</div>;
  if (status !== 'succeeded' || zones.length === 0) return <div>No data available</div>;

  return <MapComponent zones={zones} />;
}
