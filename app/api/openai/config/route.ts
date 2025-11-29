import { NextResponse } from "next/server";

export async function GET() {
  const hasEnvKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0;
  return NextResponse.json({ hasEnvKey });
}


