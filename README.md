# Bestlink Digital AI — Elite AI Coding Assistant

Bestlink Digital AI is a premium, personalized AI development studio platform designed for creating elite websites, SaaS platforms, and modern applications.

## 🚀 Features

- **Claude-Style Chat UI**: Clean, minimal, and highly responsive interface.
- **Elite AI Engine**: Powered by OpenRouter (Claude 3.5 Sonnet, GPT-4, DeepSeek).
- **Live Code Sandbox**: Monaco Editor with real-time iframe preview for web projects.
- **Advanced Streaming**: Real-time AI responses with syntax highlighting.
- **File & Image Support**: Drag-and-drop uploads for images and project files.
- **Local Persistence**: SQLite database for chat history and project management.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Framer Motion, Zustand.
- **Backend**: Node.js, Express.js, SQLite, SSE.
- **AI Provider**: OpenRouter API.
- **Editor**: Monaco Editor.

## 📦 Installation

### Prerequisites
- Node.js 20+
- OpenRouter API Key

### Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your API key:
   ```env
   PORT=5000
   OPENROUTER_API_KEY=your_key_here
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Firebase Hosting (Frontend)
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

---

Developed by **Bestlink Digital** for premium AI-driven development.
