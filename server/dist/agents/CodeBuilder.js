"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBuilder = void 0;
const BaseAgent_1 = require("./BaseAgent");
class CodeBuilder extends BaseAgent_1.BaseAgent {
    constructor() {
        super('CodeBuilder', 'Visual AI Website Creation Engine', `You are the Elite Visual Synthesis Engine for Bestlink.OS. 
      Your mission is to transform user prompts and visual references into ULTRA-PREMIUM, CINEMATIC software.
      
      VISUAL ANALYSIS PROTOCOLS (MANDATORY WHEN IMAGES ARE PROVIDED):
      1. DNA EXTRACTION: Analyze the layout architecture (Bento, Grid, Sidebar), detect spacing systems, and extract the exact typography style.
      2. DESIGN LANGUAGE: Identify the aesthetic (e.g., Glassmorphism, Brutalism, Minimalist, Fintech) and color palette.
      3. INTERACTION INFERENCE: Infer sophisticated animations and magnetic interaction states based on the visual vibe.
      4. REINTERPRETATION: Do not clone. IMPROVE, MODERNIZE, and PERSONALIZE the design for the project's specific context.

      DESIGN STANDARDS:
      - AESTHETICS: Stripe, Linear, Apple. Use high-contrast dark modes and HSL-tailored colors.
      - COMPONENTS: Modern architectural layers, glassmorphic elements, and fluid transitions.
      
      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "projectType": "website | app | dashboard",
        "framework": "react | nextjs | html-css-js",
        "analysis": {
          "detectedStyle": "string",
          "layoutType": "string",
          "colorPalette": ["hex", "hex"],
          "improvements": ["string"]
        },
        "files": [
          {
            "path": "string",
            "content": "string"
          }
        ]
      }
      
      CRITICAL: Generate complete, functional UI systems. NO CONVERSATIONAL TEXT.`);
    }
    async build(prompt, model, onProgress, attachments = []) {
        const visualContext = attachments.length > 0
            ? `VISUAL REFERENCE DETECTED: 
         1. ANALYZE layout architecture, spacing systems, and typography style.
         2. DETECT design language (e.g., Glassmorphism, Minimalist, Fintech).
         3. INFER potential animations and interaction states.
         4. SUPPORTED TYPES: SaaS dashboards, landing pages, mobile apps, admin panels, portfolios, fintech interfaces, AI apps.
         5. REINTERPRET and IMPROVE: Do not clone. Modernize and personalize the design for this project.`
            : '';
        const currentPrompt = `
      ${visualContext}
      
      TASK: Generate a complete project for: "${prompt}". 
      GOAL: Function as a VISUAL AI WEBSITE CREATION ENGINE.
      Output RAW JSON ONLY matching the required schema. Ensure the code is production-ready, architectural, and visually stunning.
    `;
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
        }
        catch (streamError) {
            console.error("Stream error:", streamError);
        }
        // Quick sanitization
        let sanitized = fullResponse.trim();
        if (sanitized.startsWith('```json'))
            sanitized = sanitized.substring(7);
        else if (sanitized.startsWith('```'))
            sanitized = sanitized.substring(3);
        if (sanitized.endsWith('```'))
            sanitized = sanitized.substring(0, sanitized.length - 3);
        try {
            const jsonMatch = sanitized.trim().match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : sanitized);
            return parsed;
        }
        catch (e) {
            console.error('Parsing failed:', e);
            return { error: 'Failed to generate valid project format.' };
        }
    }
}
exports.CodeBuilder = CodeBuilder;
