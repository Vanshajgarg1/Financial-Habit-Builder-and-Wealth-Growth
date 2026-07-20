"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import api, { getToken, removeToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = getToken();
      if (token) {
        const u = await api.auth.me() as User;
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (token: string) => {
    setLoading(true);
    localStorage.setItem("fingrow_token", token);
    await refreshUser();
    router.push("/dashboard");
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  // Auth routing check
  useEffect(() => {
    if (!loading) {
      const publicRoutes = ["/", "/login", "/signup"];
      const isPublic = publicRoutes.includes(pathname);
      if (!user && !isPublic) {
        router.push("/login");
      } else if (user && isPublic && pathname !== "/") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
