// Context for authentication state
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";

interface User {
id: string;
name: string;
email: string;
location?: string;
avatar?: string;
createdAt: string;
}

interface AuthContextType {
user: User | null;
login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
register: (name: string, email: string, password: string, confirmPassword: string, agreeTerms: boolean) => Promise<void>;
logout: () => void;
isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
    // Load user from localStorage on mount (for rememberMe persistence)
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
    setUser(JSON.parse(storedUser));
    }
}, []);

const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
    const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    const data = await response.json();
    setUser(data.user);  // Assuming backend returns { access_token, user }
    if (rememberMe) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
    } else {
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
    }
    } catch (error) {
    console.error(error);
    throw error;  // Handle in component
    } finally {
    setIsLoading(false);
    }
};

const register = async (name: string, email: string, password: string, confirmPassword: string, agreeTerms: boolean) => {
    // Similar to login, but POST to /register with JSON body
    setIsLoading(true);
    try {
    const response = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirm_password: confirmPassword, agree_terms: agreeTerms }),
    });
    if (!response.ok) throw new Error("Registration failed");
    const data = await response.json();
    // Auto-login after register? Call login() here if desired
    } catch (error) {
    console.error(error);
    throw error;
    } finally {
    setIsLoading(false);
    }
};

const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    // Optional: Call backend /logout if needed
};

return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
    {children}
    </AuthContext.Provider>
);
};