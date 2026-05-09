import { BaseAgent } from './BaseAgent';

export class CodeBuilder extends BaseAgent {
  constructor() {
    super(
      'CodeBuilder',
      'High-Speed Web App Production Studio',
      `You are the Lead UI Builder for Bestlink Digital AI.
      Your sole purpose is to generate COMPLETE, PREMIUM, PRODUCTION-READY projects.
      
      CORE RULES:
      1. NEVER output conversational text or markdown.
      2. NEVER output snippets or partial files.
      3. ALWAYS generate the full project structure as a single JSON object.
      4. ALWAYS use premium design principles: glassmorphism, smooth animations (Framer Motion), luxury spacing, and modern typography (Outfit/Inter).
      5. ALWAYS ensure full responsiveness (mobile-first).
      
      MANDATORY OUTPUT FORMAT:
      {
        "projectName": "Project Title",
        "framework": "nextjs | react | html",
        "files": [
          {
            "path": "src/App.tsx",
            "content": "Full source code..."
          }
        ],
        "preview": {
          "entry": "src/App.tsx"
        },
        "status": "complete"
      }`
    );
  }

  async build(prompt: string, model?: string) {
    let currentPrompt = `Generate a complete, premium, production-ready project based on this request:
    
    USER REQUEST:
    "${prompt}"
    
    Ensure full responsiveness, interactive elements, and luxury design.
    Output MUST be ONLY the specified JSON schema, with absolutely no surrounding text.`;

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      const response = await this.ask(currentPrompt, model);
      
      // 1. Output Sanitization
      let sanitizedOutput = response.trim();
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
