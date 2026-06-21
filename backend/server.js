const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "techtube";
const COLLECTION_NAME = "videos";

let videosCollection;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

// =============================
// CONNECT TO MONGODB
// =============================
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    videosCollection = db.collection(COLLECTION_NAME);

    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectDB();

// =============================
// FILE UPLOAD SETUP
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });


// =============================
// ADMIN LOGIN
// =============================
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid login details" });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});


// =============================
// VERIFY ADMIN TOKEN
// =============================
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}

// =============================
// GET ALL VIDEOS
// =============================
app.get("/videos", async (req, res) => {
  try {
    const videos = await videosCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const formattedVideos = videos.map(video => ({
      id: video._id.toString(),
      title: video.title,
      category: video.category,
      thumbnail: video.thumbnail,
      video: video.video,
      duration: video.duration,
      description: video.description,
      featured: video.featured || false,
      views: video.views || 0,
      date: video.date
    }));

    res.json(formattedVideos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

// =============================
// ADD VIDEO
// =============================
app.post("/videos", verifyAdmin, async (req, res) => {
  try {
    const newVideo = {
      title: req.body.title,
      category: req.body.category,
      thumbnail: req.body.thumbnail,
      video: req.body.video,
      duration: req.body.duration,
      description: req.body.description,
      featured: req.body.featured || false,
      views: 0,
      date: new Date().toLocaleDateString(),
      createdAt: new Date()
    };

    const result = await videosCollection.insertOne(newVideo);

    res.json({
      id: result.insertedId.toString(),
      ...newVideo
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add video" });
  }
});

// =============================
// UPLOAD VIDEO FILE
// =============================
app.post("/upload-video", verifyAdmin, upload.single("videoFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const videoUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({ videoUrl });
});

// =============================
// DELETE VIDEO
// =============================
app.delete("/videos/:id", verifyAdmin, async (req, res) => {
  try {
    await videosCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete video" });
  }
});

// =============================
// UPDATE VIDEO
// =============================
app.put("/videos/:id", verifyAdmin, async (req, res) => {
  try {
    const updatedVideo = {
      title: req.body.title,
      category: req.body.category,
      thumbnail: req.body.thumbnail,
      video: req.body.video,
      duration: req.body.duration,
      description: req.body.description,
      featured: video.featured || false,
      updatedAt: new Date()
    };

    const result = await videosCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedVideo },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.json({
      message: "Video updated successfully",
      video: {
        id: result._id.toString(),
        title: result.title,
        category: result.category,
        thumbnail: result.thumbnail,
        video: result.video,
        duration: result.duration,
        description: result.description,
        date: result.date
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update video" });
  }
});

// =============================
// INCREASE VIDEO VIEW COUNT
// =============================
app.patch("/videos/:id/view", async (req, res) => {
  try {
    const result = await videosCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.json({
      id: result._id.toString(),
      views: result.views || 0
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to update views" });
  }
});

// =============================
// UPLOAD THUMBNAIL IMAGE
// =============================
app.post("/upload-thumbnail", verifyAdmin, upload.single("thumbnailFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No thumbnail uploaded" });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const thumbnailUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({ thumbnailUrl });
});

app.listen(PORT, () => {
  console.log(`TechTube backend running on port ${PORT}`);
});