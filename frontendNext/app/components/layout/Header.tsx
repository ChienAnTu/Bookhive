"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { User, LogOut, Plus, Truck, LifeBuoy, ShoppingBag } from "lucide-react";
import {
  logoutUser,
  isAuthenticated,
  getCurrentUser,
} from "../../../utils/auth";

import Avatar from "@/app/components/ui/Avatar";



const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    location: string;
    avatar: string;
    createdAt: string;
  } | null>(null);

  // Check authentication status on component mount and when auth changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        // Fetch user data from API if logged in
        const user = await getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    };

    checkAuthStatus();

    // Handle authentication state changes
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    // Listen for custom auth-changed events and storage changes
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", checkAuthStatus);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setShowProfileMenu(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Clear frontend state even if logout API fails
      setIsLoggedIn(false);
      setCurrentUser(null);
      router.push("/login");
    }
  };

  // Navigate to login page
  const handleLogin = () => {
    router.push("/login");
  };

  // Navigate to signup page
  const handleSignUp = () => {
    router.push("/register");
  };

  // Navigate to Shopping Cart
  const HeaderCart = () => {
    const cartCount = useCartStore((state) => state.cart.length);

    return (
      <Link href="/cart" className="relative inline-block">
        <ShoppingBag className="w-6 h-6 text-gray-700" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {cartCount}
          </span>
        )}
      </Link>
    );
  };


  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transform-none">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo section */}
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
              {/* input */}
              <Input
                variant="search"
                placeholder="Search books, authors, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log("Searching:", searchQuery);
                  }
                }}
                className="w-full"
              />
            </div>
          </div>


          {/* Action buttons area */}
          <div className="flex items-center space-x-2">
            {/* Lend Books button - visible when user is logged in (desktop) */}
            {isLoggedIn && (
              <Link href="/lend/add">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="hidden sm:flex"
                >
                  Start Lending
                </Button>
              </Link>
            )}

            {/* Lend Books button - mobile version (icon only) */}
            {isLoggedIn && (
              <Button variant="outline" size="sm" className="sm:hidden p-2">
                <Plus className="w-4 h-4" />
              </Button>
            )}

            {/* Shopping Cart button - count items */}
            <div className="flex items-center space-x-4">
              <HeaderCart />
              {/* 这里可以继续放 User / Login 按钮 */}
            </div>

            {/* User profile section - shown when logged in */}
            {isLoggedIn && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100"
                >
                  {/* User avatar */}
                  <Avatar user={currentUser} size={32} />

                  {/* User name - only visible on large screens */}
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-20 truncate">
                    {currentUser.name}
                  </span>
                </button>

                {/* Profile dropdown menu */}
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

                    {/* New Shipping entry */}
                    <Link
                      href="/shipping"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Truck className="w-4 h-4 mr-3" />Shipping
                    </Link>

                    {/* New Support entry */}
                    <Link
                      href="/complain"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <LifeBuoy className="w-4 h-4 mr-3" />Support
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
              /* Authentication buttons - shown when not logged in */
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleLogin}>
                  Login
                </Button>
                <Button size="sm" onClick={handleSignUp}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close profile menu when clicking outside */}
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

