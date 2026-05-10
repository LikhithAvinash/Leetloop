require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/progress'));
app.use('/api', require('./routes/problems'));
app.use('/api', require('./routes/attempts'));
app.use('/api', require('./routes/queue'));
app.use('/api', require('./routes/ai'));


// Search proxy
const { searchLeetCode } = require('./proxy');
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length < 2) return res.json([]);
  try {
    const results = await searchLeetCode(q.trim());
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ LeetTrack server running on http://localhost:${PORT}`);
});
