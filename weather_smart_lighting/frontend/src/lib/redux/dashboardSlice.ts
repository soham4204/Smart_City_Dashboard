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

// --- Detailed Type Definitions for the Agent's Output ---

interface Anomaly {
    type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AnomalyAssessment {
    system_status: string;
    anomalies_detected: Anomaly[];
    summary: string;
    recommended_actions: string[];
    alert_level: string;
    monitoring_priority: string;
    detection_metadata: {
        total_anomalies: number;
        severity_breakdown: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    };
}

interface DecisionAnalysis {
    comprehensive_risk_score: number;
    risk_level: string;
    operational_recommendations: string[];
    decision_confidence: number;
    final_verdict?: string; // can appear here, but also at top level
}

// Full structure of the 'agentResult' payload
interface AgentResult {
    anomaly_assessment: AnomalyAssessment;
    decision_analysis: DecisionAnalysis;
    final_verdict: string;
    // If the backend sends extra top-level keys, add them here
}

// --- Dashboard State ---

interface DashboardState {
    zones: Zone[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    latestAgentRun: AgentResult | null;
}

const initialState: DashboardState = {
    zones: [],
    status: 'idle',
    latestAgentRun: null,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setLoading(state) {
            state.status = 'loading';
        },
        // Payload includes both zones and optional agentResult
        setDashboardState(state, action: PayloadAction<{ zones: Zone[]; agentResult?: AgentResult }>) {
            state.zones = action.payload.zones;
            if (action.payload.agentResult) {
                state.latestAgentRun = action.payload.agentResult;
            }
            state.status = 'succeeded';
        },
        setError(state) {
            state.status = 'failed';
        },
    },
});

export const { setLoading, setDashboardState, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
