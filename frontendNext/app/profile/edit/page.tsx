
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
import { updateUser } from "../../../utils/auth";


const emptyUser: User = {
  id: "temp",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: { month: "", day: "", year: "" },
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

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setProfileData(userData);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Concatenate full name
    const payload = {
      ...profileData,
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
    };

    const result = await updateUser(payload);

    console.log("✅ Profile updated:", result);
    toast.success("Profile updated successfully!");

    window.dispatchEvent(new Event("auth-changed"));
    router.push("/profile");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Update failed");
    console.error("❌ Failed to update profile:", error);
  } finally {
    setIsLoading(false);
  }
};


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Implement image upload logic
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          profilePicture: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
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
                  {/* Avatar display: if user has uploaded new avatar (profilePicture), display it first */}
                  {profileData.profilePicture ? (
                    <img src={profileData.profilePicture} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <Avatar user={profileData} size={96} />
                  )}


                  {/* Upload button */}
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
                    value={profileData.dateOfBirth?.day || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: { ...profileData.dateOfBirth!, day: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="MM"
                    value={profileData.dateOfBirth?.month || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: { ...profileData.dateOfBirth!, month: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="YYYY"
                    value={profileData.dateOfBirth?.year || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: { ...profileData.dateOfBirth!, year: e.target.value },
                      })
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
                  value={profileData.bio || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tell others a bit about yourself and your reading interests.
                </p>
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
    </div>
  );
};

export default UpdateProfilePage;