import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

function dateFromRange(range: string): Date {
  const now = new Date();
  const map: Record<string, number> = { '7': 7, '30': 30, '90': 90 };
  const days = map[range] ?? 7;
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return start;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '7';
  const start = dateFromRange(range);

  const analytics = await prisma.analytic.findMany({
    where: { date: { gte: start } },
    orderBy: { date: 'asc' },
  });

  // Aggregate by date (day), device, referrer
  const summary = {
    totalClicks: analytics.reduce((acc, a) => acc + a.clicks, 0),
    byDay: {} as Record<string, number>,
    byDevice: {} as Record<string, number>,
    byReferrer: {} as Record<string, number>,
  };

  for (const a of analytics) {
    const day = a.date.toISOString().slice(0, 10);
    summary.byDay[day] = (summary.byDay[day] ?? 0) + a.clicks;
    if (a.device) summary.byDevice[a.device] = (summary.byDevice[a.device] ?? 0) + a.clicks;
    if (a.referrer) summary.byReferrer[a.referrer] = (summary.byReferrer[a.referrer] ?? 0) + a.clicks;
  }

  return NextResponse.json(summary);
}