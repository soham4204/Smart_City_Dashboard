'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import RiskScoreGauge from '../charts/RiskScoreGauge';
import AnomaliesBreakdownChart from '../charts/AnomaliesBreakdownChart';

export default function LiveAnalysisPanel() {
  const { latestAgentRun } = useSelector((state: RootState) => state.dashboard);

  if (!latestAgentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
        <div className="animate-pulse text-4xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold">Awaiting Agent Simulation</h3>
        <p className="text-sm">Trigger a weather scenario from the sidebar to begin analysis.</p>
      </div>
    );
  }

  // With the updated types, these are now correctly typed and safe to access.
  const { anomaly_assessment, decision_analysis, final_verdict } = latestAgentRun;

  if (!anomaly_assessment || !decision_analysis) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="animate-pulse text-4xl mb-4">💾</div>
            <h3 className="text-lg font-semibold">Processing Data...</h3>
            <p className="text-sm">Waiting for complete analysis from the agent pipeline.</p>
      </div>
    );
  }
  
  const isApproved = final_verdict?.startsWith('APPROVE');
  const riskScore = decision_analysis.comprehensive_risk_score || 0;
  const severityBreakdown = anomaly_assessment.detection_metadata.severity_breakdown;

  return (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-2xl font-bold text-cyan-300">Latest Agent Run Analysis</h3>
        
        {/* Visualizations Section */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-center text-gray-400 mb-2">Comprehensive Risk</h4>
                <RiskScoreGauge score={riskScore} />
            </div>
             <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                 <h4 className="text-sm font-semibold text-center text-gray-400 mb-2">Anomalies by Severity</h4>
                <AnomaliesBreakdownChart data={severityBreakdown} />
            </div>
        </div>

        {/* Anomaly and Decision Section */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
             <h5 className="font-semibold text-gray-300 mb-2">Anomaly Detection Summary</h5>
             <p className="text-sm text-orange-300">
                {anomaly_assessment.summary || 'No summary available.'}
             </p>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h5 className="font-semibold text-gray-300 mb-2">Top Recommendation</h5>
            <p className="text-sm text-blue-300">
                {decision_analysis.operational_recommendations?.[0] || 'Maintain normal operations.'}
            </p>
        </div>

        {/* LLM Judge Verdict */}
        <div>
          <h5 className="font-semibold text-gray-300 mb-2">LLM Judge Verdict</h5>
          <div className={`text-sm p-4 rounded-lg border ${
            isApproved 
              ? 'bg-green-900/30 text-green-300 border-green-700' 
              : 'bg-red-900/30 text-red-300 border-red-700'
          }`}>
            <span className="font-bold flex items-center gap-2">
                {isApproved ? '✅ APPROVED' : '✅ APPROVED'}:
            </span>
            <p className="mt-1 pl-1">
                {final_verdict?.split(': ')[1] || 'No justification provided.'}
            </p>
          </div>
        </div>
    </div>
  );
}
