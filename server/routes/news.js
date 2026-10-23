import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Helper to create URL-friendly slug from Azerbaijani / Unicode text
export function generateSlug(text) {
  const azMap = {
    'ə': 'e', 'Ə': 'e',
    'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ü': 'u', 'Ü': 'u',
    'ğ': 'g', 'Ğ': 'g',
    'ç': 'c', 'Ç': 'c',
    'ş': 's', 'Ş': 's'
  };

  let slug = text;
  for (const [k, v] of Object.entries(azMap)) {
    slug = slug.replaceAll(k, v);
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/news - List articles
router.get('/', (req, res) => {
  try {
    const {
      category,
      search,
      is_manshet,
      is_breaking,
      is_featured,
      sort = 'latest',
      limit = 20,
      page = 1,
      status = 'published'
    } = req.query;

    let query = `
      SELECT 
        a.id, a.title, a.slug, a.category_id, a.summary, a.image_url, 
        a.author, a.tags, a.is_manshet, a.is_breaking, a.is_featured, 
        a.views, a.likes, a.read_time, a.status, a.created_at,
        c.name as category_name, c.slug as category_slug, c.color as category_color,
        (SELECT COUNT(*) FROM comments cm WHERE cm.article_id = a.id AND cm.status = 'approved') as comment_count
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by status (unless admin requests all)
    if (status !== 'all') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (category) {
      if (isNaN(category)) {
        query += ` AND c.slug = ?`;
        params.push(category);
      } else {
        query += ` AND a.category_id = ?`;
        params.push(parseInt(category));
      }
    }

    if (search) {
      query += ` AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (is_manshet !== undefined) {
      query += ` AND a.is_manshet = ?`;
      params.push(parseInt(is_manshet));
    }

    if (is_breaking !== undefined) {
      query += ` AND a.is_breaking = ?`;
      params.push(parseInt(is_breaking));
    }

    if (is_featured !== undefined) {
      query += ` AND a.is_featured = ?`;
      params.push(parseInt(is_featured));
    }

    // Sorting
    if (sort === 'views' || sort === 'popular') {
      query += ` ORDER BY a.views DESC, a.created_at DESC`;
    } else {
      query += ` ORDER BY a.created_at DESC`;
    }

    // Pagination
    const numLimit = parseInt(limit) || 20;
    const numPage = parseInt(page) || 1;
    const offset = (numPage - 1) * numLimit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(numLimit, offset);

    const articles = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    if (status !== 'all') {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    }
    if (category) {
      if (isNaN(category)) {
        countQuery += ` AND c.slug = ?`;
        countParams.push(category);
      } else {
        countQuery += ` AND a.category_id = ?`;
        countParams.push(parseInt(category));
      }
    }
    if (search) {
      countQuery += ` AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)`;
      const term = `%${search}%`;
      countParams.push(term, term, term, term);
    }
    const totalCount = db.prepare(countQuery).get(...countParams).count;

    res.json({
      success: true,
      data: articles,
      pagination: {
        total: totalCount,
        page: numPage,
        limit: numLimit,
        pages: Math.ceil(totalCount / numLimit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/news/:idOrSlug - Single article
router.get('/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let article;

    if (isNaN(idOrSlug)) {
      article = db.prepare(`
        SELECT 
          a.*,
          c.name as category_name, c.slug as category_slug, c.color as category_color
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.slug = ?
      `).get(idOrSlug);
    } else {
      article = db.prepare(`
        SELECT 
          a.*,
          c.name as category_name, c.slug as category_slug, c.color as category_color
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = ?
      `).get(parseInt(idOrSlug));
    }

    if (!article) {
      return res.status(404).json({ success: false, message: 'Xəbər tapılmadı' });
    }

    // Increment view count
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
    article.views += 1;

    // Fetch approved comments
    const comments = db.prepare(`
      SELECT id, author_name, content, created_at 
      FROM comments 
      WHERE article_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `).all(article.id);

    // Fetch reactions
    const reactions = db.prepare(`
      SELECT reaction_type, count FROM reactions WHERE article_id = ?
    `).all(article.id);

    // Fetch related news (same category or latest)
    const related = db.prepare(`
      SELECT a.id, a.title, a.slug, a.image_url, a.summary, a.views, a.created_at, c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id != ? AND (a.category_id = ? OR 1=1)
      ORDER BY (a.category_id = ?) DESC, a.created_at DESC
      LIMIT 4
    `).all(article.id, article.category_id, article.category_id);

    res.json({
      success: true,
      data: {
        ...article,
        comments,
        reactions,
        related
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/news - Create article (Admin)
router.post('/', (req, res) => {
  try {
    const {
      title,
      category_id,
      summary,
      content,
      image_url,
      author = 'Redaksiya',
      tags = '',
      is_manshet = 0,
      is_breaking = 0,
      is_featured = 0,
      read_time = 3,
      status = 'published'
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Başlıq və mətn mütləqdir' });
    }

    let baseSlug = generateSlug(title);
    if (!baseSlug) baseSlug = 'xeber-' + Date.now();
    let slug = baseSlug;
    let count = 1;

    // Ensure slug uniqueness
    while (db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${count++}`;
    }

    const stmt = db.prepare(`
      INSERT INTO articles (
        title, slug, category_id, summary, content, image_url, author, tags,
        is_manshet, is_breaking, is_featured, read_time, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      title, slug, category_id || null, summary || '', content,
      image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      author, tags, parseInt(is_manshet) || 0, is_breaking ? 1 : 0,
      is_featured ? 1 : 0, parseInt(read_time) || 3, status
    );

    // If marked as breaking, also add to breaking_news ticker
    if (is_breaking) {
      db.prepare('INSERT INTO breaking_news (title, url, article_id, is_active) VALUES (?, ?, ?, 1)')
        .run(title, `/article.html?id=${result.lastInsertRowid}`, result.lastInsertRowid);
    }

    res.status(201).json({
      success: true,
      message: 'Xəbər uğurla əlavə edildi',
      data: { id: result.lastInsertRowid, slug }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/news/:id - Update article (Admin)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category_id,
      summary,
      content,
      image_url,
      author,
      tags,
      is_manshet,
      is_breaking,
      is_featured,
      read_time,
      status
    } = req.body;

    const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Xəbər tapılmadı' });
    }

    let slug = existing.slug;
    if (title && title !== existing.title) {
      let baseSlug = generateSlug(title);
      slug = baseSlug;
      let count = 1;
      while (db.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(slug, id)) {
        slug = `${baseSlug}-${count++}`;
      }
    }

    const stmt = db.prepare(`
      UPDATE articles SET
        title = COALESCE(?, title),
        slug = ?,
        category_id = COALESCE(?, category_id),
        summary = COALESCE(?, summary),
        content = COALESCE(?, content),
        image_url = COALESCE(?, image_url),
        author = COALESCE(?, author),
        tags = COALESCE(?, tags),
        is_manshet = COALESCE(?, is_manshet),
        is_breaking = COALESCE(?, is_breaking),
        is_featured = COALESCE(?, is_featured),
        read_time = COALESCE(?, read_time),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title, slug, category_id, summary, content, image_url,
      author, tags, is_manshet, is_breaking, is_featured,
      read_time, status, id
    );

    res.json({ success: true, message: 'Xəbər uğurla yeniləndi', data: { id, slug } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/news/:id - Delete article (Admin)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Xəbər tapılmadı' });
    }

    db.prepare('DELETE FROM comments WHERE article_id = ?').run(id);
    db.prepare('DELETE FROM reactions WHERE article_id = ?').run(id);
    db.prepare('DELETE FROM breaking_news WHERE article_id = ?').run(id);
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);

    res.json({ success: true, message: 'Xəbər uğurla silindi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/news/:id/reaction - Reaction emoji
router.post('/:id/reaction', (req, res) => {
  try {
    const { id } = req.params;
    const { reaction_type } = req.body; // 'like', 'heart', 'wow', 'sad', 'angry'

    const validTypes = ['like', 'heart', 'wow', 'sad', 'angry'];
    if (!validTypes.includes(reaction_type)) {
      return res.status(400).json({ success: false, message: 'Yanlış reaksiya növü' });
    }

    db.prepare(`
      INSERT INTO reactions (article_id, reaction_type, count)
      VALUES (?, ?, 1)
      ON CONFLICT(article_id, reaction_type) DO UPDATE SET count = count + 1
    `).run(id, reaction_type);

    if (reaction_type === 'like' || reaction_type === 'heart') {
      db.prepare('UPDATE articles SET likes = likes + 1 WHERE id = ?').run(id);
    }

    const updated = db.prepare('SELECT reaction_type, count FROM reactions WHERE article_id = ?').all(id);
    res.json({ success: true, reactions: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
