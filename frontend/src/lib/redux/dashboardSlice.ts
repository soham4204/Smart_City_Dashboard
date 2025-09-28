// frontend/src/lib/redux/dashboardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the types to match our backend models
interface LightPole {
    id: string;
    location: [number, number];
    brightness: number;
    status: string;
    // --- ADD THE MISSING FIELDS HERE ---
    priority: string;
    manual_override: boolean;
    group: string;
}

interface Zone {
    id: string;
    name: string;
    color: string;
    poles: LightPole[];
}

interface DashboardState {
    zones: Zone[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: DashboardState = {
    zones: [],
    status: 'idle',
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        // Reducer to handle setting the loading state
        setLoading(state) {
            state.status = 'loading';
        },
        // Reducer to handle setting the final state
        setDashboardState(state, action: PayloadAction<Zone[]>) {
            state.zones = action.payload;
            state.status = 'succeeded';
        },
        // Reducer to handle errors
        setError(state) {
            state.status = 'failed';
        }
    },
});

export const { setLoading, setDashboardState, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;