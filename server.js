const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'
    )
  `);
}

const USERS = ['far', 'lucca', 'soren'];
const DEFAULT_USER = { done: [], quizDone: 0, chatCount: 0 };

async function loadProgress() {
  const { rows } = await pool.query('SELECT user_id, data FROM progress');
  const result = {};
  USERS.forEach(u => { result[u] = { ...DEFAULT_USER }; });
  result.apiKey = '';
  for (const row of rows) {
    if (USERS.includes(row.user_id)) {
      result[row.user_id] = row.data;
    } else if (row.user_id === 'shared') {
      result.apiKey = row.data.apiKey || '';
    }
  }
  return result;
}

async function saveProgress(data) {
  const queries = USERS.map(u => {
    const userData = data[u] || { ...DEFAULT_USER };
    return pool.query(
      `INSERT INTO progress (user_id, data) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET data = $2`,
      [u, JSON.stringify(userData)]
    );
  });
  queries.push(pool.query(
    `INSERT INTO progress (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2`,
    ['shared', JSON.stringify({ apiKey: data.apiKey || '' })]
  ));
  await Promise.all(queries);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/progress', async (req, res) => {
  try {
    res.json(await loadProgress());
  } catch (e) {
    console.error('GET /api/progress fejl:', e.message);
    res.status(500).json({ error: 'Database fejl' });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    await saveProgress(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/progress fejl:', e.message);
    res.status(500).json({ error: 'Database fejl' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ✦  AI Læringsbog kører!');
    console.log(`  http://localhost:${PORT}`);
    console.log('  📦 Postgres forbundet');
    console.log('');
  });
}).catch(e => {
  console.error('Database init fejl:', e.message);
  process.exit(1);
});
