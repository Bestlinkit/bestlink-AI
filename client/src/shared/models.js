"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_ORDER = exports.MODELS = void 0;
exports.MODELS = [
    {
        id: "openrouter/free",
        name: "Auto-Free (Default)",
        provider: "OpenRouter",
        free: true,
        recommended: true
    },
    {
        id: "deepseek/deepseek-chat-v3-0324:free",
        name: "DeepSeek Chat V3",
        provider: "DeepSeek",
        free: true,
        coding: true,
        recommended: true
    },
    {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1",
        provider: "DeepSeek",
        free: true,
        coding: true,
        reasoning: true
    },
    {
        id: "qwen/qwen2.5-coder-32b-instruct:free",
        name: "Qwen 2.5 Coder 32B",
        provider: "Qwen",
        free: true,
        coding: true
    },
    {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B",
        provider: "Meta",
        free: true
    },
    {
        id: "google/gemma-3-27b-it:free",
        name: "Gemma 3 27B",
        provider: "Google",
        free: true
    },
    {
        id: "z-ai/glm-4.5-air:free",
        name: "GLM-4.5 Air",
        provider: "Z-AI",
        free: true
    }
];
exports.FALLBACK_ORDER = [
    "openrouter/free",
    "deepseek/deepseek-chat-v3-0324:free",
    "deepseek/deepseek-r1:free",
    "qwen/qwen2.5-coder-32b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free"
];
