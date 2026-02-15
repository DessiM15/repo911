import { NextResponse } from 'next/server';

export function apiSuccess(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  message: string,
  status = 400,
  details?: unknown,
  headers?: Record<string, string>
) {
  const body: Record<string, unknown> = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status, headers });
}
