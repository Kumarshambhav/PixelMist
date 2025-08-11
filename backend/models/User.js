import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio:      { type: String, default: "" },
  avatarUrl:{ type: String, default: "" }, // optional
  createdAt:{ type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);



