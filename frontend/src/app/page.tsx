// frontend/src/app/page.tsx
import Sidebar from "@/components/layout/Sidebar";
import DashboardMetrics from "@/components/analytics/DashboardMetrics";
import MapAndControls from "@/components/layout/MapAndControl";
import FleetAnalytics from "@/components/analytics/FleetAnalytics";
import Footer from "@/components/layout/Footer";
import LiveClockAndWeather from "@/components/analytics/LiveClockAndWeather"; // Import the new component

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <main>
            {/* Add the new component here */}
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