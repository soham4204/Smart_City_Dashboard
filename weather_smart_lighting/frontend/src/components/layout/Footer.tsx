// frontend/src/components/layout/Footer.tsx
'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function Footer() {
    const { status } = useSelector((state: RootState) => state.dashboard);
    const connectionStatus = status === 'succeeded' ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
    const currentTime = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    return (
        <div className="mt-8 p-6 text-center text-gray-500 bg-gray-900 rounded-lg border border-gray-800 fade-in">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Smart City Command Center v1.0</h3>
            <p className="text-sm text-gray-400">
                System Status: <span className={status === 'succeeded' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span>
            </p>
            <p className="text-xs mt-2">
                Last Synced: {currentTime}
            </p>
        </div>
    );
}