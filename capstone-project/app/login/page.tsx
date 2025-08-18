"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../components/layout/Header";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 模拟登录请求
    setTimeout(() => {
      console.log("登录数据:", formData);
      alert("登录功能开发中...");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        {/* 登录卡片 */}
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your BookHive account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱输入 */}
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            {/* 密码输入 */}
            <Input
              label="Password"
              isPassword
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* 社交登录 */}
          <div className="space-y-3">
            <Button variant="outline" fullWidth className="border-gray-300">
              Continue with Google
            </Button>
            <Button variant="outline" fullWidth className="border-gray-300">
              Continue with Apple
            </Button>
          </div>

          {/* 注册链接 */}
          <div className="text-center mt-6 text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create account
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
