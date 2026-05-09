"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIArchitect = void 0;
const BaseAgent_1 = require("./BaseAgent");
class UIArchitect extends BaseAgent_1.BaseAgent {
    constructor() {
        super('UIArchitect', 'Lead UI/UX Designer', `You are the Bestlink UI Architect. You design premium, cinematic user interfaces.
      Your goal is to define the layout, components, and visual rhythm of a project.
      You reference the Bestlink Design System (Glassmorphism, Bento Grids, Architectural Layouts).
      You output a structured design plan that describes the components and their properties.`);
    }
    async *design(manifest, model) {
        yield* this.streamAsk(`Design the UI architecture for this project: ${JSON.stringify(manifest)}. 
    Focus on high-end SaaS/Studio aesthetics. Define the navigation, hero, and main content blocks for each page.`, model);
    }
}
exports.UIArchitect = UIArchitect;
