// frontend/src/components/InteractiveMap.tsx
'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import dynamic from 'next/dynamic';

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center">Loading Map...</div>
});

export default function InteractiveMap() {
  const { zones, status } = useSelector((state: RootState) => state.dashboard);

  // The polling hook is no longer needed; data is now pushed via WebSocket.

  if (status === 'idle' || status === 'loading') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Connecting to live feed...</div>;
  }

  if (status === 'failed') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Failed to load map data.</div>;
  }

  return <MapComponent zones={zones} />;
}