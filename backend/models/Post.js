 // backend/models/Post.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, maxlength: 280 },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:  { type: String, required: true, maxlength: 280 },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // store user ids that liked
  comments: [commentSchema]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);


