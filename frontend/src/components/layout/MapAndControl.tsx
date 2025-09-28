// frontend/src/components/layout/MapAndControls.tsx
'use client';

import dynamic from 'next/dynamic';
import ZoneControlPanel from '../panels/ZoneControlPanel';

// Dynamically import map component to prevent SSR issues with Leaflet
const InteractiveMap = dynamic(() => import('../InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-800 flex items-center justify-center rounded-lg">Loading Map...</div>
});

export default function MapAndControls() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Column */}
      <div className="lg:col-span-2 h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
        <InteractiveMap />
      </div>
      
      {/* Controls Column */}
      <div className="lg:col-span-1">
        <ZoneControlPanel />
      </div>
    </div>
  );
}