import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { openRouterService } from './services/openrouter';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 🛡️ MUST be FIRST middleware
app.use(express.json({ limit: '50mb' })); // Allow large base64 images

// 🛡️ Critical Infrastructure Patch (CORS)
const allowedOrigins = [
  "https://bestlink-digital-ai.web.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
app.options("*", cors());

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

import { ELITE_DIRECTOR_SYSTEM_PROMPT } from './shared/prompts';

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

// 🏷️ Auto-Title Generation
app.post('/api/generate-title', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const titlePrompt = [
      { role: 'system', content: 'Generate a short professional project title from this request. Max 5 words. No quotes.' },
      { role: 'user', content: prompt }
    ];
    const title = await openRouterService.chat(titlePrompt, 'google/gemini-2.0-flash-exp:free', { max_tokens: 20 });
    res.json({ title: title.replace(/["']/g, '').trim() });
  } catch (error) {
    res.json({ title: 'New Creative Project' });
  }
});

// 🤖 Elite AI Prompt Engine Endpoint (STREAMING)
app.post('/api/chat', async (req, res) => {
  const { text, image, url, history = [], model: requestedModel, projectMemory } = req.body;

  if (!text && !image && history.length === 0) {
    return res.status(400).json({ error: 'Message or History is required' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const messages: any[] = [
      { role: 'system', content: ELITE_DIRECTOR_SYSTEM_PROMPT },
      ...history
    ];

    if (text || image) {
      let promptContent: any[] = [{ type: 'text', text: text || 'Please analyze this.' }];
      if (url) promptContent[0].text += `\n\nURL Context: ${url}`;
      if (image) {
        promptContent.push({
          type: 'image_url',
          image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` }
        });
      }
      messages.push({ role: 'user', content: promptContent });
    }

    const modelMap: Record<string, string> = {
      'deepseek': 'deepseek/deepseek-chat',
      'qwen': 'qwen/qwen-2.5-72b-instruct',
      'glm': 'google/gemini-2.0-flash-exp:free',
      'claude': 'anthropic/claude-3-haiku',
      'gemini': 'google/gemini-2.0-flash-exp:free'
    };

    const finalModel = modelMap[requestedModel?.toLowerCase()] || 'google/gemini-2.0-flash-exp:free';
    
    console.log(`[Elite Engine] Streaming from: ${finalModel}`);

    // Use OpenRouter streaming
    const stream = await openRouterService.streamChat(messages, finalModel, { max_tokens: 8000 });

    for await (const chunk of stream) {
      if (chunk) {
        res.write(`data: ${JSON.stringify({ reply: chunk })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[Elite Engine Error]:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Generation interrupted.' })}\n\n`);
    res.end();
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`Minimal AI Engine running at http://localhost:${port}`);
});
