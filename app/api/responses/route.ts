import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  const dashKey = process.env.DASHBOARD_KEY;
  if (!dashKey) {
    return NextResponse.json({ error: 'DASHBOARD_KEY not set' }, { status: 500 });
  }
  if (key !== dashKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('propvest-survey');
    const responses = await db
      .collection('responses')
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    return NextResponse.json(responses);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
