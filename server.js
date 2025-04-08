
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = "data.json";
const STATUS_FILE = "status.json";

// Ensure files exist
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(STATUS_FILE)) {
  fs.writeFileSync(
    STATUS_FILE,
    JSON.stringify({ id: "", title: "", startTime: 0, isPaused: false })
  );
}

app.get("/api/playlist", (req, res) => {
  const data = fs.readFileSync(DATA_FILE);
  res.json(JSON.parse(data));
});

app.post("/api/playlist", (req, res) => {
  const { title, id } = req.body;
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  data.push({ title, id });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.sendStatus(200);
});

app.post("/api/playlist/delete", (req, res) => {
  const { id } = req.body;
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const filtered = data.filter(item => item.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  res.sendStatus(200);
});

app.post("/api/play", (req, res) => {
  const { id, title, startTime } = req.body;
  const now = Math.floor(Date.now() / 1000); // seconds
  const start = startTime || now;
  const status = { id, title, startTime: start, isPaused: false };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  res.sendStatus(200);
});

app.post("/api/pause", (req, res) => {
  const current = JSON.parse(fs.readFileSync(STATUS_FILE));
  const updated = { ...current, isPaused: true };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(updated, null, 2));
  res.sendStatus(200);
});

app.get("/api/status", (req, res) => {
  const status = fs.readFileSync(STATUS_FILE);
  res.json(JSON.parse(status));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
