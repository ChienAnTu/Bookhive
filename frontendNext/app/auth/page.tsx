"use client";

import React from "react";
import Link from "next/link";
import Button from "../components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 -mt-16 pt-16">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-center">
        Find Your Next Books
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-8 text-center">
        All Over The World
      </p>
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
  );
}
