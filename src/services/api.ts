/** API service for communicating with the FastAPI backend */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type AssistantMode = "education" | "finance" | "healthcare" | "cooking" | "integrated";

export interface ChatRequest {
  message: string;
  session_id?: string;
  mode?: AssistantMode;
}

export interface RegisterRequest {
  name: string;
  age: number;
  education: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  name: string;
  age: number;
  education: string;
  email: string;
}

export interface ChatResponse {
  response: string;
  domain?: string;
  assistant?: string;
  collaboration_info?: string;
}

export interface ApiError {
  detail: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const maybeDetail = (error as { detail?: unknown }).detail;
  if (typeof maybeDetail === "string") return maybeDetail;
  if (Array.isArray(maybeDetail)) {
    const first = maybeDetail[0] as { msg?: string; loc?: Array<string | number> } | undefined;
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1] ?? "") : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }
  return fallback;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized(status: number): void {
  if (status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  }
}

export async function registerUser(payload: RegisterRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(extractErrorMessage(error, `Request failed with status ${res.status}`));
  }
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(extractErrorMessage(error, `Request failed with status ${res.status}`));
  }
  return res.json();
}

/**
 * Send a chat message to the backend /chat endpoint (non-streaming).
 * Used by Voice Mode for immediate response (no streaming).
 */
export async function sendChatMessage(
  message: string,
  sessionId: string = "default",
  mode: AssistantMode = "education"
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(
      {
        message,
        session_id: sessionId,
        mode,
      } satisfies ChatRequest
    ),
  });

  if (!res.ok) {
    handleUnauthorized(res.status);
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (data: { response: string; domain?: string; assistant?: string }) => void;
  onError: (message: string) => void;
}

/**
 * Stream chat response from the backend /chat/stream endpoint.
 * Calls onToken for each token, onDone with final response/domain/assistant, or onError.
 */
export async function sendChatMessageStream(
  message: string,
  callbacks: StreamCallbacks,
  sessionId: string = "default",
  mode: AssistantMode = "education"
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(
      {
        message,
        session_id: sessionId,
        mode,
      } satisfies ChatRequest
    ),
  });

  if (!res.ok) {
    handleUnauthorized(res.status);
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    callbacks.onError(error.detail || `Request failed with status ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("Stream not supported");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.error) {
            callbacks.onError(data.error);
            return;
          }
          if (data.token != null) {
            callbacks.onToken(data.token);
          }
          if (data.done === true) {
            callbacks.onDone({
              response: data.response ?? "",
              domain: data.domain,
              assistant: data.assistant,
            });
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        if (data.done === true) {
          callbacks.onDone({
            response: data.response ?? "",
            domain: data.domain,
            assistant: data.assistant,
          });
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Stream read failed");
  }
}

/** Voice mode: Edge TTS (backend) → MP3 blob for browser playback. */
export async function fetchTtsMp3(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "TTS request failed" }));
    throw new Error(extractErrorMessage(error, `TTS failed (${res.status})`));
  }
  return res.blob();
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const error = await res.json().catch(() => ({ detail: "Failed to fetch profile" }));
    throw new Error(error.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}
