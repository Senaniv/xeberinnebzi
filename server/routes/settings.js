import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/settings - Fetch all settings as key-value object
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings - Update settings (Admin)
router.put('/', (req, res) => {
  try {
    const settings = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateMany = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        upsert.run(k, String(v));
      }
    });

    updateMany(settings);

    res.json({ success: true, message: 'Tənzimləmələr yadda saxlanıldı' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
