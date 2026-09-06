import { NextRequest } from 'next/server';
import { runProductValidationWorkflow } from '@/lib/workflows/stage02-validation';
import { runCompetitorResearchWorkflow } from '@/lib/workflows/stage03-competitor';
import { runSupplierValidationWorkflow } from '@/lib/workflows/stage04-supplier';
import { runOfferCreationWorkflow } from '@/lib/workflows/stage05-offer';
import { runCreativeProductionWorkflow } from '@/lib/workflows/stage06-creative';
import { WorkflowEvent } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { productId, stage } = body;

  if (!productId || !stage) {
    return new Response(JSON.stringify({ error: 'Missing productId or stage' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: WorkflowEvent) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error('Error sending SSE chunk:', e);
        }
      };

      try {
        if (stage === '02') {
          await runProductValidationWorkflow({ productId, onEvent: sendEvent });
        } else if (stage === '03') {
          await runCompetitorResearchWorkflow({ productId, onEvent: sendEvent });
        } else if (stage === '04') {
          await runSupplierValidationWorkflow({ productId, onEvent: sendEvent });
        } else if (stage === '05') {
          await runOfferCreationWorkflow({ productId, onEvent: sendEvent });
        } else if (stage === '06' || stage === '07') {
          await runCreativeProductionWorkflow({ productId, onEvent: sendEvent });
        } else {
          throw new Error(`Unsupported stage: ${stage}`);
        }
      } catch (err: any) {
        sendEvent({
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          stage: `STAGE_${stage}`,
          message: `Lỗi thực thi: ${err?.message || 'Unknown error'}`,
        });
      } finally {
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
