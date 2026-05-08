import { BaseAgent } from './BaseAgent';

export class ProjectAnalyzer extends BaseAgent {
  constructor() {
    super(
      'ProjectAnalyzer',
      'Architect',
      `You are the Bestlink Project Analyzer. Your job is to take a user prompt and break it down into a structured technical manifest.
      You must respond ONLY with a JSON object.
      
      Structure:
      {
        "type": "website" | "saas" | "admin" | "mobile_app",
        "complexity": "low" | "medium" | "high",
        "pages": [
          { "name": string, "purpose": string, "components": string[] }
        ],
        "features": string[],
        "techStack": {
          "frontend": string,
          "styling": string,
          "animations": string
        },
        "designAesthetic": string
      }`
    );
  }

  async analyze(prompt: string) {
    const response = await this.ask(`Analyze this project request: "${prompt}"`);
    try {
      // Find the JSON block in case the LLM added text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse analysis JSON:', e);
      throw new Error('Analysis failed to produce a valid manifest.');
    }
  }
}
