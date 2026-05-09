import { NextRequest, NextResponse } from 'next/server';
import { PlannerAgent } from '@/agents/Planner';
import { CodeBuilderAgent } from '@/agents/CodeBuilder';

export const runtime = 'nodejs'; // Use nodejs runtime for streaming

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (stage: string, data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ stage, data })}\n\n`));
  };

  // Immediate start
  (async () => {
    try {
      await sendEvent('BUILD_START', { message: 'Inference engine online. Mapping production strategy...' });

      // PHASE 1: PLANNING
      await sendEvent('PLANNING_PROJECT', { message: 'DeepSeek is orchestrating the architecture...' });
      const planner = new PlannerAgent();
      const plan = await planner.plan(prompt);
      
      await sendEvent('SELECTING_TEMPLATE', { 
        message: 'Project roadmap locked. Selecting structural components...',
        plan 
      });

      // PHASE 2: CONSTRUCTION
      await sendEvent('GENERATING_FILES', { message: 'Gemini Flash is forging the codebase...' });
      const builder = new CodeBuilderAgent();
      const payload = await builder.build(prompt, plan);

      await sendEvent('FINALIZING_PROJECT', { 
        message: 'Assembling atomic components and styling...',
        payload 
      });

      await sendEvent('COMPLETED_PROJECT', { 
        message: 'Production complete. Deploying to virtual workspace...',
        payload 
      });

      await sendEvent('COMPLETED', { message: 'Success.' });
    } catch (error: any) {
      console.error('Pipeline failure:', error);
      await sendEvent('EXECUTION_ERROR', { message: error.message || 'System engine failure.' });
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
