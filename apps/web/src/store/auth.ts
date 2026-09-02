"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "@sportarena/types";

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (data) => set(data),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "sportarena-auth" }
  )
);
