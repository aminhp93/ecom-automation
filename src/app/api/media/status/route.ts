import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    gemini: !!process.env.GEMINI_API_KEY,
    fal: !!process.env.FAL_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  });
}
