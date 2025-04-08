const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_PATH = './data.json';

// 기본 데이터
const defaultData = {
  currentTrack: null,
  playlist: []
};

// 데이터 불러오기
function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH));
}

// 데이터 저장
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// 🎵 현재 재생 중인 곡
app.get('/api/status', (req, res) => {
  const data = readData();
  res.json(data.currentTrack);
});

// 📜 플레이리스트 가져오기
app.get('/api/playlist', (req, res) => {
  const data = readData();
  res.json(data.playlist);
});

// ➕ 노래 추가
app.post('/api/playlist', (req, res) => {
  const data = readData();
  const { id, title } = req.body;
  data.playlist.push({ id, title });
  saveData(data);
  res.json({ ok: true });
});

// ▶️ 특정 곡 재생 시작
app.post('/api/play', (req, res) => {
  const { id, title } = req.body;
  const startedAt = Date.now();
  const data = readData();
  data.currentTrack = { id, title, startedAt };
  saveData(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
