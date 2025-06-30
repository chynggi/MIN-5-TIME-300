"use client";
import React, { useState } from "react";
import { useApi } from "@/lib/useApi";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";

const LoginPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loginApi = useApi("post", "/login");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginApi.request(form);
      if (!data || !data.token) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-blue-700 text-center mb-2 mt-8">로그인</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center justify-center py-4">
        <input
          type="email"
          name="email"
          placeholder="이메일"
          value={form.email}
          onChange={handleChange}
          required
          className="w-64 max-w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none mx-auto"
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          required
          className="w-64 max-w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none mx-auto"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-64 max-w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition disabled:opacity-60 mx-auto"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {error && <div className="text-red-500 text-sm text-center w-64 mx-auto">{error}</div>}
      </form>
      <div className="text-center text-sm mt-2 mb-8">
        계정이 없으신가요? <a href="/signup" className="text-blue-600 hover:underline">회원가입</a>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
