"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { loginUser } from "../../utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      console.log("Sign in:", result.data);
      toast.success("Successfully signed in!");

      window.dispatchEvent(new Event("auth-changed"));
      router.push("/books");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
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

          {/* remember me & forget password */}
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

        {/* divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* social media login */}
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
