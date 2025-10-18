"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Mail, Lock, User, Hash } from "lucide-react";
import {
  registerUser,
  sendVerificationEmail,
  verifyOtp,
} from "../../utils/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  const onChange =
    (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((s) => ({ ...s, [key]: e.target.value }));

  // === 发送验证码 ===
  const handleSendOtp = async () => {
    if (!formData.email) {
      alert("Please enter your email first.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await sendVerificationEmail(formData.email);
      if (res.success) {
        setOtpSent(true);
        alert("Verification code sent! Please check your inbox.");
      } else {
        alert(res.message || "Failed to send verification email.");
      }
    } catch {
      alert("Failed to send verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  // === 验证验证码 ===
  const handleVerifyOtp = async () => {
    if (!formData.otp) {
      alert("Please enter the verification code.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await verifyOtp(formData.email, formData.otp);
      if (res.success) {
        setIsVerified(true);
        alert("Email verified successfully!");
      } else {
        alert(res.message || "Invalid verification code.");
      }
    } catch {
      alert("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  // === 注册 ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert("Please verify your email first.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      alert("Please agree to the Terms of Service");
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        agree_terms: agreeTerms,
      });

      if (result.success) {
        alert("Account created successfully!");
        router.push("/login");
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join BookBorrow and start sharing books
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <Input
            label="Full Name"
            placeholder="John Doe"
            leftIcon={<User className="w-4 h-4" />}
            value={formData.name}
            onChange={onChange("name")}
            required
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            leftIcon={<Mail className="w-4 h-4" />}
            value={formData.email}
            onChange={onChange("email")}
            required
          />

          {/* Verification Code */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Verification Code"
                placeholder="Enter code"
                leftIcon={<Hash className="w-4 h-4" />}
                value={formData.otp}
                onChange={onChange("otp")}
                required
              />
            </div>
            <Button
              type="button"
              onClick={otpSent ? handleVerifyOtp : handleSendOtp}
              isLoading={isLoading || isVerifying}
              variant={isVerified ? "outline" : "primary"}
              className="min-w-[130px]"
            >
              {isVerified
                ? "Verified"
                : otpSent
                ? isVerifying
                  ? "Verifying..."
                  : "Verify"
                : "Send Code"}
            </Button>
          </div>

          {/* Password */}
          <Input
            label="Password"
            isPassword
            placeholder="Create a password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={formData.password}
            onChange={onChange("password")}
            required
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            isPassword
            placeholder="Confirm your password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={formData.confirmPassword}
            onChange={onChange("confirmPassword")}
            required
          />

          {/* Terms */}
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
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
            disabled={!isVerified}
          >
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        {/* Login link */}
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
