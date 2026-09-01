import { NextRequest, NextResponse } from 'next/server';
import { POST as handlePacketsPost, GET as handlePacketsGet } from '../packets/intake/route';

export async function POST(req: NextRequest) {
  return handlePacketsPost(req);
}

export async function GET() {
  return handlePacketsGet();
}
