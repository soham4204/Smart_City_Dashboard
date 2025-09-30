// frontend/src/lib/redux/dashboardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// --- Define the types for our data ---

interface LightPole {
    id: string;
    location: [number, number];
    brightness: number;
    status: string;
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

// --- NEW: Type definition for the agent's output ---
interface AgentResult {
  anomalies?: { anomalies: string[] };
  decision?: { decision: string };
  final_verdict?: string;
}

// --- MODIFIED: The main state now includes a property for the latest agent run ---
interface DashboardState {
    zones: Zone[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    latestAgentRun: AgentResult | null;
}

const initialState: DashboardState = {
    zones: [],
    status: 'idle',
    latestAgentRun: null, // Initialize the new property
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setLoading(state) {
            state.status = 'loading';
        },
        // --- MODIFIED: The payload is now an object with zones and an optional agentResult ---
        setDashboardState(state, action: PayloadAction<{ zones: Zone[], agentResult?: AgentResult }>) {
            state.zones = action.payload.zones;
            // If the payload from the websocket includes agent results, update that state too
            if (action.payload.agentResult) {
                state.latestAgentRun = action.payload.agentResult;
            }
            state.status = 'succeeded';
        },
        setError(state) {
            state.status = 'failed';
        }
    },
});

export const { setLoading, setDashboardState, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;