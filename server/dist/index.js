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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const openrouter_1 = require("./services/openrouter");
const sqlite_1 = require("./database/sqlite");
const pipeline_1 = require("./services/pipeline");
const chats_1 = __importDefault(require("./routes/chats"));
const workspaces_1 = __importDefault(require("./routes/workspaces"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
const allowedOrigins = [
    'http://localhost:3000',
    'https://bestlink-digital-ai.web.app',
    'https://bestlink-digital-ai.firebaseapp.com',
    'https://bestlink-ai.web.app',
    'https://bestlink-ai.firebaseapp.com',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/chat', limiter);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// File Upload Setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Bestlink Digital AI Server is running' });
});
app.use('/api', chats_1.default);
app.use('/api', workspaces_1.default);
// Chat Endpoint (Streaming)
app.post('/api/chat', async (req, res) => {
    const { messages, model, options } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
        await openrouter_1.openRouterService.streamChat(messages, model, options, (chunk) => {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });
        res.write('data: [DONE]\n\n');
        res.end();
    }
    catch (error) {
        console.error('Chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
        res.end();
    }
});
// File Upload Endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.PRODUCTION_URL || `${protocol}://${host}`;
    const files = req.files;
    const fileData = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `${baseUrl}/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
    }));
    res.json({ files: fileData });
});
// Automated Project Generation Pipeline
app.post('/api/pipeline', async (req, res) => {
    const { prompt } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await pipeline_1.pipelineService.runFullPipeline(prompt, (stage, data) => {
        res.write(`data: ${JSON.stringify({ stage, data })}\n\n`);
    });
    res.write('data: [DONE]\n\n');
    res.end();
});
// Database Initialization & Start Server
async function start() {
    try {
        await sqlite_1.dbService.init();
        app.listen(port, () => {
            const baseUrl = process.env.PRODUCTION_URL || `http://localhost:${port}`;
            console.log(`Server running at ${baseUrl}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
    }
}
start();
