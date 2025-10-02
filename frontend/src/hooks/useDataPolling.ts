// frontend/src/hooks/useDataPolling.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { setDashboardState } from '@/lib/redux/dashboardSlice';

const API_URL = 'http://localhost:8000/api/v1/dashboard/initial-state';
const POLLING_INTERVAL = 3000; // 3 seconds

export function useDataPolling() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Function to fetch data and update the state
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Dispatch the data to Redux. Note: we only get zones from this endpoint.
        dispatch(setDashboardState({ zones: data.zones }));

      } catch (error) {
        console.error("Failed to fetch dashboard state:", error);
      }
    };

    // Fetch data immediately when the component mounts
    fetchData();

    // Then, set up an interval to fetch data periodically
    const intervalId = setInterval(fetchData, POLLING_INTERVAL);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [dispatch]);
}