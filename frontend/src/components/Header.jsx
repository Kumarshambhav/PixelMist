import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Header({ onRefresh }) {
  const navigate = useNavigate();

  const logout = async () => {
    await axios.post("/api/logout");
    navigate("/login");
  };

  return (
    <header className="w-full bg-gradient-to-r from-slate-900 to-black text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-2"
        >
          <img
            src="https://i.postimg.cc/43CqmXPk/Chat-GPT-Image-Aug-11-2025-05-02-45-AM.png" // replace with your hosted logo link
            alt="PixelMist Logo"
            className="h-10 w-auto"
          />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/profile")}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
        >
          Profile
        </button>
        <button
          onClick={logout}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

