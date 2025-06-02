const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DATA_PATH = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/'))); // ✅ 이 줄을 추가

// 데이터 로드
function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { currentTrack: null, playlist: [] };
  }
}

// 데이터 저장
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// WebSocket 브로드캐스트
function broadcast(msgObj) {
  const msg = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// WebSocket 수신 처리
wss.on("connection", (ws) => {
  console.log("🔌 WebSocket 연결됨");

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      const db = readData();

      if (msg.type === "play") {
        db.currentTrack = {
          id: msg.id,
          title: msg.title,
          startTime: msg.startTime,
          isPaused: msg.isPaused
        };
        writeData(db);
        broadcast(msg); // 전체에게 전달
      }

      if (msg.type === "pause") {
        if (db.currentTrack) {
          db.currentTrack.isPaused = true;
          writeData(db);
        }
        broadcast(msg);
      }

    // ✅ 추가: seeker 이동 반영
    if (msg.type === "seek") {
      db.currentTrack = {
        id: msg.id,
        title: msg.title,
        startTime: msg.startTime,
        isPaused: msg.isPaused ?? false
      };
      writeData(db);
      broadcast({
        type: "play", // 앱에서는 play 메시지로 받아 처리 중
        id: msg.id,
        title: msg.title,
        startTime: msg.startTime,
        isPaused: db.currentTrack.isPaused
      });
    }
      
    } catch (err) {
      console.error("🚫 WebSocket 메시지 처리 오류:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket 연결 종료");
  });
});

// API: 플레이리스트 불러오기
app.get("/api/playlist", (req, res) => {
  const db = readData();
  res.json(db.playlist || []);
});

// API: 곡 추가
app.post("/api/playlist", (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) return res.status(400).json({ error: "곡 정보가 누락됨" });

  const db = readData();
  if (!Array.isArray(db.playlist)) db.playlist = [];

  db.playlist.push({ id, title });
  writeData(db);

  res.json({ success: true });
});

// API: 곡 삭제
app.post("/api/playlist/delete", (req, res) => {
  const { id } = req.body;
  const db = readData();
  db.playlist = db.playlist.filter(song => song.id !== id);
  writeData(db);
  res.json({ success: true });
});

// API: 현재 재생 곡 상태 반환
app.get("/api/status", (req, res) => {
  const db = readData();
  res.json(db.currentTrack || {});
});

// API: 일시정지 요청
app.post("/api/pause", (req, res) => {
  const db = readData();
  if (db.currentTrack) {
    db.currentTrack.isPaused = true;
    writeData(db);
    broadcast({ type: "pause", id: db.currentTrack.id });
  }
  res.json({ success: true });
});

// API: 재생 상태 수동 설정 (예비용)
app.post("/api/play", (req, res) => {
  const { id, title, startTime, isPaused } = req.body;
  if (!id || !title || !startTime) {
    return res.status(400).json({ error: "id, title, startTime 필수" });
  }

  const db = readData();
  db.currentTrack = {
    id,
    title,
    startTime,
    isPaused: isPaused ?? false // ✅ 클라이언트에서 주면 반영, 없으면 false
  };
  writeData(db);

  broadcast({
    type: "play",
    id,
    title,
    startTime,
    isPaused: db.currentTrack.isPaused
  });

  res.json({ success: true });
});

// API: data.json 전체 조회용 (개발용)
app.get("/api/debug/data", (req, res) => {
  const db = readData();
  res.json(db);
});

app.get("/", (req, res) => {
  res.send("🎵 Potato Music API Server is running!");
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
