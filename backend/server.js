const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const DB_FILE = path.join(__dirname, "db.json");

function readVideos() {
  const data = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(data);
}

function saveVideos(videos) {
  fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.get("/videos", (req, res) => {
  const videos = readVideos();
  res.json(videos);
});

app.post("/videos", (req, res) => {
  const videos = readVideos();

  const newVideo = {
    id: Date.now().toString(),
    title: req.body.title,
    category: req.body.category,
    thumbnail: req.body.thumbnail,
    video: req.body.video,
    duration: req.body.duration,
    description: req.body.description,
    date: new Date().toLocaleDateString()
  };

  videos.push(newVideo);
  saveVideos(videos);

  res.json(newVideo);
});

app.post("/upload-video", upload.single("videoFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" });
  }

  const videoUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ videoUrl });
});

app.delete("/videos/:id", (req, res) => {
  const videos = readVideos();
  const filteredVideos = videos.filter(video => video.id !== req.params.id);

  saveVideos(filteredVideos);

  res.json({ message: "Video deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`TechTube backend running on http://localhost:${PORT}`);
});