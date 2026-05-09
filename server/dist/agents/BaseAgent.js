"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const openrouter_1 = require("../services/openrouter");
class BaseAgent {
    name;
    role;
    systemPrompt;
    constructor(name, role, systemPrompt) {
        this.name = name;
        this.role = role;
        this.systemPrompt = systemPrompt;
    }
    async ask(prompt, model) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ];
        return openrouter_1.openRouterService.chat(messages, model);
    }
    async *streamAsk(prompt, model) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ];
        yield* openrouter_1.openRouterService.streamChatGenerator(messages, model);
    }
}
exports.BaseAgent = BaseAgent;
