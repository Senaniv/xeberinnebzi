import { Router } from 'express';
import db from '../db.js';
import { generateSlug } from './news.js';

const router = Router();

// GET /api/categories - All categories with count
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status = 'published') as article_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.id ASC
    `).all();

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/categories - Add category
router.post('/', (req, res) => {
  try {
    const { name, color = '#dc2626', icon = 'newspaper', sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Ad tələb olunur' });

    let slug = generateSlug(name);
    let count = 1;
    while (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)) {
      slug = `${generateSlug(name)}-${count++}`;
    }

    const stmt = db.prepare('INSERT INTO categories (name, slug, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    const resDb = stmt.run(name, slug, color, icon, parseInt(sort_order) || 0);

    res.status(201).json({ success: true, data: { id: resDb.lastInsertRowid, name, slug } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id - Update
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kateqoriya tapılmadı' });

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = generateSlug(name);
    }

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = ?,
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(name, slug, color, icon, sort_order, id);

    res.json({ success: true, message: 'Kateqoriya yeniləndi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE articles SET category_id = NULL WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Kateqoriya silindi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
