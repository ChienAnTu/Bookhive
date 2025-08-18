"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../components/layout/Header";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      alert("Please agree to the Terms of Service");
      return;
    }

    setIsLoading(true);

    // 模拟注册请求
    setTimeout(() => {
      console.log("注册数据:", formData);
      alert("注册功能开发中...");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        {/* 注册卡片 */}
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Join BookHive and start sharing books
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 姓名输入 */}
            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4" />}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

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
              placeholder="Create a password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            {/* 确认密码 */}
            <Input
              label="Confirm Password"
              isPassword
              placeholder="Confirm your password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />

            {/* 同意条款 */}
            <div className="flex items-start">
              <input
                type="checkbox"
                className="mr-3 mt-1"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <label className="text-sm text-gray-600">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* 注册按钮 */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
