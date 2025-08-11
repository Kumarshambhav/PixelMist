import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import TweetCard from "../components/TweetCard";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [creating, setCreating] = useState(false);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [showLikes, setShowLikes] = useState({});

  const fetchPosts = async () => {
    try {
    const res = await axios.get("/api/posts",{withCredentials: true});
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchPosts(); 
    AOS.init({ duration: 800, once: true }); // initialize animations
  }, []);

  const createPost = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/posts/${editing._id}`, { content },{withCredentials: true});
        setEditing(null);
      } else {
        await axios.post("/api/posts", { content },{withCredentials: true});
      }
      setContent("");
      setCreating(false);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  const onEdit = (post) => { setEditing(post); setContent(post.content); setCreating(true); };
  const onDelete = async (id) => { 
    if (!confirm("Delete post?")) return; 
    await axios.delete(`/api/posts/${id}`); 
    fetchPosts(); 
  };

  const toggleLike = async (id) => {
    try {
      await axios.post(`/api/posts/${id}/like`,{withCredentials: true});
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (id) => {
    try {
      const text = commentInputs[id];
      if (!text.trim()) return;
      await axios.post(`/api/posts/${id}/comment`, { text },{withCredentials: true});
      setCommentInputs(prev => ({ ...prev, [id]: "" }));
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

      {/* Sticky Glassmorphic Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/50 border-b border-gray-800 shadow-md">
        <Header />
      </div>

      <main className="max-w-3xl mx-auto p-4 pt-24">
        
        {/* Create Tweet */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow mb-4" data-aos="fade-down">
          <div className="flex items-start gap-3">
            <img src={`https://api.dicebear.com/6.x/pixel-art/svg?seed=user`} className="w-12 h-12 rounded-full" alt="avatar" />
            <div className="flex-1">
              <form onSubmit={createPost}>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="What's happening?" 
                  className="w-full p-3 rounded bg-slate-100 dark:bg-slate-700" 
                  rows={3} 
                  maxLength={280}
                />
                <div className="flex justify-between mt-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">{content.length}/280</div>
                  <div>
                    <button 
                      type="button" 
                      onClick={() => { setContent(""); setCreating(false); setEditing(null); }} 
                      className="mr-2 px-3 py-1 bg-gray-300 dark:bg-slate-700 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1 bg-indigo-600 text-white rounded"
                    >
                      {editing ? "Update" : "Tweet"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {posts.map((p, index) => (
            <div 
              key={p._id} 
              className="bg-white dark:bg-slate-800 p-4 rounded shadow" 
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <TweetCard post={p} onEdit={onEdit} onDelete={onDelete} />
              
              {/* Like & Comment Actions */}
              <div className="flex gap-6 mt-3 text-sm">
                <button 
                  onClick={() => setShowLikes(prev => ({ ...prev, [p._id]: !prev[p._id] }))} 
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-400"
                >
                  ❤️ {p.likes?.length || 0}
                </button>
                <button 
                  onClick={() => setShowComments(prev => ({ ...prev, [p._id]: !prev[p._id] }))} 
                  className="flex items-center gap-1 text-green-500 hover:text-green-400"
                >
                  💬 {p.comments?.length || 0}
                </button>
              </div>

              {/* Likes List */}
              {showLikes[p._id] && (
                <div className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-700">
                  {p.likes?.length > 0 ? p.likes.map((u, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm mb-1">
                      <img src={u.avatar || `https://api.dicebear.com/6.x/pixel-art/svg?seed=${u.username}`} className="w-6 h-6 rounded-full" />
                      <span>{u.username}</span>
                    </div>
                  )) : <div className="text-xs text-slate-400">No likes yet</div>}
                </div>
              )}

              {/* Comments Section */}
              {showComments[p._id] && (
                <div className="mt-3">
                  <div className="space-y-2 mb-2">
                    {p.comments?.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded">
                        <img src={c.avatar || `https://api.dicebear.com/6.x/pixel-art/svg?seed=${c.username}`} className="w-6 h-6 rounded-full" />
                        <div>
                          <span className="font-bold">{c.username || "User"}:</span> {c.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      value={commentInputs[p._id] || ""} 
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [p._id]: e.target.value }))} 
                      placeholder="Add a comment..." 
                      className="flex-1 p-2 rounded bg-slate-100 dark:bg-slate-700"
                    />
                    <button 
                      onClick={() => addComment(p._id)} 
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


