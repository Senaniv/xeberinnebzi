import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/comments - Admin list
router.get('/', (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;
    let query = `
      SELECT c.*, a.title as article_title, a.slug as article_slug
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE 1=1
    `;
    const params = [];
    if (status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY c.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const comments = db.prepare(query).all(...params);
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/comments - Reader submit comment
router.post('/', (req, res) => {
  try {
    const { article_id, author_name, content } = req.body;
    if (!article_id || !author_name || !content) {
      return res.status(400).json({ success: false, message: 'Bütün sahələri doldurun' });
    }

    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(article_id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Məqalə tapılmadı' });
    }

    // Default to approved for seamless interaction (or can be pending)
    const result = db.prepare(`
      INSERT INTO comments (article_id, author_name, content, status)
      VALUES (?, ?, ?, 'approved')
    `).run(article_id, author_name.trim(), content.trim());

    const created = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'Şərhiniz əlavə edildi', data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/comments/:id/status - Admin status change
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'pending', 'rejected'

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Yanlış status' });
    }

    db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Şərh statusu yeniləndi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    res.json({ success: true, message: 'Şərh silindi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
