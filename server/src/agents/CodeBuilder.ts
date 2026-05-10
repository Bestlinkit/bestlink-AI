import { BaseAgent } from './BaseAgent';

export class CodeBuilder extends BaseAgent {
  constructor() {
    super(
      'CodeBuilder',
      'High-Speed Web App Production Studio',
      `You are a high-speed software production engine. 
      Your only task is to generate complete codebases in a single JSON response.
      
      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "projectType": "website | app | dashboard",
        "framework": "react | nextjs | html-css-js",
        "files": [
          {
            "path": "string (file path)",
            "content": "string (full source code)"
          }
        ]
      }
      
      RULES:
      1. NO CONVERSATIONAL TEXT.
      2. NO MARKDOWN WRAPPERS.
      3. OUTPUT RAW JSON ONLY.
      4. Ensure all files are complete and ready for instant preview.`
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
