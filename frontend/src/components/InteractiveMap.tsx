// frontend/src/components/InteractiveMap.tsx
'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import dynamic from 'next/dynamic';
import { useDataPolling } from '@/hooks/useDataPolling'; // Import the new polling hook

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center">Loading Map...</div>
});

export default function InteractiveMap() {
  const { zones, status } = useSelector((state: RootState) => state.dashboard);

  // Activate the data polling hook. This replaces both the initial fetch and the websocket.
  useDataPolling();

  if (status === 'idle' || status === 'loading') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Loading Map Data...</div>;
  }

  if (status === 'failed') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Failed to load map data.</div>;
  }

  return <MapComponent zones={zones} />;
}