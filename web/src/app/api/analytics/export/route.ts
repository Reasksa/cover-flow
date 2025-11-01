import { prisma } from '../../../../lib/prisma';

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
    include: { link: true },
  });

  let csv = 'date,link_title,link_url,device,referrer,clicks\n';
  for (const a of analytics) {
    const date = a.date.toISOString();
    const linkTitle = a.link?.title ?? '';
    const linkUrl = a.link?.url ?? '';
    const device = a.device ?? '';
    const referrer = a.referrer ?? '';
    csv += `${date},${JSON.stringify(linkTitle)},${JSON.stringify(linkUrl)},${device},${JSON.stringify(referrer)},${a.clicks}\n`;
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics_${range}d.csv"`,
    },
  });
}