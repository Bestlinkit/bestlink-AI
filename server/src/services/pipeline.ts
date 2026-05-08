import { openRouterService } from './openrouter';

export enum AgentType {
  ANALYZER = 'deepseek/deepseek-r1:free',
  ARCHITECT = 'qwen/qwen2.5-coder-32b-instruct:free',
  BUILDER = 'deepseek/deepseek-chat-v3-0324:free',
  POLISH = 'deepseek/deepseek-chat-v3-0324:free'
}

export interface ProjectManifest {
  type: string;
  pages: string[];
  modules: string[];
  style: string;
  complexity: string;
}

export const pipelineService = {
  async runFullPipeline(prompt: string, onProgress: (stage: string, data?: any) => void) {
    try {
      // Stage 1: Analyze
      onProgress('ANALYZING', { message: 'DeepSeek R1 is architecting the project manifest...' });
      const analysisPrompt = `Analyze this project request and return a JSON manifest: "${prompt}". 
      Respond ONLY with JSON matching this structure: { "type": string, "pages": string[], "modules": string[], "style": string, "complexity": string }`;
      
      let manifest: ProjectManifest;
      let manifestText = "";
      await openRouterService.streamChat(
        [{ role: 'user', content: analysisPrompt }],
        AgentType.ANALYZER,
        {},
        (chunk) => {
          if (chunk.choices?.[0]?.delta?.content) {
            manifestText += chunk.choices[0].delta.content;
          }
        }
      );
      
      // Extract JSON from potential markdown
      const jsonMatch = manifestText.match(/\{[\s\S]*\}/);
      manifest = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      onProgress('ANALYZED', manifest);

      // Stage 2: Design UI
      onProgress('DESIGNING', { message: 'Qwen is defining the UI structure using the Design System...' });
      const architectPrompt = `As a UI Architect, define the layout for a ${manifest.type} with style "${manifest.style}". 
      Project pages: ${manifest.pages.join(', ')}. 
      Modules: ${manifest.modules.join(', ')}.
      Reference the Bestlink Design System (Button, Card, Hero, Grid).
      Output a structured layout plan without code.`;
      
      let uiPlan = "";
      await openRouterService.streamChat(
        [{ role: 'user', content: architectPrompt }],
        AgentType.ARCHITECT,
        {},
        (chunk) => {
          if (chunk.choices?.[0]?.delta?.content) {
            uiPlan += chunk.choices[0].delta.content;
          }
        }
      );
      onProgress('DESIGNED', { plan: uiPlan });

      // Stage 3: Build Code
      onProgress('BUILDING', { message: 'DeepSeek is generating production-ready Next.js code...' });
      const builderPrompt = `As a Lead Developer, convert this UI plan into production-ready Next.js 15 code.
      UI Plan: ${uiPlan}
      Rules:
      - Use TailwindCSS v4.
      - Use Framer Motion for animations.
      - Follow modular component architecture.
      - Use the project manifest: ${JSON.stringify(manifest)}.
      - Provide full file structures.`;

      await openRouterService.streamChat(
        [{ role: 'user', content: builderPrompt }],
        AgentType.BUILDER,
        {},
        (chunk) => {
          onProgress('STREAMING_CODE', chunk);
        }
      );

      onProgress('COMPLETED');
    } catch (error) {
      console.error('Pipeline Error:', error);
      onProgress('ERROR', { message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
};
