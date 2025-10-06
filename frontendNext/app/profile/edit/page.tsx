"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "../../../utils/auth";
import { Camera } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import type { User } from "@/app/types/user";
import Avatar from "@/app/components/ui/Avatar";
import { toast } from "sonner";
import { updateUser } from "@/utils/auth";
import { uploadFile } from "@/utils/books";
import PaymentAccountPromptModal from "@/app/components/ui/PaymentAccountCompleteModal";
import { createExpressAccount } from "@/utils/payments";

const parseDOB = (dob?: string | null) => {
  if (!dob) return { year: "", month: "", day: "" };
  const m = String(dob).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return { year: "", month: "", day: "" };
  const [_, y, mo, d] = m;
  return { year: y, month: mo.padStart(2, "0"), day: d.padStart(2, "0") };
};


const emptyUser: User = {
  id: "temp",
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  country: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  createdAt: new Date(),
  bio: "",
  avatar: "https://ui-avatars.com/api/?name=Book+Exchange&background=000&color=fff",
  preferredLanguages: [],
};


const UpdateProfilePage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<User>(emptyUser);
  const [showPayAccountModal, setShowPayAccountModal] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [lastSavedUser, setLastSavedUser] = useState<User | null>(null);
  const [dobForm, setDobForm] = useState({ year: "", month: "", day: "" });
const [uploadingAvatar, setUploadingAvatar] = useState(false);

useEffect(() => {
  const loadUserData = async () => {
    if (!isAuthenticated()) {
      router.push("/auth");
      return;
    }

    try {
      const userData = await getCurrentUser();
      if (!userData) {
        router.push("/auth");
        return;
      }

      // 1) profileData
      setProfileData({
        ...(userData as any),
        profilePicture: userData.profilePicture ?? "",
        stripe_account_id: userData.stripe_account_id ?? null,
      } as any);

      // 2) 
      setDobForm(parseDOB(userData.dateOfBirth as any));
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  loadUserData();
}, [router]);


  // 在组件内部
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 组装 DOB: YYYY-MM-DD
    const composeDOB = (y?: string, m?: string, d?: string) =>
      y && m && d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;

    const dateOfBirthStr = composeDOB(dobForm.year, dobForm.month, dobForm.day);

    const payload = {
      ...profileData,
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      dateOfBirth: dateOfBirthStr,               // 后端要字符串
    };

    const result = await updateUser(payload);

    toast.success("Profile updated successfully!");
    setProfileData(prev => ({ ...prev, dateOfBirth: dateOfBirthStr || "" }));
    setDobForm(parseDOB(dateOfBirthStr || ""));

    const hasConnect = !!(
      result?.connectAccountId ||
      result?.stripe_account_id ||
      profileData?.stripe_account_id
    );

    if (!hasConnect) {
      setLastSavedUser(result || profileData);
      setShowPayAccountModal(true);
    } else {
      window.dispatchEvent(new Event("auth-changed"));
      router.push("/profile");
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message || "Update failed");
  } finally {
    setIsLoading(false);
  }
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 可选校验
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    toast.error("Please upload JPG/PNG/WebP image");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image must be ≤ 2MB");
    return;
  }

  try {
    setUploadingAvatar(true);

    // scene = "avatar"
    const url = await uploadFile(file, "avatar");

    // update profilePicture（not avatar）
    setProfileData(prev => ({ ...prev, profilePicture: url }));

    toast.success("Avatar uploaded");
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.detail || "Upload failed");
  } finally {
    setUploadingAvatar(false);
  }
};

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Update Profile
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Profile Picture Upload */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700">
                Profile picture
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative">
                  {/* Avatar */}
                  <Avatar user={profileData} size={96} />

                  {/* upload */}
                  <label className="absolute bottom-0 right-0 bg-black rounded-full p-2 cursor-pointer">
                    <Camera className="w-4 h-4 text-white" />
                    <Input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <p className="text-sm text-gray-500 mt-2">JPG or PNG (max. 2MB)</p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name*
                </label>
                <Input
                  type="text"
                  required
                  value={profileData.firstName || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last name*
                </label>
                <Input
                  type="text"
                  required
                  value={profileData.lastName || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address*
                </label>
                <Input
                  type="email"
                  required
                  value={profileData.email || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <Input
                  type="tel"
                  value={profileData.phoneNumber || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phoneNumber: e.target.value })
                  }
                />
              </div>

              {/* Date of Birth */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date of birth
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="DD"
                    value={dobForm.day}
                    onChange={(e) =>
                      setDobForm((p) => ({ ...p, day: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="MM"
                    value={dobForm.month}
                    onChange={(e) =>
                      setDobForm((p) => ({ ...p, month: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="YYYY"
                    value={dobForm.year}
                    onChange={(e) =>
                      setDobForm((p) => ({ ...p, year: e.target.value }))
                    }
                  />
                </div>
              </div>


              {/* Address Information */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Country / Region*
                </label>
                <Select
                  value={profileData.country || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, country: e.target.value })
                  }
                >
                  <option value="">Select a country</option>
                  <option value="AU">Australia</option>
                  {/* Add more countries as needed */}
                </Select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Street address*
                </label>
                <Input
                  type="text"
                  value={profileData.streetAddress || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      streetAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City*
                </label>
                <Input
                  type="text"
                  value={profileData.city || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, city: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State / Province*
                </label>
                <Select
                  value={profileData.state || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, state: e.target.value })
                  }
                >
                  <option value="">Select a state</option>
                  <option value="NSW">New South Wales</option>
                  <option value="VIC">Victoria</option>
                  <option value="QLD">Queensland</option>
                  <option value="WA">Western Australia</option>
                  <option value="SA">South Australia</option>
                  <option value="TAS">Tasmania</option>
                  <option value="ACT">Australian Capital Territory</option>
                  <option value="NT">Northern Territory</option>
                  {/* Add more states */}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP / Postal*
                </label>
                <Input
                  type="text"
                  value={profileData.zipCode || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, zipCode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-black text-black"
                onClick={() => router.push("/profile")}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
      <PaymentAccountPromptModal
        isOpen={showPayAccountModal}
        onClose={() => setShowPayAccountModal(false)}
        email={lastSavedUser?.email || profileData?.email}
        onConfirm={async () => {
          //「Open payment account」
          if (!(lastSavedUser?.email || profileData?.email)) {
            toast.error("Please login first.");
            return;
          }
          try {
            setCreatingLink(true);
            const { onboarding_url } = await createExpressAccount(
              lastSavedUser?.email || profileData.email!
            );
            setShowPayAccountModal(false);
            window.location.href = onboarding_url; // Jump to Stripe
          } catch (e: any) {
            console.error(e);
            toast.error(e?.response?.data?.detail || "Failed to create payment account");
          } finally {
            setCreatingLink(false);
          }
        }}
        loading={creatingLink}
      />

    </div>
  );
};

export default UpdateProfilePage;