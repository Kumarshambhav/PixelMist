import React from "react";

export default function TweetCard({ post, onEdit, onDelete, currentUser }) {
  const isAuthor = currentUser && post.author?._id === currentUser._id;

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded p-4 flex gap-3">
      <img
        src={
          post.author.avatarUrl ||
          `https://api.dicebear.com/6.x/pixel-art/svg?seed=${post.author.username}`
        }
        alt="avatar"
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {post.author.username}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Only show if author */}
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(post)}
                className="px-2 py-1 bg-yellow-500 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(post._id)}
                className="px-2 py-1 bg-red-500 rounded"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <p className="mt-2 text-slate-800 dark:text-slate-200">{post.content}</p>
      </div>
    </div>
  );
}
