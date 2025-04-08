const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 파일 경로
const DATA_PATH = './data.json';

// 기본 JSON 구조
const defaultData = {
  currentTrack: null,
  playlist: []
};

// CORS 허용 및 JSON 파싱
app.use(cors());
app.use(express.json());

// JSON 파일 읽기
function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH));
}

// JSON 파일 저장
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// 🔁 서버 정상 작동 확인용
app.get('/', (req, res) => {
  res.send('✅ 서버 정상 작동 중입니다!');
});

// ✅ 현재 재생 중인 곡 가져오기
app.get('/api/status', (req, res) => {
  const data = readData();
  res.json(data.currentTrack);
});

// ✅ 플레이리스트 가져오기
app.get('/api/playlist', (req, res) => {
  const data = readData();
  res.json(data.playlist);
});

// ✅ 새 곡 추가하기
app.post('/api/playlist', (req, res) => {
  const data = readData();
  const { id, title } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'id와 title은 필수입니다.' });
  }

  data.playlist.push({ id, title });
  saveData(data);
  res.json({ ok: true });
});

// ✅ 곡 재생 시작 (현재 재생 곡 설정)
app.post('/api/play', (req, res) => {
  const { id, title } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'id와 title은 필수입니다.' });
  }

  const data = readData();
  data.currentTrack = {
    id,
    title,
    startedAt: Date.now()
  };

  saveData(data);
  res.json({ ok: true });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🎵 서버 실행 중: http://localhost:${PORT}`);
});
