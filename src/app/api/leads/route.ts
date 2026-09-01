import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch('https://intake-crm-dusky.vercel.app/api/leads', {
      headers: { 'User-Agent': 'AHS-CRM-Frontend/2.0' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Leads Proxy Error]', err);
    return NextResponse.json({ total: 0, leads: [] });
  }
}
