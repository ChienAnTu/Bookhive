import axios from "axios";
import type { User } from "@/app/types/user";


// API Configuration
export const getApiUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_API_URL || "https://api.bookborrow.org/";
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

type UpdateUserPayload = Omit<User, "dateOfBirth"> & {
  dateOfBirth?: string | null;
};

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

// Send verification email (OTP)
export const sendVerificationEmail = async (emailAddress: string) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.post(
      `${API_URL}/email/send_verification`,
      { emailAddress },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return {
      success: true,
      message: response.data.message || "Verification email sent successfully.",
    };
  } catch (err) {
    let errorMessage = "Failed to send verification email";

    if (axios.isAxiosError(err)) {
      errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// verify Otp
export const verifyOtp = async (emailAddress: string, otp: string) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.post(`${API_URL}/email/verify_otp`, {
      emailAddress,
      otp,
    });

    return {
      success: true,
      message: response.data.message || "OTP verified successfully.",
    };
  } catch (err) {
    let errorMessage = "OTP verification failed";
    if (axios.isAxiosError(err)) {
      errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return { success: false, message: errorMessage };
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

  // a global response interceptor
  if (!(axios as any)._hasAuthInterceptor) {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("Session expired, logging out...");
          // Clear the local login status
          localStorage.removeItem("access_token");
          delete axios.defaults.headers.common["Authorization"];

          // Notify the global refresh
          window.dispatchEvent(new Event("auth-changed"));

          window.location.href = "/auth";
        }
        return Promise.reject(error);
      }
    );
    (axios as any)._hasAuthInterceptor = true;
  }
};


// Get current user information from API
export const getCurrentUser = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data;

    const user: User = {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber || undefined,
      dateOfBirth: userData.dateOfBirth || undefined,

      country: userData.country,
      streetAddress: userData.streetAddress,
      city: userData.city,
      state: userData.state,
      zipCode: userData.zipCode,
      coordinates: userData.coordinates || undefined,
      maxDistance: userData.maxDistance || undefined,

      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userData.name
        )}&background=f97316&color=fff`,
      profilePicture: userData.profilePicture || undefined,

      createdAt: new Date(userData.createdAt),

      bio: userData.bio || undefined,
      preferredLanguages: userData.preferredLanguages || undefined,
      stripe_account_id: userData.stripe_account_id || undefined,
    };

    return user;
  } catch (error) {
    console.error("Failed to get user info:", error);
    localStorage.removeItem("access_token");
    delete axios.defaults.headers.common["Authorization"];
    return null;
  }
};


// Update user profile
export const updateUser = async (user: Partial<User> & { id: string }) => {
  const API_URL = getApiUrl();

  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("No access token found in localStorage");
    }

    const response = await axios.put(
      `${API_URL}/api/v1/user/${user.id}`,
      user,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Update API failed:", error);
    throw error;
  }
};

// Get any user information by id
export const getUserById = async (id: string): Promise<User | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/user/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("fetch owner response:", response.status, response.data);


    const userData = response.data;

    const user: User = {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber || undefined,
      dateOfBirth: userData.dateOfBirth || undefined,

      country: userData.country,
      streetAddress: userData.streetAddress,
      city: userData.city,
      state: userData.state,
      zipCode: userData.zipCode,
      coordinates: userData.coordinates || undefined,
      maxDistance: userData.maxDistance || undefined,

      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userData.name
        )}&background=f97316&color=fff`,
      profilePicture: userData.profilePicture || undefined,

      createdAt: new Date(userData.createdAt),

      bio: userData.bio || undefined,
      preferredLanguages: userData.preferredLanguages || undefined,
      stripe_account_id: userData.stripe_account_id || undefined,

    };

    return user;
  } catch (error) {
    console.error(`Failed to get user ${id}:`, error);
    return null;
  }
};

//-------- Administrator ban users
const API_URL = getApiUrl();

export type BanItem = {
  ban_id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  banned_by: string;
  is_active: boolean;
};

/**
 * Administrator: Ban the user
 */
export async function createBan(userId: string, reason: string): Promise<BanItem> {
  try {
    const res = await axios.post(
      `${API_URL}/api/v1/bans`,
      { user_id: userId, reason },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err) {
    console.error("Failed to create ban:", err);
    throw err;
  }
}

/**
 * Administrator: Get the ban list
 */
export async function listBans(): Promise<BanItem[]> {
  try {
    const res = await axios.get(`${API_URL}/api/v1/bans`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch ban list:", err);
    throw err;
  }
}

/**
 * Administrator: Lift the ban
 */
export async function unban(banId: string): Promise<BanItem> {
  try {
    const res = await axios.delete(`${API_URL}/api/v1/bans/${banId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to unban:", err);
    throw err;
  }
}


//-------- users add other blackList 
/**
 * Block users
 */
export async function addToBlacklist(blockedUserId: string): Promise<{ message: string }> {
  try {
    const res = await axios.post(
      `${API_URL}/api/v1/blacklists`,
      { blocked_user_id: blockedUserId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err) {
    console.error("Failed to add to blacklist:", err);
    throw err;
  }
}

/**
 * cancel block
 */
export async function removeFromBlacklist(blockedUserId: string): Promise<{ message: string }> {
  try {
    const res = await axios.delete(`${API_URL}/api/v1/blacklists/${blockedUserId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to remove from blacklist:", err);
    throw err;
  }
}

/**
 * Obtain the blacklist list of the current user
 */
export async function listBlacklist(): Promise<string[]> {
  try {
    const res = await axios.get(`${API_URL}/api/v1/blacklists`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch blacklist:", err);
    throw err;
  }
}