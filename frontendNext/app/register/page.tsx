"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChange =
    (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((s) => ({ ...s, [key]: e.target.value }));

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

    // Sign up request
    try {
      // Call POST request
      const res = await axios.post(
        "http://localhost:8000/api/v1/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          agree_terms: agreeTerms,
        },
        {
          // Header/Cookie option
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // in case Header and cookie are used
        }
      );

      // if Successful
      console.log("Registered:", res.data);
      alert("Account created successfully!");

      // to /login
      router.push("/login");
    } catch (err) {
      let msg = "Registration failed";

      if (axios.isAxiosError(err)) {
        msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      console.error("Registration error:", err);
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
      {/* Register Card */}
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Join BookHive and start sharing books</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* name */}
          <Input
            label="Full Name"
            placeholder="John Doe"
            leftIcon={<User className="w-4 h-4" />}
            value={formData.name}
            onChange={onChange("name")}
            required
          />

          {/* email */}
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            leftIcon={<Mail className="w-4 h-4" />}
            value={formData.email}
            onChange={onChange("email")}
            required
          />

          {/* password */}
          <Input
            label="Password"
            isPassword
            placeholder="Create a password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={formData.password}
            onChange={onChange("password")}
            required
          />

          {/* confirm password */}
          <Input
            label="Confirm Password"
            isPassword
            placeholder="Confirm your password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={formData.confirmPassword}
            onChange={onChange("confirmPassword")}
            required
          />

          {/* policy */}
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
              <Link href="/terms" className="text-blue-600 hover:text-blue-700">
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

          {/* register button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Link for login */}
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
    </div>
  );
}
