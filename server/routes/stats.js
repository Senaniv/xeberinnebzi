import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/stats - Dashboard analytics
router.get('/', (req, res) => {
  try {
    const totalArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get().count;
    const totalViews = db.prepare("SELECT COALESCE(SUM(views), 0) as count FROM articles").get().count;
    const totalComments = db.prepare("SELECT COUNT(*) as count FROM comments").get().count;
    const totalCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get().count;
    const breakingCount = db.prepare("SELECT COUNT(*) as count FROM breaking_news WHERE is_active = 1").get().count;

    // Category distribution
    const categoryStats = db.prepare(`
      SELECT c.name, c.color, COUNT(a.id) as count
      FROM categories c
      LEFT JOIN articles a ON a.category_id = c.id
      GROUP BY c.id
      ORDER BY count DESC
    `).all();

    // Top 5 most read articles
    const topArticles = db.prepare(`
      SELECT id, title, slug, views, likes, created_at
      FROM articles
      WHERE status = 'published'
      ORDER BY views DESC
      LIMIT 5
    `).all();

    // Recent 5 comments
    const recentComments = db.prepare(`
      SELECT c.id, c.author_name, c.content, c.status, c.created_at, a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    // Latest 5 articles
    const latestArticles = db.prepare(`
      SELECT id, title, slug, views, status, created_at
      FROM articles
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        summary: {
          totalArticles,
          totalViews,
          totalComments,
          totalCategories,
          breakingCount
        },
        categoryStats,
        topArticles,
        recentComments,
        latestArticles
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
