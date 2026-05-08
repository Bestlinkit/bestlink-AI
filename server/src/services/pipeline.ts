import { ProjectAnalyzer } from '../agents/ProjectAnalyzer';
import { UIArchitect } from '../agents/UIArchitect';
import { CodeBuilder } from '../agents/CodeBuilder';

export enum AgentModels {
  LOGIC = 'deepseek/deepseek-r1:free',
  DESIGN = 'qwen/qwen-2.5-coder-32b-instruct',
  CODE = 'deepseek/deepseek-chat',
}

export const pipelineService = {
  async runFullPipeline(prompt: string, onProgress: (stage: string, data?: any) => void) {
    const analyzer = new ProjectAnalyzer();
    const architect = new UIArchitect();
    const builder = new CodeBuilder();

    try {
      // Stage 1: Analyze
      onProgress('ANALYZING', { message: 'DeepSeek R1 is architecting the project manifest...' });
      const manifest = await analyzer.analyze(prompt);
      onProgress('ANALYZED', manifest);

      // Stage 2: Design UI
      onProgress('DESIGNING', { message: 'Qwen is defining the UI structure using the Design System...' });
      let uiPlan = "";
      for await (const chunk of architect.design(manifest, AgentModels.DESIGN)) {
        if (chunk.choices?.[0]?.delta?.content) {
          uiPlan += chunk.choices[0].delta.content;
        }
      }
      onProgress('DESIGNED', { plan: uiPlan });

      // Stage 3: Build Code
      onProgress('BUILDING', { message: 'CodeBuilder is generating production-ready Next.js code...' });
      for await (const chunk of builder.generatePage(manifest, manifest.pages[0]?.name || 'Home', AgentModels.CODE)) {
        onProgress('STREAMING_CODE', chunk);
      }

      onProgress('COMPLETED');
    } catch (error) {
      console.error('Pipeline Error:', error);
      onProgress('ERROR', { message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
};
