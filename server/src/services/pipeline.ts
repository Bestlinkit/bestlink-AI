import { CodeBuilder } from '../agents/CodeBuilder';

export enum AgentModels {
  BUILDER = 'deepseek/deepseek-chat',
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
    }, 3000);

    const builder = new CodeBuilder();
    let finalStatus = 'failed';
    
    const globalTimeout = setTimeout(() => {
      onProgress('EXECUTION_ERROR', { message: 'Maximum execution time exceeded (120s). Pipeline aborted.' });
      activeExecutions.delete(sessionId);
    }, 120000);

    try {
      onProgress('BUILD_START', { message: 'Initializing high-speed production studio...' });

      // Simulated streaming feedback for UX while the single LLM request runs
      setTimeout(() => onProgress('PLANNING_PROJECT', { message: 'Planning website structure...' }), 1500);
      setTimeout(() => onProgress('GENERATING_FILES', { message: 'Generating responsive components...' }), 6000);
      setTimeout(() => onProgress('VALIDATING_OUTPUT', { message: 'Applying premium UI/UX styles...' }), 12000);
      setTimeout(() => onProgress('FINALIZING_PROJECT', { message: 'Finalizing project files...' }), 18000);

      // Single-pass generation
      const codebasePayload = await withTimeout(builder.build(prompt, AgentModels.BUILDER), 90000, 'Building');
      
      if (codebasePayload.error) {
        throw new Error(codebasePayload.error);
      }
      
      onProgress('FINALIZING_PROJECT', { message: 'Rendering preview...' });
      
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
      
      onProgress('COMPLETE', { 
        status: finalStatus,
        message: 'Pipeline execution finalized.' 
      });
    }
  }
};
