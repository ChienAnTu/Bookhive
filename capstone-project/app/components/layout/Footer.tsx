// components/common/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center space-y-3">
          {/* Copyright */}
          <p className="text-sm text-gray-500">
            &copy; 2025 BookHive. All rights reserved.
          </p>
          {/* Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link
              href="/about"
              className="hover:text-orange-500 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="hover:text-orange-500 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
