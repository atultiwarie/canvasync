import axios from "axios";
import { api } from "../../lib/api";
import { useAuthStore, type AuthUser } from "./auth.store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";



export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}



export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post("/api/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<{ user: AuthUser; accessToken: string }> {
    const { data } = await api.post("/api/auth/login", payload);
    return { user: data.user, accessToken: data.accessToken };
  },

  async logout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get("/api/auth/me");
    return data.user;
  },

  async silentRefresh(): Promise<boolean> {
    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const user = useAuthStore.getState().user;
      if (data.accessToken && user) {
        useAuthStore.getState().setAuth(data.accessToken, user);
        return true;
      }
      return false;
    } catch {
      useAuthStore.getState().clearAuth();
      return false;
    }
  },
};
