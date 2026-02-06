// frontend/src/app/page.tsx
import Sidebar from "@/components/layout/Sidebar";
import DashboardMetrics from "@/components/analytics/DashboardMetrics";
import MapAndControls from "@/components/layout/MapAndControl";
import FleetAnalytics from "@/components/analytics/FleetAnalytics";
import Footer from "@/components/layout/Footer";
import LiveClockAndWeather from "@/components/analytics/LiveClockAndWeather";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <main>
            {/* Header Section with Admin Button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Smart City Dashboard</h1>
              
              <Link href="/admin">
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2">
                  <span>⚙️</span> Configure Zones
                </button>
              </Link>
            </div>

            {/* Weather & Clock Widget */}
            <LiveClockAndWeather /> 
            
            <div className="my-6 border-t border-gray-700"></div>
            <DashboardMetrics />
            
            <div className="my-6 border-t border-gray-700"></div>
            <MapAndControls />
            
            <div className="my-6 border-t border-gray-700"></div>
            <FleetAnalytics />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}