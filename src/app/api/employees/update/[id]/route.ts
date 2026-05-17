import { NextRequest, NextResponse } from 'next/server';
import { PUT as originalPUT } from '../[id]/route';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<any> }
) {
  return originalPUT(request, context);
}
export async function POST(
  request: NextRequest,
  context: { params: Promise<any> }
) {
  return originalPUT(request, context);
}
