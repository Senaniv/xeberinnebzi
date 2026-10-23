import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

import { initDatabase } from './db.js';
import newsRoutes from './routes/news.js';
import categoryRoutes from './routes/categories.js';
import breakingRoutes from './routes/breaking.js';
import pollRoutes from './routes/poll.js';
import commentRoutes from './routes/comments.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil faylları qəbul edilir'));
    }
  }
});

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fayl seçilməyib' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount API routes
app.use('/api/news', newsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/breaking', breakingRoutes);
app.use('/api/poll', pollRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Client routing
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

app.get('/article/:idOrSlug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'article.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  "Günün Nəbzi" Xəbər Portalı & Admin Paneli Aktivdir`);
  console.log(`  Portal:      http://localhost:${PORT}`);
  console.log(`  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`  API:         http://localhost:${PORT}/api/news`);
  console.log(`===================================================`);
});
