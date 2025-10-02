// // frontend/src/components/layout/Footer.tsx
// frontend/src/app/components/layout/Footer.tsx

'use client';

import { useEffect, useState } from 'react';
// FIX: Import the custom context hook
import { useDashboard } from '../../app/StoreProvider'; // Path is two levels up from layout folder

export default function Footer() {
    // FIX: Get connection status from our custom hook
    const { isConnected } = useDashboard();
    
    // We'll manage the time locally in the Footer since the backend only sends lastUpdate
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Set up an interval to update the current time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const connectionStatus = isConnected ? 'CONNECTED' : 'DISCONNECTED';
    const connectionColor = isConnected ? 'text-green-500' : 'text-red-500';

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true
    });

    return (
        <footer className="w-full p-4 bg-gray-900 border-t border-gray-700 text-gray-400 text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <span>
                        System Time: {formattedTime}
                    </span>
                    <span className={`flex items-center ${connectionColor}`}>
                        <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: isConnected ? '#10B981' : '#EF4444' }}></span>
                        Status: {connectionStatus}
                    </span>
                </div>
                <div>
                    Smart City Dashboard - 2025
                </div>
            </div>
        </footer>
    );
}

// NOTE: Since your page.tsx imported Footer without curly braces: 
// import Footer from "@/components/layout/Footer";
// We must use 'export default function Footer()' here, which we have done.
// 'use client';
// import { useSelector } from 'react-redux';
// import { RootState } from '@/lib/redux/store';

// export default function Footer() {
//     const { status } = useSelector((state: RootState) => state.dashboard);
//     const connectionStatus = status === 'succeeded' ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
//     const currentTime = new Date().toLocaleString('en-US', {
//         year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
//     });

//     return (
//         <div className="mt-8 p-6 text-center text-gray-500 bg-gray-900 rounded-lg border border-gray-800 fade-in">
//             <h3 className="text-lg font-semibold text-cyan-400 mb-2">Smart City Command Center v1.0</h3>
//             <p className="text-sm text-gray-400">
//                 System Status: <span className={status === 'succeeded' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span>
//             </p>
//             <p className="text-xs mt-2">
//                 Last Synced: {currentTime}
//             </p>
//         </div>
//     );
// }