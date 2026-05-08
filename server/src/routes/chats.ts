import { Router } from 'express';
import { dbService } from '../database/sqlite';

const router = Router();

// List all chats
router.get('/chats', async (req, res) => {
  try {
    const chats = await dbService.query('SELECT * FROM chats ORDER BY updated_at DESC');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create new chat
router.post('/chats', async (req, res) => {
  const { id, title, model } = req.body;
  try {
    await dbService.execute(
      'INSERT INTO chats (id, title, model) VALUES (?, ?, ?)',
      [id, title, model]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get chat messages
router.get('/chats/:id/messages', async (req, res) => {
  try {
    const messages = await dbService.query(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete chat
router.delete('/chats/:id', async (req, res) => {
  try {
    await dbService.execute('DELETE FROM chats WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
