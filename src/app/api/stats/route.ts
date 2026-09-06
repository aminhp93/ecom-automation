import { NextResponse } from 'next/server';
import { ecomStore } from '@/lib/db/store';
import { aiRouter } from '@/lib/ai/router';

export async function GET() {
  const stats = ecomStore.getStats();
  const providers = aiRouter.getActiveProviders();

  return NextResponse.json({
    success: true,
    stats,
    providers,
  });
}
