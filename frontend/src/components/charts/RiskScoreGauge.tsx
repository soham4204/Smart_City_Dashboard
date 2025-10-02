'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface RiskScoreGaugeProps {
  score: number;
}

const getRiskColor = (score: number) => {
  if (score >= 80) return '#ef4444'; // Red
  if (score >= 60) return '#f97316'; // Orange
  if (score >= 40) return '#facc15'; // Yellow
  return '#22c55e'; // Green
};

export default function RiskScoreGauge({ score }: RiskScoreGaugeProps) {
  const color = getRiskColor(score);
  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#374151" /> 
            <Label
              value={`${score}`}
              position="center"
              dy={-10}
              className="text-4xl font-bold"
              style={{ fill: color, textAnchor: 'middle' }}
            />
            <Label
              value="Risk Score"
              position="center"
              dy={20}
              className="text-sm"
              style={{ fill: '#9ca3af', textAnchor: 'middle' }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}