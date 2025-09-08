import axios from "axios";
import type { User } from "@/app/types/user";



// API Configuration
const getApiUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://your-production-api.com";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

// Type definitions
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  agree_terms: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  location: string;
  avatar: string;
  createdAt: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// User login function
export const loginUser = async (credentials: LoginCredentials) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.post(
      `${API_URL}/api/v1/auth/login`,
      credentials,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    const token: string = response.data.access_token;

    // Store token in localStorage
    localStorage.setItem("access_token", token);

    // Set default authorization header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return {
      success: true,
      data: response.data,
      token,
    };
  } catch (err) {
    let errorMessage = "Sign in failed";

    if (axios.isAxiosError(err)) {
      errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    throw new Error(errorMessage);
  }
};

// User registration function
export const registerUser = async (userData: RegisterData) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.post(
      `${API_URL}/api/v1/auth/register`,
      userData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    let errorMessage = "Registration failed";

    if (axios.isAxiosError(err)) {
      // Handle field-specific validation errors
      if (err.response?.data?.errors) {
        return {
          success: false,
          fieldErrors: err.response.data.errors,
          message: "Please fix the errors below",
        };
      }

      errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    throw new Error(errorMessage);
  }
};

// User logout function
export const logoutUser = async () => {
  const API_URL = getApiUrl();

  try {
    // Call logout endpoint to invalidate token on server
    await axios.post(
      `${API_URL}/api/v1/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("Logout API failed:", error);
    // Continue with local cleanup even if server request fails
  }

  // Clear local authentication data
  localStorage.removeItem("access_token");
  delete axios.defaults.headers.common["Authorization"];
};

// Check if user is currently authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token");
};

// Get current access token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem("access_token");
};

// Initialize authentication state on app startup
// This restores the authorization header if a valid token exists
export const initAuth = () => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Get current user information from API
export const getCurrentUser = async (): Promise<UserData | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data;
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      location: userData.location,
      phoneNumber: userData.phoneNumber || '',
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      zipCode: userData.zipCode || '',
      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userData.name
        )}&background=f97316&color=fff`,
      createdAt: userData.createdAt,
    };
  } catch (error) {
    console.error("Failed to get user info:", error);
    // Clear invalid token if API call fails
    localStorage.removeItem("access_token");
    delete axios.defaults.headers.common["Authorization"];
    return null;
  }
};

// Update user profile
export const updateUser = async (user: User) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.put(
      `${API_URL}/api/v1/user/${user.id}`,
      user,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );

    return response.data; // Return updated user data
  } catch (error) {
    console.error("Update API failed:", error);
    throw error;
  }
};
