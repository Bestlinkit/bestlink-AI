import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { openRouterService } from './services/openrouter';
import { dbService } from './database/sqlite';
import { pipelineService } from './services/pipeline';
import chatRoutes from './routes/chats';
import workspaceRoutes from './routes/workspaces';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
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
  res.json({ status: 'ok', message: 'Bestlink Digital AI Server is running' });
});

app.use('/api', chatRoutes);
app.use('/api', workspaceRoutes);

// Chat Endpoint (Streaming)
app.post('/api/chat', async (req, res) => {
  const { messages, model, options } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await openRouterService.streamChat(messages, model, options, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
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
  const files = req.files as Express.Multer.File[];
  const fileData = files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/${file.filename}`,
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

  await pipelineService.runFullPipeline(prompt, (stage, data) => {
    res.write(`data: ${JSON.stringify({ stage, data })}\n\n`);
  });

  res.write('data: [DONE]\n\n');
  res.end();
});

// Database Initialization & Start Server
async function start() {
  try {
    await dbService.init();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

start();
