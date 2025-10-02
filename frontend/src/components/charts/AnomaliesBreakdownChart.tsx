'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnomaliesBreakdownChartProps {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#facc15',
  low: '#3b82f6',
};

export default function AnomaliesBreakdownChart({ data }: AnomaliesBreakdownChartProps) {
  const chartData = [
    { name: 'Critical', count: data.critical, fill: SEVERITY_COLORS.critical },
    { name: 'High', count: data.high, fill: SEVERITY_COLORS.high },
    { name: 'Medium', count: data.medium, fill: SEVERITY_COLORS.medium },
    { name: 'Low', count: data.low, fill: SEVERITY_COLORS.low },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            contentStyle={{
              background: '#1f2937',
              borderColor: '#4b5563',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}