"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "../../utils/auth";
import { Camera } from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: {
    month: string;
    day: string;
    year: string;
  };
  country: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  profilePicture?: string;
}

const UpdateProfilePage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: {
      month: "",
      day: "",
      year: "",
    },
    country: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          // Transform API data to form structure
          setProfileData({
            firstName: userData.name.split(" ")[0] || "",
            lastName: userData.name.split(" ")[1] || "",
            email: userData.email,
            phoneNumber: userData.phoneNumber || "",
            dateOfBirth: {
              month: "",
              day: "",
              year: "",
            },
            country: userData.location || "",
            streetAddress: userData.address || "",
            city: userData.city || "",
            state: userData.state || "",
            zipCode: userData.zipCode || "",
            profilePicture: userData.avatar,
          });
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
    try {
      // Implement API call to update profile
      console.log("Updating profile:", profileData);
      // After successful update
      router.push("/profile");
    } catch (error) {
      console.error("Failed to update profile:", error);
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
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Profile picture
                  </h3>
                  <p className="text-sm text-gray-500">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name*
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last name*
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address*
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.phoneNumber}
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
                  <input
                    type="text"
                    placeholder="MM"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={profileData.dateOfBirth.month}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: {
                          ...profileData.dateOfBirth,
                          month: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="DD"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={profileData.dateOfBirth.day}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: {
                          ...profileData.dateOfBirth,
                          day: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="YYYY"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={profileData.dateOfBirth.year}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dateOfBirth: {
                          ...profileData.dateOfBirth,
                          year: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Country / Region
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.country}
                  onChange={(e) =>
                    setProfileData({ ...profileData, country: e.target.value })
                  }
                >
                  <option value="">Select a country</option>
                  <option value="AU">Australia</option>
                  {/* Add more countries as needed */}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Street address
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.streetAddress}
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
                  City
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.city}
                  onChange={(e) =>
                    setProfileData({ ...profileData, city: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State / Province
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.state}
                  onChange={(e) =>
                    setProfileData({ ...profileData, state: e.target.value })
                  }
                >
                  <option value="">Select a state</option>
                  <option value="NSW">New South Wales</option>
                  <option value="VIC">Victoria</option>
                  {/* Add more states */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP / Postal
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={profileData.zipCode}
                  onChange={(e) =>
                    setProfileData({ ...profileData, zipCode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePage;