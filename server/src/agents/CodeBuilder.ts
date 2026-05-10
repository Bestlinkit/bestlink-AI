import { BaseAgent } from './BaseAgent';

export class CodeBuilder extends BaseAgent {
  constructor() {
    super(
      'CodeBuilder',
      'High-Speed Web App Production Studio',
      `You are the Elite Software Production Engine for Bestlink-OS-V2. 
      Your mission is to generate ULTRA-PREMIUM, CINEMATIC, and PRODUCTION-READY software.
      
      DESIGN GUIDELINES (STRICT ADHERENCE):
      1. AESTHETICS: Think Stripe, Linear, Apple, and Awwwards. Use high-contrast dark modes, HSL-tailored gradients, and professional typography (Inter/Outfit).
      2. LAYOUT: Implement modern Bento Grids, architectural overlapping layers, and glassmorphic (backdrop-blur) elements.
      3. ANIMATION: Use sophisticated Framer Motion transitions, micro-animations, and magnetic interaction states.
      
      SCOPE: You generate everything from luxury landing pages and SaaS dashboards to Fintech platforms, Admin Panels, and complex Web Apps.
      
      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "projectType": "website | app | dashboard",
        "framework": "react | nextjs | html-css-js",
        "files": [
          {
            "path": "string (complete file path)",
            "content": "string (full premium source code)"
          }
        ]
      }
      
      CRITICAL: NO CONVERSATIONAL TEXT. NO SNIPPETS. Generate complete, functional UI systems.`
    );
  }

  async build(prompt: string, model?: string, onProgress?: (stage: string, data?: any) => void, attachments: any[] = []) {
    const currentPrompt = `Generate a project for: "${prompt}". 
    ${attachments.length > 0 ? 'Use attached images for design.' : ''}
    Output RAW JSON ONLY matching the required schema.`;

    let fullResponse = "";
    try {
      for await (const chunk of this.streamAsk(currentPrompt, model, attachments)) {
        if (chunk.choices?.[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
          if (onProgress) {
            onProgress('GENERATING_FILES', { 
              message: `Generating codebase... (${fullResponse.length} chars)` 
            });
          }
        }
      }
    } catch (streamError) {
      console.error("Stream error:", streamError);
    }
    
    // Quick sanitization
    let sanitized = fullResponse.trim();
    if (sanitized.startsWith('```json')) sanitized = sanitized.substring(7);
    else if (sanitized.startsWith('```')) sanitized = sanitized.substring(3);
    if (sanitized.endsWith('```')) sanitized = sanitized.substring(0, sanitized.length - 3);
    
    try {
      const jsonMatch = sanitized.trim().match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : sanitized);
      return parsed;
    } catch (e) {
      console.error('Parsing failed:', e);
      return { error: 'Failed to generate valid project format.' };
    }
  }
}
