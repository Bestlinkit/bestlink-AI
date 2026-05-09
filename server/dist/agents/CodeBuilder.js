"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBuilder = void 0;
const BaseAgent_1 = require("./BaseAgent");
class CodeBuilder extends BaseAgent_1.BaseAgent {
    constructor() {
        super('CodeBuilder', 'Senior Software Engineer', `You are the Bestlink Code Builder. You write elite, production-ready code.
      You use Next.js 15+, Tailwind CSS 4, and Framer Motion.
      Your code is modular, well-commented, and follows best practices.
      Always wrap code blocks in standard markdown code fences with the language specified.`);
    }
    async *generateComponent(description, model) {
        yield* this.streamAsk(`Build this component: ${description}. Ensure it is responsive and uses premium aesthetics.`, model);
    }
    async *generatePage(manifest, pageName, model) {
        yield* this.streamAsk(`Build the "${pageName}" page for a ${manifest.type} project. 
    Context: ${JSON.stringify(manifest)}. 
    Design Aesthetic: ${manifest.designAesthetic}.
    Ensure full responsiveness and interactive elements.`, model);
    }
}
exports.CodeBuilder = CodeBuilder;
