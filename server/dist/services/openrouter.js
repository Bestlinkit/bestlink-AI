"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openRouterService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../shared/models");
dotenv_1.default.config();
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
exports.openRouterService = {
    async streamChat(messages, model = 'openrouter/free', options = {}, onChunk) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is not set');
        }
        // Attempt streaming with the selected model
        try {
            await this.executeRequest(messages, model, options, apiKey, onChunk);
        }
        catch (error) {
            console.warn(`Model ${model} failed, attempting fallback...`, error.message);
            // Fallback logic
            for (const fallbackModel of models_1.FALLBACK_ORDER) {
                if (fallbackModel === model)
                    continue;
                try {
                    console.log(`Trying fallback model: ${fallbackModel}`);
                    await this.executeRequest(messages, fallbackModel, options, apiKey, onChunk);
                    return; // Success!
                }
                catch (fallbackError) {
                    console.warn(`Fallback model ${fallbackModel} also failed:`, fallbackError.message);
                }
            }
            throw new Error('All available AI models failed to respond. Please try again later.');
        }
    },
    async chat(messages, model = 'openrouter/free', options = {}) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
            throw new Error('OPENROUTER_API_KEY is not set');
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://bestlink-digital-ai.local',
                'X-Title': 'Bestlink Digital AI',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4000,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error ${response.status}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    },
    async *streamChatGenerator(messages, model = 'openrouter/free', options = {}) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
            throw new Error('OPENROUTER_API_KEY is not set');
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://bestlink-digital-ai.local',
                'X-Title': 'Bestlink Digital AI',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4000,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('Response body is null');
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]')
                        continue;
                    try {
                        const parsed = JSON.parse(data);
                        yield parsed;
                    }
                    catch (e) { }
                }
            }
        }
    },
    async executeRequest(messages, model, options, apiKey, onChunk) {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://bestlink-digital-ai.local',
                'X-Title': 'Bestlink Digital AI',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4000,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('Response body is null');
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]')
                        continue;
                    try {
                        const parsed = JSON.parse(data);
                        onChunk(parsed);
                    }
                    catch (e) {
                        // Ignore incomplete chunks
                    }
                }
            }
        }
    }
};
