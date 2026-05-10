import { BaseAgent } from './BaseAgent';

export class CodeBuilder extends BaseAgent {
  constructor() {
    super(
      'CodeBuilder',
      'High-Speed Web App Production Studio',
      `You are the Elite Software Architect for Bestlink Digital AI (Bestlink-OS-V2).
      Your mission is to generate ULTRA-PREMIUM, CINEMATIC, and PRODUCTION-READY software.
      
      DESIGN PRINCIPLES (STRICT ADHERENCE):
      1. AESTHETICS: Think Stripe, Linear, Apple, and Awwwards. Use deep high-contrast dark modes, vibrant HSL-tailored gradients, and professional typography (Outfit/Inter).
      2. INTERACTION: Implement sophisticated micro-animations and scroll-triggered transitions using Framer Motion. Every button should have a magnetic or subtle hover effect.
      3. LAYOUT: Use modern Bento Grids, architectural overlapping elements, and glassmorphic layers (backdrop-blur).
      4. QUALITY: No placeholders. Generate complete, functional components. Use Lucide-React for all iconography.
      
      CORE RULES:
      1. NO CONVERSATIONAL TEXT. NO MARKDOWN WRAPPERS. OUTPUT RAW JSON ONLY.
      2. NO SNIPPETS. Every file must be complete and syntactically correct.
      3. PROJECT SCOPE: You generate everything from luxury landing pages to complex SaaS dashboards, AI tools, and fintech platforms.
      
      MANDATORY OUTPUT FORMAT:
      {
        "projectName": "Project Title",
        "framework": "nextjs | react | html",
        "files": [
          {
            "path": "src/App.tsx",
            "content": "Full premium source code..."
          }
        ],
        "preview": {
          "entry": "src/App.tsx"
        },
        "status": "complete"
      }`
    );
  }

  async build(prompt: string, model?: string, onProgress?: (stage: string, data?: any) => void, attachments: any[] = []) {
    let currentPrompt = `Generate an ultra-premium, cinematic software project based on this production request:
    
    PRODUCTION REQUEST:
    "${prompt}"
    
    ${attachments.length > 0 ? 'ANALYZE ATTACHED REFERENCE IMAGES/FILES FOR DESIGN DIRECTION.' : ''}
    
    ENSURE:
    - High-fidelity visual hierarchy
    - Advanced Framer Motion animations
    - Responsive Bento Grid or Architectural layout
    - Production-ready React/Tailwind/Lucide stack
    
    Output MUST be ONLY the specified JSON schema, with absolutely no surrounding text.`;

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      let fullResponse = "";
      let lastEmitLength = 0;
      
      try {
        for await (const chunk of this.streamAsk(currentPrompt, model, attachments)) {
          if (chunk.choices?.[0]?.delta?.content) {
            fullResponse += chunk.choices[0].delta.content;
            
            // Throttled emit: Only send progress to UI after every 200 characters
            if (onProgress && fullResponse.length - lastEmitLength > 200) {
               lastEmitLength = fullResponse.length;
               onProgress('GENERATING_FILES', { 
                 message: `Compiling VFS payload... (${Math.floor(fullResponse.length / 4)} tokens)` 
               });
            }
          }
        }
      } catch (streamError) {
        console.error("Stream error:", streamError);
        // Fallback to what we have or let it retry
      }
      
      // 1. Output Sanitization
      let sanitizedOutput = fullResponse.trim();
      if (sanitizedOutput.startsWith('```json')) sanitizedOutput = sanitizedOutput.substring(7);
      else if (sanitizedOutput.startsWith('```')) sanitizedOutput = sanitizedOutput.substring(3);
      if (sanitizedOutput.endsWith('```')) sanitizedOutput = sanitizedOutput.substring(0, sanitizedOutput.length - 3);
      sanitizedOutput = sanitizedOutput.trim();

      try {
        // 2. Strict Parsing Gate
        let parsedJSON;
        const jsonMatch = sanitizedOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedJSON = JSON.parse(jsonMatch[0]);
        else parsedJSON = JSON.parse(sanitizedOutput);

        // 3. Hard Schema Enforcement
        const requiredKeys = ['projectName', 'framework', 'files', 'status'];
        const missingKeys = requiredKeys.filter(key => !(key in parsedJSON));
        
        if (missingKeys.length > 0) throw new Error(`Missing keys: ${missingKeys.join(', ')}`);
        if (!Array.isArray(parsedJSON.files)) throw new Error(`'files' must be an array.`);

        return parsedJSON;
      } catch (e) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('CodeBuilder failed after max attempts.');
          return { error: 'Failed to generate valid project format.' };
        }
        
        // 4. Auto-Regeneration Loop
        currentPrompt = `SYSTEM (STRICT MODE): Your previous output FAILED JSON parsing.
        Error: ${e instanceof Error ? e.message : 'Invalid JSON'}
        You MUST correct this immediately. DO NOT USE MARKDOWN. OUTPUT RAW JSON ONLY.
        
        Original Request: "${prompt}"`;
      }
    }
    
    return { error: 'Unknown failure' };
  }
}
