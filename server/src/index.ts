import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { openRouterService } from './services/openrouter';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 🛡️ Minimal Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Allow large base64 images

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
    const messages: any[] = [];
    let promptContent: any[] = [{ type: 'text', text: text || 'Please analyze this image.' }];

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
    const reply = await openRouterService.chat(messages, model, { max_tokens: 2000 });

    res.json({ reply });
  } catch (error: any) {
    console.error('[API Error]:', error.message);
    res.status(500).json({ reply: 'AI temporarily unavailable. Please try again.' });
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`Minimal AI Engine running at http://localhost:${port}`);
});
