'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartEntry {
  name: string;
  revenue: number;
}

interface Props {
  data: ChartEntry[];
}

export function RevenueBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2C323E" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#9E9990', fontSize: 12, fontFamily: 'Assistant' }}
          axisLine={{ stroke: '#2C323E' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9E9990', fontSize: 12, fontFamily: 'Assistant' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: '#141820',
            border: '1px solid #2C323E',
            borderRadius: 8,
            fontFamily: 'Assistant',
            color: '#EDE9E1',
            fontSize: 13,
          }}
          formatter={(value) => [`${Number(value).toLocaleString('he-IL')} \u20AA`, 'הכנסה']}
          cursor={{ fill: 'rgba(201,150,74,0.06)' }}
        />
        <Bar
          dataKey="revenue"
          fill="url(#goldGrad)"
          radius={[4, 4, 0, 0]}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B94A" />
            <stop offset="100%" stopColor="#9E7C3A" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
