import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/breaking - Active breaking news items
router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT b.*, a.slug as article_slug
      FROM breaking_news b
      LEFT JOIN articles a ON b.article_id = a.id
      WHERE b.is_active = 1
      ORDER BY b.created_at DESC
      LIMIT 10
    `).all();

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/breaking/all - For admin
router.get('/all', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT b.*, a.title as article_title
      FROM breaking_news b
      LEFT JOIN articles a ON b.article_id = a.id
      ORDER BY b.created_at DESC
    `).all();

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/breaking - Add breaking ticker item
router.post('/', (req, res) => {
  try {
    const { title, url, article_id, is_active = 1 } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Başlıq tələb olunur' });

    const result = db.prepare(`
      INSERT INTO breaking_news (title, url, article_id, is_active)
      VALUES (?, ?, ?, ?)
    `).run(title, url || null, article_id || null, is_active ? 1 : 0);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/breaking/:id/toggle - Toggle active status
router.put('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE breaking_news SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
    res.json({ success: true, message: 'Status dəyişdirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/breaking/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM breaking_news WHERE id = ?').run(id);
    res.json({ success: true, message: 'Silindi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
