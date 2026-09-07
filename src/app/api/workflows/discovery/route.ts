import { NextRequest } from 'next/server';
import { runProductDiscoveryWorkflow } from '@/lib/workflows/stage01-discovery';
import { WorkflowEvent } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const niche = body.niche || 'Baby Products';
  const sources = body.sources || ['tiktok', 'meta_ads', 'amazon', 'aliexpress'];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Keep-alive heartbeat ping every 5 seconds to prevent connection drops during AI reasoning
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 5000);

      const sendEvent = (event: WorkflowEvent) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error('Error sending SSE chunk:', e);
        }
      };

      try {
        await runProductDiscoveryWorkflow({
          niche,
          sources,
          onEvent: (evt) => sendEvent(evt),
        });
      } catch (err: any) {
        sendEvent({
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          stage: '01_PRODUCT_DISCOVERY',
          message: `Lỗi thực thi: ${err?.message || 'Unknown error'}`,
        });
      } finally {
        clearInterval(pingInterval);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
