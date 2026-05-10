"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const openrouter_1 = require("./services/openrouter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// 🛡️ MUST be FIRST middleware
app.use(express_1.default.json({ limit: '50mb' })); // Allow large base64 images
// 🛡️ Critical Infrastructure Patch (CORS)
const allowedOrigins = [
    "https://bestlink-digital-ai.web.app",
    "http://localhost:3000",
    "http://localhost:5173"
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
// CRITICAL: handle preflight requests
app.options("*", (0, cors_1.default)());
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, morgan_1.default)('dev'));
// 🏥 Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', uptime: process.uptime() });
});
// 🤖 Minimal AI Assistant Endpoint
app.post('/api/chat', async (req, res) => {
    const { text, image, url } = req.body;
    if (!text && !image) {
        return res.status(400).json({ error: 'Text or Image is required' });
    }
    try {
        const messages = [];
        let promptContent = [{ type: 'text', text: text || 'Please analyze this image.' }];
        // Handle URL as context
        if (url) {
            promptContent[0].text += `\n\nURL Context: ${url}`;
        }
        // Handle Image (Base64)
        if (image) {
            promptContent.push({
                type: 'image_url',
                image_url: {
                    url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
            });
        }
        messages.push({ role: 'user', content: promptContent });
        // Use a robust multimodal model
        const model = 'google/gemini-2.0-flash-exp:free';
        const reply = await openrouter_1.openRouterService.chat(messages, model, { max_tokens: 2000 });
        res.json({ reply });
    }
    catch (error) {
        console.error('[API Error]:', error.message);
        res.status(500).json({ reply: 'AI temporarily unavailable. Please try again.' });
    }
});
// 🚀 Start Server
app.listen(port, () => {
    console.log(`Minimal AI Engine running at http://localhost:${port}`);
});
