
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_FILE = "data.json";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 기본 API
app.get("/api/playlist", (req, res) => {
  const data = readData();
  res.json(data.playlist || []);
});

app.post("/api/playlist", (req, res) => {
  const data = readData();
  data.playlist.push(req.body);
  writeData(data);
  res.json({ success: true });
});

app.post("/api/playlist/delete", (req, res) => {
  const data = readData();
  data.playlist = data.playlist.filter(s => s.id !== req.body.id);
  writeData(data);
  res.json({ success: true });
});

app.post("/api/play", (req, res) => {
  const data = readData();
  data.currentTrack = req.body;
  writeData(data);
  broadcast({ type: "play", ...req.body });
  res.json({ success: true });
});

app.post("/api/pause", (req, res) => {
  const data = readData();
  if (data.currentTrack) data.currentTrack.isPaused = true;
  writeData(data);
  broadcast({ type: "pause" });
  res.json({ success: true });
});

app.get("/api/status", (req, res) => {
  const data = readData();
  res.json(data.currentTrack || {});
});

// HTTP + WebSocket 서버
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(message) {
  const json = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

server.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
