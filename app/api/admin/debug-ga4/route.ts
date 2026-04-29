import { NextResponse } from 'next/server';

export async function GET() {
  const pid = process.env.GA4_PROPERTY_ID;
  const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  let credValid = false;
  let credError = '';
  try {
    if (cred) { JSON.parse(cred); credValid = true; }
  } catch (e: any) { credError = e.message; }

  return NextResponse.json({
    GA4_PROPERTY_ID: pid || 'NOT SET',
    GOOGLE_CREDS_LENGTH: cred?.length || 0,
    GOOGLE_CREDS_VALID_JSON: credValid,
    GOOGLE_CREDS_ERROR: credError,
    GOOGLE_CREDS_STARTS: cred?.slice(0, 30) || 'empty',
  });
}
