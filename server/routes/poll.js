import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/poll - Currently active poll
router.get('/', (req, res) => {
  try {
    const poll = db.prepare('SELECT * FROM polls WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
    if (!poll) {
      return res.json({ success: true, data: null });
    }

    const options = db.prepare('SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id ASC').all(poll.id);

    // Calculate percentage for each option
    const optionsWithPercent = options.map(opt => ({
      ...opt,
      percentage: poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        ...poll,
        options: optionsWithPercent
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/poll/:id/vote - Cast vote
router.post('/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { option_id } = req.body;

    if (!option_id) {
      return res.status(400).json({ success: false, message: 'Variant seçilməyib' });
    }

    const option = db.prepare('SELECT * FROM poll_options WHERE id = ? AND poll_id = ?').get(option_id, id);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Variant tapılmadı' });
    }

    // Increment option votes and total votes
    db.prepare('UPDATE poll_options SET votes = votes + 1 WHERE id = ?').run(option_id);
    db.prepare('UPDATE polls SET total_votes = total_votes + 1 WHERE id = ?').run(id);

    const updatedPoll = db.prepare('SELECT * FROM polls WHERE id = ?').get(id);
    const updatedOptions = db.prepare('SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id ASC').all(id);

    const optionsWithPercent = updatedOptions.map(opt => ({
      ...opt,
      percentage: updatedPoll.total_votes > 0 ? Math.round((opt.votes / updatedPoll.total_votes) * 100) : 0
    }));

    res.json({
      success: true,
      message: 'Səsiniz qəbul edildi',
      data: {
        ...updatedPoll,
        options: optionsWithPercent
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/poll/all - Admin all polls
router.get('/all', (req, res) => {
  try {
    const polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all();
    const enriched = polls.map(p => {
      const options = db.prepare('SELECT * FROM poll_options WHERE poll_id = ?').all(p.id);
      return { ...p, options };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/poll - Admin create poll
router.post('/', (req, res) => {
  try {
    const { question, options, is_active = 1 } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Sual və ən azı 2 cavab variantı daxil edilməlidir' });
    }

    // If new poll is active, deactivate others
    if (is_active) {
      db.prepare('UPDATE polls SET is_active = 0').run();
    }

    const pollRes = db.prepare('INSERT INTO polls (question, is_active, total_votes) VALUES (?, ?, 0)')
      .run(question, is_active ? 1 : 0);
    const pollId = pollRes.lastInsertRowid;

    const optStmt = db.prepare('INSERT INTO poll_options (poll_id, option_text, votes) VALUES (?, ?, 0)');
    for (const optText of options) {
      if (optText.trim()) {
        optStmt.run(pollId, optText.trim());
      }
    }

    res.status(201).json({ success: true, message: 'Sorğu yaradıldı', id: pollId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/poll/:id/active - Set active
router.put('/:id/active', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE polls SET is_active = 0').run();
    db.prepare('UPDATE polls SET is_active = 1 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Aktiv sorğu dəyişdirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/poll/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM poll_options WHERE poll_id = ?').run(id);
    db.prepare('DELETE FROM polls WHERE id = ?').run(id);
    res.json({ success: true, message: 'Sorğu silindi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
