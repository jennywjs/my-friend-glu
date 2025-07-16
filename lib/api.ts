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

// ---------- Safe JSON parsing with detailed error info ----------
async function parseJSONSafe(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch (parseError) {
    // Return detailed error info when JSON parsing fails
    console.error("JSON parse error:", parseError)
    console.error("Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
    return {
      error: `Server returned invalid JSON. Status: ${res.status} ${res.statusText}. Response: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`,
      rawResponse: text,
      status: res.status,
      statusText: res.statusText,
    }
  }
}

function authHeaders(): Record<string, string> {
  // Remove authentication for MVP deployability
  return {}
}

// --- API Calls with detailed error handling ---

export async function register({ email, password, name }: { email: string; password: string; name: string }) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await parseJSONSafe(res)
    if (data.token) setToken(data.token)
    return data
  } catch (err) {
    console.error("Register error:", err)
    return { error: `Registration failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function login({ email, password }: { email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await parseJSONSafe(res)
    if (data.token) setToken(data.token)
    return data
  } catch (err) {
    console.error("Login error:", err)
    return { error: `Login failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function getProfile() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { ...authHeaders() },
    })
    return await parseJSONSafe(res)
  } catch (err) {
    console.error("Get profile error:", err)
    return { error: `Failed to get profile: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function updateProfile({ name }: { name: string }) {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name }),
    })
    return await parseJSONSafe(res)
  } catch (err) {
    console.error("Update profile error:", err)
    return { error: `Failed to update profile: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function logMeal({ description, mealType }: { description: string; mealType: string }) {
  try {
    console.log(`Attempting to log meal: ${description} (${mealType})`)

    const res = await fetch(`${API_BASE}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ description, mealType }),
    })

    console.log(`Response status: ${res.status} ${res.statusText}`)
    console.log(`Response headers:`, Object.fromEntries(res.headers.entries()))

    const data = await parseJSONSafe(res)
    console.log("Parsed response data:", data)

    if (!res.ok) {
      const errorMsg = `Failed to log meal (${res.status} ${res.statusText}): ${
        typeof data === "object" && data?.error
          ? data.error
          : data?.rawResponse
            ? `Server returned: ${data.rawResponse.substring(0, 300)}`
            : "Unknown server error"
      }`
      console.error("logMeal backend error:", errorMsg)
      return { error: errorMsg }
    }

    return data
  } catch (err) {
    const errorMsg = `Network error while logging meal: ${err instanceof Error ? err.message : String(err)}`
    console.error("logMeal network error:", err)
    return { error: errorMsg }
  }
}

export async function getMeals({ page = 1, limit = 20, date }: { page?: number; limit?: number; date?: string } = {}) {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (date) params.append("date", date)

    const url = `${API_BASE}/meals?${params.toString()}`
    console.log(`Fetching meals from: ${url}`)

    const res = await fetch(url, {
      headers: { ...authHeaders() },
    })

    console.log(`getMeals response status: ${res.status} ${res.statusText}`)

    const data = await parseJSONSafe(res)
    console.log("getMeals parsed data:", data)

    if (!res.ok) {
      const errorMsg = `Failed to fetch meals (${res.status} ${res.statusText}): ${
        typeof data === "object" && data?.error
          ? data.error
          : data?.rawResponse
            ? `Server returned: ${data.rawResponse.substring(0, 300)}`
            : "Unknown server error"
      }`
      console.error("getMeals backend error:", errorMsg)
      return {
        meals: [],
        pagination: { page, limit, total: 0, pages: 0 },
        error: errorMsg,
      }
    }

    return data
  } catch (err) {
    const errorMsg = `Network error while fetching meals: ${err instanceof Error ? err.message : String(err)}`
    console.error("getMeals network error:", err)
    return {
      meals: [],
      pagination: { page, limit, total: 0, pages: 0 },
      error: errorMsg,
    }
  }
}

export async function aiAnalyze({
  description,
  action = "analyze",
}: { description: string; action?: "analyze" | "clarify" }) {
  try {
    console.log(`AI analyze request: action=${action}, description="${description.substring(0, 100)}..."`)

    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ description, action }),
    })

    console.log(`AI analyze response status: ${res.status} ${res.statusText}`)
    console.log(`AI analyze response headers:`, Object.fromEntries(res.headers.entries()))

    const data = await parseJSONSafe(res)
    console.log("AI analyze parsed data:", data)

    if (!res.ok) {
      const errorMsg = `AI analysis failed (${res.status} ${res.statusText}): ${
        typeof data === "object" && data?.error
          ? data.error
          : data?.rawResponse
            ? `Server returned: ${data.rawResponse.substring(0, 300)}`
            : "Unknown AI server error"
      }`
      console.error("aiAnalyze backend error:", errorMsg)
      return { error: errorMsg }
    }

    return data
  } catch (err) {
    const errorMsg = `Network error while contacting AI endpoint: ${err instanceof Error ? err.message : String(err)}`
    console.error("aiAnalyze network error:", err)
    return { error: errorMsg }
  }
}
