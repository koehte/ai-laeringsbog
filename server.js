const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'progress.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadProgress() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {}
  return {
    far: { done: [], quizDone: 0, chatCount: 0 },
    lucca: { done: [], quizDone: 0, chatCount: 0 },
    soren: { done: [], quizDone: 0, chatCount: 0 },
    apiKey: ''
  };
}

function saveProgress(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/progress', (req, res) => {
  res.json(loadProgress());
});

app.post('/api/progress', (req, res) => {
  try {
    saveProgress(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Fejl' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ✦  AI Læringsbog kører!');
  console.log(`  http://localhost:${PORT}`);
  console.log('');
});
