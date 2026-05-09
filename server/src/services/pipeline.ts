import { CodeBuilder } from '../agents/CodeBuilder';
import { Planner } from '../agents/Planner';

export enum AgentModels {
  PLANNER = 'deepseek/deepseek-chat',
  BUILDER = 'google/gemini-2.0-flash-001',
  FALLBACK = 'qwen/qwen-2.5-coder-32b-instruct'
}

const activeExecutions = new Set<string>();

const withTimeout = <T>(promise: Promise<T>, ms: number, stageName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout exceeded for stage: ${stageName} (${ms}ms)`));
    }, ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const pipelineService = {
  async runFullPipeline(prompt: string, onProgress: (stage: string, data?: any) => void, sessionId: string = 'global') {
    
    if (activeExecutions.has(sessionId)) {
      onProgress('EXECUTION_ERROR', { message: 'System is currently processing a build. Please wait.' });
      return;
    }
    activeExecutions.add(sessionId);

    const heartbeat = setInterval(() => {
      onProgress('[KEEP-ALIVE]');
    }, 5000);

    const planner = new Planner();
    const builder = new CodeBuilder();
    let finalStatus = 'failed';
    
    const globalTimeout = setTimeout(() => {
      onProgress('EXECUTION_ERROR', { message: 'Maximum execution time exceeded. Pipeline aborted.' });
      activeExecutions.delete(sessionId);
    }, 180000);

    try {
      onProgress('BUILD_START', { message: 'Initializing high-speed production studio...' });

      // STEP 1: Planning
      onProgress('PLANNING_PROJECT', { message: 'Strategizing architecture and design system...' });
      const plan = await planner.plan(prompt);
      onProgress('SELECTING_TEMPLATE', { 
        message: `Plan finalized: ${plan.title}`,
        plan 
      });

      // STEP 2: Building
      onProgress('GENERATING_FILES', { message: 'Generating premium responsive components...' });
      
      const buildPrompt = `Build this project:
      TITLE: ${plan.title}
      TYPE: ${plan.type}
      SECTIONS: ${plan.architecture.sections.join(', ')}
      DESIGN: ${plan.design.colorSystem} palette, ${plan.design.typography} typography, ${plan.design.aesthetic} aesthetic.
      TECH: ${plan.technical.framework} with ${plan.technical.libraries.join(', ')}.
      
      ORIGINAL USER REQUEST: "${prompt}"`;

      const codebasePayload = await withTimeout(builder.build(buildPrompt, AgentModels.BUILDER), 120000, 'Building');
      
      if (codebasePayload.error) {
        throw new Error(codebasePayload.error);
      }
      
      onProgress('FINALIZING_PROJECT', { message: 'Assembling Virtual File System...' });
      
      finalStatus = 'success';
      onProgress('COMPLETED_PROJECT', { 
        status: finalStatus,
        message: 'Project generation successful.',
        payload: codebasePayload
      });

    } catch (error) {
      console.error('Pipeline Execution Failed:', error);
      onProgress('EXECUTION_ERROR', { 
        message: 'The AI engine encountered a critical error.',
        error: error instanceof Error ? error.message : 'Unknown pipeline error'
      });
      finalStatus = 'error';
    } finally {
      clearInterval(heartbeat);
      clearTimeout(globalTimeout);
      activeExecutions.delete(sessionId);
      
      onProgress('COMPLETED', { 
        status: finalStatus,
        message: 'Pipeline execution finalized.' 
      });
    }
  }
};
