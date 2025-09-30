// frontend/src/components/panels/AgentStatusPanel.tsx
'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function AgentStatusPanel() {
  const { latestAgentRun } = useSelector((state: RootState) => state.dashboard);

  if (!latestAgentRun) {
    return (
      <div className="zone-card mt-4">
        <h4 className="text-lg font-bold text-cyan-400 mb-2">🤖 AI Agent Status</h4>
        <p className="text-gray-400">Awaiting first simulation run...</p>
      </div>
    );
  }

  const { anomalies, decision, final_verdict } = latestAgentRun;
  const isApproved = final_verdict?.startsWith('APPROVE');

  return (
    <div className="zone-card mt-4">
      <h4 className="text-lg font-bold text-cyan-400 mb-2">🤖 AI Agent Status</h4>
      <div className="space-y-3">
        <div>
          <h5 className="font-semibold text-gray-300">Anomalies Detected</h5>
          <p className="text-sm text-orange-400 bg-gray-800 p-2 rounded">
            {anomalies?.anomalies.join(', ') || 'None'}
          </p>
        </div>
        <div>
          <h5 className="font-semibold text-gray-300">Agent Decision</h5>
          <p className="text-sm text-blue-300 bg-gray-800 p-2 rounded">
            {decision?.decision || 'N/A'}
          </p>
        </div>
        <div>
          <h5 className="font-semibold text-gray-300">LLM Judge Verdict</h5>
          <div className={`text-sm p-2 rounded ${isApproved ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
            <span className="font-bold">{isApproved ? '✅ APPROVED' : '❌ REJECTED'}:</span> {final_verdict?.split(': ')[1] || ''}
          </div>
        </div>
      </div>
    </div>
  );
}