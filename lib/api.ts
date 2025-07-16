const API_BASE =
  typeof window !== "undefined" && window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`
    : "/api"

// --- Token Management ---
const TOKEN_KEY = "glu_jwt_token"

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// ---------- Safe JSON parsing ----------
async function parseJSONSafe(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    // Fallback when backend sent HTML / plain-text
    return { error: text }
  }
}

function assertOk(res: Response, data: any) {
  if (!res.ok) {
    const message = typeof data === "object" && data?.error ? data.error : `Request failed with status ${res.status}`
    throw new Error(message)
  }
}

function authHeaders(): Record<string, string> {
  // Remove authentication for MVP deployability
  return {}
  // const token = getToken();
  // // For testing without authentication, we'll use a default token
  // // In production, this should require proper authentication
  // const testToken = token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWNwYW4xYjgwMDAwcnp1bzd4OTBnZXY1IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzUxNjYyNTIzLCJleHAiOjE3NTIyNjczMjN9.eA1j8O6r7IRbOiFADXyZ0WUPI9u_6IZVksYgP53_o3M";
  // return { Authorization: `Bearer ${testToken}` };
}

// --- API Calls ---

export async function register({ email, password, name }: { email: string; password: string; name: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  })
  const data = await res.json()
  if (data.token) setToken(data.token)
  return data
}

export async function login({ email, password }: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (data.token) setToken(data.token)
  return data
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: { ...authHeaders() },
  })
  return res.json()
}

export async function updateProfile({ name }: { name: string }) {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function logMeal({ description, mealType }: { description: string; mealType: string }) {
  try {
    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ description, mealType }),
    })

    const data = await parseJSONSafe(res)

    if (!res.ok) {
      console.error("logMeal backend error:", data)
      return { error: typeof data === "object" ? (data.error ?? "Internal error") : String(data) }
    }

    return data
  } catch (err) {
    console.error("logMeal network error:", err)
    return { error: "Network error while logging meal" }
  }
}

export async function getMeals({ page = 1, limit = 20, date }: { page?: number; limit?: number; date?: string } = {}) {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (date) params.append("date", date)

    const res = await fetch(`${API_BASE}/meals?${params.toString()}`, {
      headers: { ...authHeaders() },
    })

    const data = await parseJSONSafe(res)

    // If the backend sent a 500, return a safe empty structure instead of throwing
    if (!res.ok) {
      console.error("getMeals backend error:", data)
      return {
        meals: [],
        pagination: { page, limit, total: 0, pages: 0 },
        error: typeof data === "object" ? (data.error ?? "Internal server error") : String(data),
      }
    }

    return data
  } catch (err) {
    // Network or parsing failure – surface an empty list instead of exploding
    console.error("getMeals network error:", err)
    return {
      meals: [],
      pagination: { page, limit, total: 0, pages: 0 },
      error: "Network error while fetching meals",
    }
  }
}

export async function aiAnalyze({
  description,
  action = "analyze",
}: { description: string; action?: "analyze" | "clarify" }) {
  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ description, action }),
  })
  return res.json()
}
