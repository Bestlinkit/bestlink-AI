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
    async *streamChat(messages, model = 'google/gemini-2.0-flash-exp:free', options = {}) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
            throw new Error('OPENROUTER_API_KEY is not set');
        const modelsToTry = [model, ...models_1.FALLBACK_ORDER.filter(m => m !== model)];
        for (const currentModel of modelsToTry) {
            try {
                console.log(`[OpenRouter] Streaming with: ${currentModel}`);
                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://bestlink-digital-ai.local',
                        'X-Title': 'Bestlink Digital AI',
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages,
                        stream: true,
                        temperature: options.temperature ?? 0.7,
                        max_tokens: options.max_tokens ?? 8000,
                    }),
                });
                if (!response.ok)
                    throw new Error(`API Error ${response.status}`);
                const reader = response.body?.getReader();
                if (!reader)
                    throw new Error('Response body is null');
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: '))
                            continue;
                        const data = trimmed.slice(6);
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || "";
                            if (content)
                                yield content;
                        }
                        catch (e) {
                            // Ignore partial JSON
                        }
                    }
                }
                return; // Success!
            }
            catch (error) {
                console.warn(`[OpenRouter] Stream failed for ${currentModel}:`, error.message);
                continue; // Try next model
            }
        }
        throw new Error('All models failed to stream.');
    },
    async chat(messages, model = 'google/gemini-2.0-flash-exp:free', options = {}) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
            throw new Error('OPENROUTER_API_KEY is not set');
        const modelsToTry = [model, ...models_1.FALLBACK_ORDER.filter(m => m !== model)];
        for (const currentModel of modelsToTry) {
            try {
                console.log(`[OpenRouter] Request with: ${currentModel}`);
                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://bestlink-digital-ai.local',
                        'X-Title': 'Bestlink Digital AI',
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages,
                        temperature: options.temperature ?? 0.7,
                        max_tokens: options.max_tokens ?? 8000,
                    }),
                });
                if (!response.ok)
                    throw new Error(`API Error ${response.status}`);
                const data = await response.json();
                return data.choices?.[0]?.message?.content || "";
            }
            catch (error) {
                console.warn(`[OpenRouter] Request failed for ${currentModel}:`, error.message);
            }
        }
        throw new Error('All models failed.');
    }
};
