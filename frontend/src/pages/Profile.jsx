import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState({ username: "", bio: "", avatarUrl: "" });
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/profile", { withCredentials: true });
      setUser(res.data);
      setEditing({
        username: res.data.username,
        bio: res.data.bio || "",
        avatarUrl: res.data.avatarUrl || "",
      });
      fetchUserPosts();
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get("/api/my-posts", { withCredentials: true });
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProfile = async () => {
    try {
      await axios.put("/api/profile", editing, { withCredentials: true });
      alert("Profile saved!");
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/posts/${id}`, { withCredentials: true });
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingPost = (post) => {
    setEditingPostId(post._id);
    setEditingContent(post.content);
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingContent("");
  };

  const savePostEdit = async (id) => {
    try {
      await axios.put(
        `/api/posts/${id}`,
        { content: editingContent },
        { withCredentials: true }
      );
      setEditingPostId(null);
      setEditingContent("");
      fetchUserPosts();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />
      <main className="max-w-3xl mx-auto p-4">
        {/* Profile Info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl mb-3">Profile</h2>
            <button
              onClick={() => navigate("/feed")}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Feed
            </button>
          </div>

          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/6.x/pixel-art/svg?seed=${user.username}`
                  }
                  alt="avatar"
                  className="w-32 h-32 rounded-full mb-3"
                />
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Username</label>
                <input
                  value={editing.username}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700"
                />
                <label className="block text-sm mt-2">Bio</label>
                <textarea
                  value={editing.bio}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700"
                  rows={4}
                />
                <label className="block text-sm mt-2">Avatar URL</label>
                <input
                  value={editing.avatarUrl}
                  onChange={(e) => setEditing({ ...editing, avatarUrl: e.target.value })}
                  className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700"
                />
                <div className="mt-4">
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 bg-indigo-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Posts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded shadow mt-6">
          <h3 className="text-xl font-semibold mb-3">My Posts</h3>
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post._id}
                className="p-3 mb-3 border rounded-lg bg-gray-100 dark:bg-gray-700"
              >
                {editingPostId === post._id ? (
                  <>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-2 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => savePostEdit(post._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingPost}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{post.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingPost(post)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post._id)}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No posts yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

