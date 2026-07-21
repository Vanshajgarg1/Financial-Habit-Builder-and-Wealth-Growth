const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fingrow_token");
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("fingrow_token", token);
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("fingrow_token");
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    // Handle expired or invalid token
    if (res.status === 401) {
      removeToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }

    if (res.status === 204) return {} as T;
    return res.json();
  } catch (error: any) {
    throw error;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: async (data: object) => {
      const res = await request<{ access_token?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.access_token) setToken(res.access_token);
      return res;
    },

    login: async (data: any) => {
      // Handles both JSON payloads and FastAPI OAuth2 Form data formats
      const res = await request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.access_token) {
        setToken(res.access_token);
      }
      return res;
    },

    me: () => request("/api/auth/me"),
    
    logout: () => {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },

    update: (data: object) =>
      request("/api/auth/me", { method: "PUT", body: JSON.stringify(data) }),

    changePassword: (data: object) =>
      request("/api/auth/change-password", { method: "POST", body: JSON.stringify(data) }),

    deleteAccount: () =>
      request("/api/auth/me", { method: "DELETE" }),
  },

  dashboard: {
    summary: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set("month", String(month));
      if (year) params.set("year", String(year));
      return request(`/api/dashboard/summary?${params}`);
    },
    charts: (year?: number) => {
      const params = year ? `?year=${year}` : "";
      return request(`/api/dashboard/charts${params}`);
    },
    insights: () => request("/api/dashboard/insights"),
  },

  income: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : "";
      return request(`/api/incomes${q}`);
    },
    create: (data: object) =>
      request("/api/incomes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/incomes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/incomes/${id}`, { method: "DELETE" }),
  },

  expenses: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : "";
      return request(`/api/expenses${q}`);
    },
    create: (data: object) =>
      request("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/expenses/${id}`, { method: "DELETE" }),
  },

  goals: {
    list: () => request("/api/goals"),
    create: (data: object) =>
      request("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/goals/${id}`, { method: "DELETE" }),
    contributions: (id: number) => request(`/api/goals/${id}/contributions`),
    addContribution: (id: number, data: object) =>
      request(`/api/goals/${id}/contributions`, { method: "POST", body: JSON.stringify(data) }),
  },

  investments: {
    list: () => request("/api/investments"),
    create: (data: object) =>
      request("/api/investments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/investments/${id}`, { method: "DELETE" }),
  },

  habits: {
    list: () => request("/api/habits"),
    create: (data: object) =>
      request("/api/habits", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/habits/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/habits/${id}`, { method: "DELETE" }),
    complete: (id: number) =>
      request(`/api/habits/${id}/complete`, { method: "POST" }),
    undoComplete: (id: number) =>
      request(`/api/habits/${id}/complete`, { method: "DELETE" }),
    history: (id: number) => request(`/api/habits/${id}/history`),
  },

  challenges: {
    list: () => request("/api/challenges"),
    create: (data: object) =>
      request("/api/challenges", { method: "POST", body: JSON.stringify(data) }),
    join: (id: number) =>
      request(`/api/challenges/${id}/join`, { method: "POST" }),
    userChallenges: () => request("/api/user-challenges"),
    updateProgress: (id: number, progress: number) =>
      request(`/api/user-challenges/${id}/progress`, {
        method: "PUT",
        body: JSON.stringify({ progress }),
      }),
    leave: (id: number) =>
      request(`/api/user-challenges/${id}`, { method: "DELETE" }),
  },

  reminders: {
    list: () => request("/api/reminders"),
    create: (data: object) =>
      request("/api/reminders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) =>
      request(`/api/reminders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/api/reminders/${id}`, { method: "DELETE" }),
  },

  transactions: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : "";
      return request(`/api/transactions${q}`);
    },
  },

  reports: {
    get: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : "";
      return request(`/api/reports${q}`);
    },
    exportUrl: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set("month", String(month));
      if (year) params.set("year", String(year));
      return `${API_URL}/api/reports/export?${params}&token=${getToken()}`;
    },
  },

  badges: {
    list: () => request("/api/badges"),
  },
};

export default api;
