"use client";

import React from "react";
import Link from "next/link"; // 添加这行导入
import Header from "./components/layout/Header";
import Button from "./components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          {/* 主标题 */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Next Books
          </h1>

          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            At Your Nearest Suburbs
          </p>

          {/* 登录和注册按钮 - 添加链接 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="w-32 py-3">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="w-32 py-3">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
