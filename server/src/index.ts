import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { openRouterService } from './services/openrouter';
import { pipelineService } from './services/pipeline';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: false
}));

app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/chat', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// File Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    uptime: process.uptime() 
  });
});

// Chat Endpoint (Streaming)
app.post('/api/chat', async (req, res) => {
  const { messages, model, options } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await openRouterService.streamChat(messages, model, options, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      (res as any).flush?.();
    });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
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
  
  const files = req.files as Express.Multer.File[];
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
  const { prompt, attachments } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  await pipelineService.runFullPipeline(prompt, (stage, data) => {
    res.write(`data: ${JSON.stringify({ stage, data })}\n\n`);
    (res as any).flush?.();
  }, 'global', attachments);

  res.write('data: [DONE]\n\n');
  res.end();
});

// Start Server
app.listen(port, () => {
  const baseUrl = process.env.PRODUCTION_URL || `http://localhost:${port}`;
  console.log(`AI Engine running at ${baseUrl}`);
});
