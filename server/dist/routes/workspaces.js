"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sqlite_1 = require("../database/sqlite");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Create new project/workspace
router.post('/projects', async (req, res) => {
    const { name, description } = req.body;
    const id = (0, uuid_1.v4)();
    try {
        await sqlite_1.dbService.execute('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)', [id, name, description]);
        res.json({ id, name, description });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// List all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await sqlite_1.dbService.query('SELECT * FROM projects ORDER BY updated_at DESC');
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// Get project files
router.get('/projects/:id/files', async (req, res) => {
    try {
        const files = await sqlite_1.dbService.query('SELECT * FROM files WHERE project_id = ? ORDER BY path ASC', [req.params.id]);
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});
// Save/Update file
router.post('/projects/:id/files', async (req, res) => {
    const { path, content, language } = req.body;
    const projectId = req.params.id;
    const id = (0, uuid_1.v4)();
    try {
        // Check if file exists
        const existing = await sqlite_1.dbService.query('SELECT id FROM files WHERE project_id = ? AND path = ?', [projectId, path]);
        if (existing.length > 0) {
            await sqlite_1.dbService.execute('UPDATE files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND path = ?', [content, projectId, path]);
        }
        else {
            await sqlite_1.dbService.execute('INSERT INTO files (id, project_id, path, content, language) VALUES (?, ?, ?, ?, ?)', [id, projectId, path, content, language]);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save file' });
    }
});
exports.default = router;
