import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RegimeResultado } from '../types';

interface ComparisonChartProps {
  data: RegimeResultado[];
  isExporting?: boolean;
  theme: 'light' | 'dark';
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value}`;
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md">
        <p className="font-bold text-gray-800 dark:text-white">{label}</p>
        <p className="text-indigo-500">{`Imposto: ${payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
      </div>
    );
  }

  return null;
};


const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, isExporting = false, theme }) => {
  const chartData = data.map(item => ({
    name: item.regime.replace(' ', '\n'),
    imposto: item.impostoEstimado
  }));

  const axisColor = theme === 'dark' ? '#9CA3AF' : '#4B5563';
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
       <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Comparativo Visual de Impostos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 5, right: 20, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }} />
          <YAxis stroke={axisColor} tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(128, 90, 213, 0.1)'}} />
          <Legend />
          <Bar dataKey="imposto" name="Imposto Estimado (R$)" fill="#818CF8" isAnimationActive={!isExporting} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;