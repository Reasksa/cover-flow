import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const themes = await prisma.theme.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(themes);
}