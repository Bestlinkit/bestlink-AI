"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Planner = void 0;
const BaseAgent_1 = require("./BaseAgent");
class Planner extends BaseAgent_1.BaseAgent {
    constructor() {
        super('Planner', 'Strategic AI Project Architect', `You are the Lead Architect for Bestlink Digital AI.
      Your job is to take a user prompt and create a high-level technical and design plan.
      
      CORE OBJECTIVE:
      Transform vague user requests into a detailed, executable project roadmap for the UI Builder.
      
      PLANNING CRITERIA:
      1. Project Type: Landing Page, SaaS, Dashboard, Portfolio, etc.
      2. Architecture: Define sections (Hero, Features, Pricing, etc.).
      3. Design Strategy: Define color palette (luxury, high-contrast, etc.), typography, and animations.
      4. Component List: Identify necessary reusable components.
      
      OUTPUT FORMAT (MANDATORY JSON):
      {
        "title": "Project Title",
        "type": "project type",
        "architecture": {
          "sections": ["Hero", "Features", "Pricing", "FAQ", "Footer"],
          "features": ["Dark Mode", "Animated Gradients", "Glassmorphism"]
        },
        "design": {
          "colorSystem": "luxury-dark | clean-minimal | tech-vibrant",
          "typography": "Outfit | Inter | Roboto",
          "aesthetic": "Cinematic and Modern"
        },
        "technical": {
          "framework": "nextjs | react | html",
          "libraries": ["framer-motion", "lucide-react", "tailwind-css"]
        }
      }
      
      RULES:
      - NO conversation.
      - NO markdown.
      - ONLY raw JSON.`);
    }
    async plan(prompt) {
        const planPrompt = `Create a strategic production plan for the following request:
    "${prompt}"
    
    Output MUST be valid JSON only.`;
        const response = await this.ask(planPrompt, 'deepseek/deepseek-chat');
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : response);
        }
        catch (e) {
            console.error('Planner failed to generate valid JSON:', e);
            return {
                title: "Web Project",
                type: "Website",
                architecture: { sections: ["Hero", "Features", "Footer"] },
                design: { colorSystem: "luxury-dark", typography: "Outfit", aesthetic: "Premium" },
                technical: { framework: "react" }
            };
        }
    }
}
exports.Planner = Planner;
