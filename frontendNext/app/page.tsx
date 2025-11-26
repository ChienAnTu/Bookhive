"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import RecentAdded from "@/app/components/common/RecentAdded";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else if (hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
  }
}

export default function HomePage() {
  const greeting = getGreeting();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="relative w-full h-[80vh] overflow-hidden mb-10 rounded-b-[7rem]" // 顶部直角，底部大弧度
        style={{
          backgroundImage: "url('/images/home.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 半透明遮罩 */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Hi! Welcome back
          </h1>
          <p className="text-lg text-gray-200 mb-8">
            BookBorrow — where every book finds a new friend.
          </p>

          <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find your next reading.."
              className="w-full px-6 py-4 text-lg rounded-xl bg-white text-gray-900 shadow focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white px-6 py-2 rounded-lg border-black hover:bg-gray-800 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Your Book Community
        </h2>
        <p className="text-gray-600 text-lg">
          Connect with readers around you, share your favorite books, and explore new stories every day.
        </p>
      </div>

      {/* Recent Added*/}
      <div className="max-w-7xl mx-auto px-6">
        <RecentAdded />
      </div>
    </div>
  );
}
