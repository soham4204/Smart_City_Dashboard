// // frontend/src/app/page.tsx
// import Header from "@/components/layout/Header";
// import Sidebar from "@/components/layout/Sidebar";
// import { DashboardMetrics } from "@/components/analytics/DashboardMetrics";
// import MapAndControls from "@/components/layout/MapAndControl";
// import FleetAnalytics from "@/components/analytics/FleetAnalytics";
// import Footer from "@/components/layout/Footer";

// export default function Home() {
//   return (
//     <div className="flex h-screen bg-gray-900 text-white">
//       {/* The Sidebar is now a direct child of the flex container */}
//       <Sidebar />

//       {/* This wrapper contains all other content and will scroll if needed */}
//       <div className="flex-1 flex flex-col overflow-y-auto">
//         <div className="p-6">
//           {/* <Header /> */}
//           <main>
//             <DashboardMetrics />
//             <div className="my-6 border-t border-gray-700"></div>
//             <MapAndControls />
//             <div className="my-6 border-t border-gray-700"></div>
//             <FleetAnalytics />
//           </main>
//           <Footer />
//         </div>
//       </div>
//     </div>
//   );
// }
// frontend/src/app/page.tsx

// FIX: Use named imports { } for ALL components (assuming they use export const)
import { DashboardMetrics } from "@/components/analytics/DashboardMetrics"; // This one was already correct
import FleetAnalytics from "@/components/analytics/FleetAnalytics";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MapAndControls from "@/components/layout/MapAndControl";
import Sidebar from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar is a named export */}
      <Sidebar />

      {/* This wrapper contains all other content and will scroll if needed */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          {/* Header is a named export, uncommented for completeness */}
          <Header /> 
          <main>
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