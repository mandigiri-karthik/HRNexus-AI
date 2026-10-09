// Every call to the backend goes through this file.
import { API_URL } from "../config";

// Turns the backend's error reply into one readable sentence.
function errorMessage(data, status) {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  // Validation errors arrive as a list; show the first one.
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace("Value error, ", "");
  return `Something went wrong (${status}). Please try again.`;
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(errorMessage(data, response.status));
    error.status = response.status;
    throw error;
  }
  return data;
}

// Each of these three returns { token, user }.
export const signUp = (name, email, password) =>
  request("/api/auth/signup", { method: "POST", body: { name, email, password } });

export const logIn = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const googleLogIn = (credential) =>
  request("/api/auth/google", { method: "POST", body: { credential } });

// Returns the logged-in user. Needs the token from one of the calls above.
export const getCurrentUser = (token) => request("/api/auth/me", { token });
