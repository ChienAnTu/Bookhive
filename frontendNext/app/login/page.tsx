"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Mail, Lock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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

    // Login simulation
    try {
      const res = await axios.post(
        "http://localhost:8000/api/v1/auth/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          // Only set to true if cookies are relied upon for session management
          withCredentials: false,
        }
      );

      // Retrieve token and store/apply it
      const token: string = res.data.access_token;
      // For security: in production, prefer httpOnly cookies. For a demo, localStorage is acceptable.
      localStorage.setItem("access_token", token);
      axios.defaults.headers.common["Authorisation"] = `Bearer ${token}`;

      console.log("Sign in:", res.data);
      window.location.href = "/books";
    } catch (err) {
      let msg = "Sign in failed";

      if (axios.isAxiosError(err)) {
        msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      console.error("Sign in error:", err);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
      {/* Login card */}
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your BookHive account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* email */}
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

          {/* password */}
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

          {/* click & forget password */}
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

          {/* login button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* cut off line */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* social media login way */}
        <div className="space-y-3">
          <Button variant="outline" fullWidth className="border-gray-300">
            Continue with Google
          </Button>
          <Button variant="outline" fullWidth className="border-gray-300">
            Continue with Apple
          </Button>
        </div>

        {/* register link */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {`Don't have an account? `}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create account
          </Link>
        </div>
      </Card>
    </div>
  );
}
