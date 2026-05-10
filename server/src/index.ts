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

// 🤖 Elite AI Prompt Engine Endpoint
app.post('/api/chat', async (req, res) => {
  const { text, image, url, history = [], model: requestedModel } = req.body;

  if (!text && !image && history.length === 0) {
    return res.status(400).json({ error: 'Message or History is required' });
  }

  try {
    const messages: any[] = [
      { role: 'system', content: ELITE_DIRECTOR_SYSTEM_PROMPT },
      ...history
    ];

    if (text || image) {
      let promptContent: any[] = [{ type: 'text', text: text || 'Please analyze this.' }];

      if (url) {
        promptContent[0].text += `\n\nURL Context: ${url}`;
      }

      if (image) {
        promptContent.push({
          type: 'image_url',
          image_url: {
            url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
          }
        });
      }

      messages.push({ role: 'user', content: promptContent });
    }

    // Model Routing Logic
    const modelMap: Record<string, string> = {
      'deepseek': 'deepseek/deepseek-chat',
      'qwen': 'qwen/qwen-2.5-72b-instruct',
      'glm': 'google/gemini-2.0-flash-exp:free', // Using Gemini as proxy for GLM/General
      'claude': 'anthropic/claude-3-haiku',
      'gemini': 'google/gemini-2.0-flash-exp:free'
    };

    const finalModel = modelMap[requestedModel?.toLowerCase()] || 'google/gemini-2.0-flash-exp:free';
    
    console.log(`[Elite Engine] Routing to: ${finalModel}`);
    const reply = await openRouterService.chat(messages, finalModel, { max_tokens: 4000 });

    res.json({ reply });
  } catch (error: any) {
    console.error('[Elite Engine Error]:', error.message);
    res.status(500).json({ error: 'Assistant logic failed. Please try a different model.' });
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`Minimal AI Engine running at http://localhost:${port}`);
});
