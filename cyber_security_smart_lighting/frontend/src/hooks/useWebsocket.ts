// // src/hooks/useWebsocket.ts
// src/hooks/useWebsocket.ts

import { useEffect, useState } from 'react';

// Define the simplified structure for the backend data
export interface DashboardData {
  mapData: Array<{
    id: string;
    lat: number;
    lng: number;
    status: 'RED' | 'SECURE';
    
    zoneType: string;
  }>;
  // FIX: Change back to string literal union to match component logic ('SECURE' | 'RED')
  threatLevel: 'SECURE' | 'RED'; 
  activeUnits: number;
  totalUnits: number;
  highPriority: number;
  avgPower: number;
  lastUpdate: string;
}

const initialData: DashboardData = {
  // FIX: Change back to string literal
  threatLevel: 'SECURE', 
  activeUnits: 6,
  totalUnits: 7,
  avgPower: 78,
  highPriority: 0,
  lastUpdate: new Date().toLocaleTimeString('en-US'),
  mapData: [],
};

const WEBSOCKET_URL = 'ws://localhost:8000/ws';

export const useWebsocket = () => {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in the browser before trying to connect
    if (typeof window === 'undefined') return; 
    
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Cast the incoming message to handle the threatLevel update safely
        const updatedMessage = {
            ...message,
            // Ensure threatLevel from the message is correctly typed, 
            // assuming the backend sends 'SECURE' or 'RED' strings.
            threatLevel: message.threatLevel === 'RED' ? 'RED' : 'SECURE'
        } as Partial<DashboardData>;

        setData(prevData => ({
            ...prevData,
            ...updatedMessage,
            lastUpdate: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit', 
              hour12: true 
            }),
        }));
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        setError('Data format error.');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false);
    };

    ws.onerror = (e : any) => {
      console.log('WebSocket error:', e);
      // The console error on line 76 of your old code is handled here
      setError('Connection failed.');
    };

    return () => {
      ws.close();
    };
  }, []);

  return { data, isConnected, error };
};
// import { useEffect, useState } from 'react';

// // Define the simplified structure for the backend data
// export interface DashboardData {
//   mapData: Array<{
//     id: string;
//     lat: number;
//     lng: number;
//     status: 'RED' | 'SECURE';
    
//     zoneType: string;
//   }>;
//   threatLevel: number; // Changed from string to number
//   activeUnits: number;
//   totalUnits: number;
//   highPriority: number;
//   avgPower: number;
//   lastUpdate: string;
// }

// const initialData: DashboardData = {
//   threatLevel: 0, // Changed from 'SECURE' to 0
//   activeUnits: 6,
//   totalUnits: 7,
//   avgPower: 78,
//   highPriority: 0,
//   lastUpdate: new Date().toLocaleTimeString('en-US'),
//   mapData: [],
// };

// const WEBSOCKET_URL = 'ws://localhost:8000/ws';

// export const useWebsocket = () => {
//   const [data, setData] = useState<DashboardData>(initialData);
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     // Check if running in the browser before trying to connect
//     if (typeof window === 'undefined') return; 
    
//     const ws = new WebSocket(WEBSOCKET_URL);

//     ws.onopen = () => {
//       console.log('WebSocket connection established.');
//       setIsConnected(true);
//       setError(null);
//     };

//     ws.onmessage = (event) => {
//       try {
//         const message = JSON.parse(event.data);
//         setData(prevData => ({
//             ...prevData,
//             ...message,
//             lastUpdate: new Date().toLocaleTimeString('en-US', { 
//               hour: '2-digit', 
//               minute: '2-digit', 
//               second: '2-digit', 
//               hour12: true 
//             }),
//         }));
//       } catch (e) {
//         console.error('Failed to parse WebSocket message:', e);
//         setError('Data format error.');
//       }
//     };

//     ws.onclose = () => {
//       console.log('WebSocket connection closed.');
//       setIsConnected(false);
//     };

//     ws.onerror = (e : any) => {
//       console.log('WebSocket error:', e);
//       setError('Connection failed.');
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);

//   return { data, isConnected, error };
// };