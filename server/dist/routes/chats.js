"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sqlite_1 = require("../database/sqlite");
const router = (0, express_1.Router)();
// List all chats
router.get('/chats', async (req, res) => {
    try {
        const chats = await sqlite_1.dbService.query('SELECT * FROM chats ORDER BY updated_at DESC');
        res.json(chats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});
// Create new chat
router.post('/chats', async (req, res) => {
    const { id, title, model } = req.body;
    try {
        await sqlite_1.dbService.execute('INSERT INTO chats (id, title, model) VALUES (?, ?, ?)', [id, title, model]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create chat' });
    }
});
// Get chat messages
router.get('/chats/:id/messages', async (req, res) => {
    try {
        const messages = await sqlite_1.dbService.query('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [req.params.id]);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Delete chat
router.delete('/chats/:id', async (req, res) => {
    try {
        await sqlite_1.dbService.execute('DELETE FROM chats WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});
exports.default = router;
