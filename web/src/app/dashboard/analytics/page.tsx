'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Summary = {
  totalClicks: number;
  byDay: Record<string, number>;
  byDevice: Record<string, number>;
  byReferrer: Record<string, number>;
};

const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('7');
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`/api/analytics/summary?range=${range}`).then(async (r) => {
      const data = await r.json();
      setSummary(data);
    });
  }, [range]);

  const dayData = summary
    ? Object.entries(summary.byDay).map(([date, clicks]) => ({ date, clicks }))
    : [];

  const deviceData = summary
    ? Object.entries(summary.byDevice).map(([device, clicks]) => ({ device, clicks }))
    : [];

  const referrerData = summary
    ? Object.entries(summary.byReferrer).map(([referrer, clicks]) => ({ referrer, clicks }))
    : [];

  const exportCsv = () => {
    window.location.href = `/api/analytics/export?range=${range}`;
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="mt-2 text-gray-600">Total Clicks: {summary?.totalClicks ?? 0}</div>

      <div className="mt-4 flex gap-2">
        {(['7', '30', '90'] as const).map((r) => (
          <button
            key={r}
            className={`rounded border px-3 py-1 ${range === r ? 'bg-primary text-white' : ''}`}
            onClick={() => setRange(r)}
          >
            {r} days
          </button>
        ))}
        <button className="ml-auto rounded bg-primary px-3 py-1 text-white" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Clicks over time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Device breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={deviceData} dataKey="clicks" nameKey="device" cx="50%" cy="50%" outerRadius={100} label>
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border p-4 lg:col-span-2">
          <h2 className="font-semibold mb-2">Top referrers</h2>
          <ul className="space-y-2">
            {referrerData.map((r) => (
              <li key={r.referrer} className="flex justify-between">
                <span className="text-gray-700">{r.referrer || 'Direct'}</span>
                <span className="font-semibold">{r.clicks}</span>
              </li>
            ))}
            {referrerData.length === 0 && <li className="text-gray-500">No data</li>}
          </ul>
        </div>
      </div>
    </main>
  );
}