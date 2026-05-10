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
    async *streamAsk(prompt, model, attachments) {
        const userContent = [{ type: 'text', text: prompt }];
        attachments?.forEach(file => {
            if (file.mimetype?.startsWith('image/')) {
                // OpenRouter expects image_url with either a public URL or a data URI
                userContent.push({
                    type: 'image_url',
                    image_url: { url: file.path }
                });
            }
            else if (file.mimetype?.startsWith('text/')) {
                // Append text file content to the prompt
                userContent[0].text += `\n\nReference File (${file.originalName}):\n${file.content || '[Text content not available]'}`;
            }
        });
        const messages = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userContent.length > 1 ? userContent : prompt }
        ];
        yield* openrouter_1.openRouterService.streamChat(messages, model);
    }
}
exports.BaseAgent = BaseAgent;
