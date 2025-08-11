// backend/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";
import Post from "./models/Post.js";

dotenv.config();

const PORT = process.env.PORT ;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET ;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authorized" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

/** ---------- AUTH: REGISTER ---------- */
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, bio, avatarUrl } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, bio, avatarUrl });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Registered",
      user: { id: user._id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- AUTH: LOGIN ---------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Logged in",
      user: { id: user._id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- AUTH: LOGOUT ---------- */
app.post("/api/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: false });
  res.json({ message: "Logged out" });
});

/** ---------- PROFILE ---------- */
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/profile", authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatarUrl } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });

    user.username = username ?? user.username;
    user.bio = bio ?? user.bio;
    user.avatarUrl = avatarUrl ?? user.avatarUrl;
    await user.save();

    res.json({ message: "Profile updated", user: { id: user._id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl }});
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: CREATE ---------- */
app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.length > 280) return res.status(400).json({ error: "Invalid content" });

    const post = await Post.create({ author: req.userId, content, likes: [], comments: [] });
    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: GET ALL (FEED) ---------- */
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(posts);
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: GET MY POSTS ---------- */
app.get("/api/my-posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Get my posts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: EDIT ---------- */
app.put("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.length > 280) return res.status(400).json({ error: "Invalid content" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.author.toString() !== req.userId) return res.status(403).json({ error: "Forbidden" });

    post.content = content;
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl");

    res.json(populated);
  } catch (err) {
    console.error("Edit post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: DELETE ---------- */
app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.author.toString() !== req.userId) return res.status(403).json({ error: "Forbidden" });

    await post.remove();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: LIKE / UNLIKE ---------- */
app.post("/api/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });

    const userId = req.userId;
    const idx = post.likes.findIndex(l => l.toString() === userId);
    if (idx >= 0) {
      // unlike
      post.likes.splice(idx, 1);
    } else {
      // like
      post.likes.push(userId);
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl");

    res.json(populated);
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- POSTS: COMMENT ---------- */
app.post("/api/posts/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length > 280) return res.status(400).json({ error: "Invalid comment" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });

    post.comments.push({ user: req.userId, text });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .populate("comments.user", "username avatarUrl");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- START SERVER ---------- */
app.listen(PORT, "0.0.0.0" , () => console.log(`🚀 Server running on port ${PORT}`));




