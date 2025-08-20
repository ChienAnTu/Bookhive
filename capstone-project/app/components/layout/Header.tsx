"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { User, LogOut, Plus } from "lucide-react";
import { getCurrentUser } from "@/app/data/mockData";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get current user data
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowProfileMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
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

          {/* Search box */}
          <div className="flex-1 flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-xl">
              <Input
                variant="search"
                placeholder="Search books, authors, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Operation area */}
          <div className="flex items-center space-x-2">
            {/* Lend Books button, display when logged */}
            {isLoggedIn && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="hidden sm:flex"
              >
                Lend Books
              </Button>
            )}
            {/* mobile Lend button */}
            {isLoggedIn && (
              <Button variant="outline" size="sm" className="sm:hidden p-2">
                <Plus className="w-4 h-4" />
              </Button>
            )}

            {/* Profile area */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* profile photo */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* User name - only display for large screen */}
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-20 truncate">
                    {currentUser.name}
                  </span>
                </button>

                {/* Profile file menu */}
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
              /* Logout Status */
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

      {/* Click other area to close the profile menu */}
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
