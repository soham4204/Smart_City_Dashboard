'use client';

import { useState, useEffect } from 'react';

export default function AgentLogPanel() {
  const [logs, setLogs] = useState('Loading logs...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/agent/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs from the server.');
        }
        const data = await response.json();
        setLogs(data.logs);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        setLogs('Could not load logs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh logs every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-300 mb-4">Live Event Log</h3>
      {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}
      <pre className="w-full h-96 overflow-y-auto bg-gray-900/70 p-4 rounded-lg border border-gray-700 text-xs text-gray-300 whitespace-pre-wrap">
        {isLoading ? 'Loading logs...' : logs}
      </pre>
    </div>
  );
}