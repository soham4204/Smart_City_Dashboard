'use client';

import { useState } from 'react';
import { SlidersHorizontal, BarChart3, FileText } from 'lucide-react';
import ZoneControlPanel from '../panels/ZoneControlPanel';
import LiveAnalysisPanel from '../panels/LiveAnalysisPanel';
import AgentLogPanel from '../panels/AgentLogPanel';

const TABS = [
  { id: 'analysis', name: 'Live Analysis', icon: BarChart3 },
  { id: 'config', name: 'Configuration', icon: SlidersHorizontal },
  { id: 'logs', name: 'Event Logs', icon: FileText },
];

export default function AnalysisHub() {
  const [activeTab, setActiveTab] = useState('analysis');

  const renderContent = () => {
    switch (activeTab) {
      case 'analysis':
        return <LiveAnalysisPanel />;
      case 'config':
        return <ZoneControlPanel />;
      case 'logs':
        return <AgentLogPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl border border-gray-700 shadow-2xl backdrop-blur-lg flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/80 px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-900/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-t-lg'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}