import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/login", {method:"POST" , credentials:"include",body:JSON.stringify(form)});
      navigate("/feed");
    } catch (err) { alert(err.response?.data?.error || "Error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded shadow">
        <h2 className="text-2xl mb-4 text-slate-900 dark:text-white">Welcome back</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="email" type="email" placeholder="Email" required onChange={(e)=>setForm({...form,email:e.target.value})} className="p-3 rounded bg-slate-100 dark:bg-slate-700"/>
          <input name="password" type="password" placeholder="Password" required onChange={(e)=>setForm({...form,password:e.target.value})} className="p-3 rounded bg-slate-100 dark:bg-slate-700"/>
          <button className="mt-2 p-3 bg-indigo-600 text-white rounded">Login</button>
        </form>
      </div>
    </div>
  );
}

