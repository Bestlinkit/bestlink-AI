import { Router } from 'express';
import { dbService } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create new project/workspace
router.post('/projects', async (req, res) => {
  const { name, description } = req.body;
  const id = uuidv4();
  try {
    await dbService.execute(
      'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
      [id, name, description]
    );
    res.json({ id, name, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await dbService.query('SELECT * FROM projects ORDER BY updated_at DESC');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project files
router.get('/projects/:id/files', async (req, res) => {
  try {
    const files = await dbService.query(
      'SELECT * FROM files WHERE project_id = ? ORDER BY path ASC',
      [req.params.id]
    );
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Save/Update file
router.post('/projects/:id/files', async (req, res) => {
  const { path, content, language } = req.body;
  const projectId = req.params.id;
  const id = uuidv4();
  try {
    // Check if file exists
    const existing = await dbService.query(
      'SELECT id FROM files WHERE project_id = ? AND path = ?',
      [projectId, path]
    );

    if (existing.length > 0) {
      await dbService.execute(
        'UPDATE files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND path = ?',
        [content, projectId, path]
      );
    } else {
      await dbService.execute(
        'INSERT INTO files (id, project_id, path, content, language) VALUES (?, ?, ?, ?, ?)',
        [id, projectId, path, content, language]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

export default router;
