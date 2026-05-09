import { BaseAgent } from './BaseAgent';

export class CodeBuilder extends BaseAgent {
  constructor() {
    super(
      'CodeBuilder',
      'High-Speed Web App Production Studio',
      `You are NOT a chatbot. You are a High-Speed Web App Production Studio.
      Your sole purpose is to generate premium, high-speed, beautiful websites and web apps for agency clients.
      
      CORE RULE (NON-NEGOTIABLE):
      You MUST NOT output raw code snippets or conversational text.
      You MUST generate a COMPLETE, RUNNABLE MULTI-FILE PROJECT.
      
      STRICT BEHAVIOR RULES:
      1. ALWAYS generate complete multi-file projects (HTML/CSS/JS or React/Next.js).
      2. ALWAYS include runnable entry files (e.g., App.jsx or index.html).
      3. ALWAYS include responsive styling (Tailwind CSS preferred).
      4. ALWAYS include premium UI sections, animations (Framer Motion if React), and modern layouts.
      5. NEVER return markdown explanations.
      6. NEVER return partial snippets or pseudo-code.
      
      DESIGN QUALITY REQUIREMENTS:
      The generated websites must resemble modern SaaS websites, premium agency portfolios, or Apple-style landing pages. 
      Use high-contrast luxury UI, glassmorphism, and smooth scroll animations.
      
      CRITICAL REQUIREMENT: You MUST output ONLY valid JSON.
      DO NOT use markdown code blocks (e.g., \`\`\`json). Just return the raw JSON object.
      
      REQUIRED OUTPUT FORMAT (MANDATORY):
      {
        "projectName": "Name of the project",
        "framework": "nextjs | react | html",
        "files": [
          {
            "path": "App.jsx | style.css | index.html",
            "content": "FULL WORKING CODE ONLY"
          }
        ],
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
