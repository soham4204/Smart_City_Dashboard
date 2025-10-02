// // frontend/src/components/layout/MapAndControls.tsx
// frontend/src/components/layout/MapAndControls.tsx

'use client';

import dynamic from 'next/dynamic';
import ZoneControlPanel from '../panels/ZoneControlPanel'; // Correct path to ZoneControlPanel

// FIX: Correct syntax and path for dynamic import
const InteractiveMap = dynamic(
    // 1. FIX SYNTAX: dynamic(() => ...
    // 2. FIX PATH: '../panels/InteractiveMap' (sibling folder)
    // 3. ADD NAMED EXPORT EXTRACTION: .then(mod => mod.InteractiveMap)
    () => import('../InteractiveMap').then(mod => mod.InteractiveMap),
    {
        ssr: false, // Essential for Leaflet map component
        loading: () => (
            <div className="h-[600px] w-full bg-gray-800 flex items-center justify-center rounded-lg text-gray-400">
                Loading Map...
            </div>
        )
    }
);

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
// 'use client';

// import dynamic from 'next/dynamic';
// import ZoneControlPanel from '../panels/ZoneControlPanel';

// // Dynamically import map component to prevent SSR issues with Leaflet
// const InteractiveMap = dynamic(() = import('../components/InteractiveMap'), {
//   ssr: false,
//   loading: () => <div className="h-[600px] w-full bg-gray-800 flex items-center justify-center rounded-lg">Loading Map...</div>
// });

// export default function MapAndControls() {
//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//       {/* Map Column */}
//       <div className="lg:col-span-2 h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
//         <InteractiveMap />
//       </div>
      
//       {/* Controls Column */}
//       <div className="lg:col-span-1">
//         <ZoneControlPanel />
//       </div>
//     </div>
//   );
// }


