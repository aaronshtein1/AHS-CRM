import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let bodyText = await req.text();
    let payload: any = {};

    try {
      payload = JSON.parse(bodyText);
    } catch {
      // If form-urlencoded from Jotform, parse params
      const params = new URLSearchParams(bodyText);
      payload = Object.fromEntries(params.entries());
    }

    if (payload && typeof payload.rawRequest === 'string') {
      try {
        const raw = JSON.parse(payload.rawRequest);
        payload = { ...payload, ...raw };
      } catch {}
    }

    const submissionId = String(
      payload?.submissionID || payload?.id || payload?.formID || `JS-${Date.now()}`
    );

    console.log(`[Next.js Jotform Webhook] Received Submission ID: ${submissionId}`);

    // Forward to backend ingestion server as well
    try {
      await fetch('https://intake-crm-dusky.vercel.app/api/packets/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (fwdErr) {
      console.warn('[Next.js Webhook Forwarding Warning]', fwdErr);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Jotform submission received cleanly by CRM App.',
      jotformSubmissionId: submissionId,
      receivedAt: new Date().toISOString()
    }, { status: 201 });
  } catch (err: any) {
    console.error('[Next.js Webhook Error]', err);
    return NextResponse.json({ error: 'Failed to process Jotform submission', details: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/packets/intake',
    message: 'Jotform webhook listener is live and ready.'
  });
}
