"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { User, LogOut, Plus } from "lucide-react";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    alert("已退出登录");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* 减少 padding，使用 px-2 sm:px-4 lg:px-6 */}
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* 左侧：Logo - 固定宽度 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                BookHive
              </span>
            </Link>
          </div>

          {/* 中间：搜索框 - 占据剩余空间 */}
          <div className="flex-1 min-w-0 mx-2 sm:mx-4 max-w-2xl">
            <Input
              variant="search"
              placeholder="Search books, authors, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 右侧：操作区 - 固定宽度，紧凑排列 */}
          <div className="flex items-center space-x-2">
            {/* Lend Books 按钮 */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="hidden sm:flex"
            >
              Lend Books
            </Button>

            {/* 移动端简化版 Lend 按钮 */}
            <Button variant="outline" size="sm" className="sm:hidden p-2">
              <Plus className="w-4 h-4" />
            </Button>

            {/* 用户资料区 */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* 用户头像 */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* 用户名 - 只在大屏幕显示 */}
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-20 truncate">
                    Zhenyi Su
                  </span>
                </button>

                {/* 下拉菜单 */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 未登录状态 - 紧凑排列 */
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Login
                </Button>
                <Button size="sm">Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
