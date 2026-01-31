const getAPIBase = () => {
  if (typeof window !== 'undefined' && window.location && window.location.port) {
    return `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`;
  }
  return '/api';
};

// --- Token Management ---
const TOKEN_KEY = 'glu_jwt_token';

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  // For testing without authentication, we'll use a default token
  // In production, this should require proper authentication
  const testToken = token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWNwYW4xYjgwMDAwcnp1bzd4OTBnZXY1IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzUxNjYyNTIzLCJleHAiOjE3NTIyNjczMjN9.eA1j8O6r7IRbOiFADXyZ0WUPI9u_6IZVksYgP53_o3M";
  return { Authorization: `Bearer ${testToken}` };
}

// --- API Calls ---

export async function register({ email, password, name }: { email: string; password: string; name: string }) {
  const res = await fetch(`${getAPIBase()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  const data = await res.json();
  if (data.token) setToken(data.token);
  return data;
}

export async function login({ email, password }: { email: string; password: string }) {
  const res = await fetch(`${getAPIBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) setToken(data.token);
  return data;
}

export async function getProfile() {
  const res = await fetch(`${getAPIBase()}/user/profile`, {
    headers: { ...authHeaders() }
  });
  return res.json();
}

export async function updateProfile({ name }: { name: string }) {
  const res = await fetch(`${getAPIBase()}/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function logMeal({ description, mealType, photoUrl, carbSource }: { 
  description: string; 
  mealType: string; 
  photoUrl?: string;
  carbSource?: string;
}) {
  const res = await fetch(`${getAPIBase()}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ description, mealType, photoUrl, carbSource })
  });
  return res.json();
}

export async function getMeals({ page = 1, limit = 20, date }: { page?: number; limit?: number; date?: string } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (date) params.append('date', date);
  const res = await fetch(`${getAPIBase()}/meals?${params.toString()}`, {
    headers: { ...authHeaders() }
  });
  return res.json();
}

export async function aiAnalyze({ description, action = 'analyze' }: { description: string; action?: 'analyze' | 'clarify' }) {
  const res = await fetch(`${getAPIBase()}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ description, action })
  });
  return res.json();
} 
