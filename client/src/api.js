// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = "https://smart-farm-dadn.onrender.com";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

// Helper for authenticated requests
async function authFetch(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}


export async function loginUser(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }
  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // We send payload that matches UserCreate in FastAPI
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
      role_id: userData.role_id || 2,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }
  return data;
}

export async function fetchCurrentUser(token) {
  return authFetch(`${API_BASE_URL}/auth/me`, token);
}

// ==================== LOGS ====================

export async function fetchLogs(token, { page = 1, limit = 20, device_id, action_type, from_time, to_time } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (device_id) params.set("device_id", device_id);
  if (action_type) params.set("action_type", action_type);
  if (from_time) params.set("from_time", from_time);
  if (to_time) params.set("to_time", to_time);

  return authFetch(`${API_BASE_URL}/logs?${params.toString()}`, token);
}

export async function fetchLogStats(token, userId) {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  return authFetch(`${API_BASE_URL}/logs/stats?${params.toString()}`, token);
}

// ==================== DEVICES ====================

export async function fetchDevices(token) {
  return authFetch(`${API_BASE_URL}/devices`, token);
}

export async function fetchActiveDevices(token) {
  return authFetch(`${API_BASE_URL}/devices/active`, token);
}

export async function fetchDeviceStatus(token, deviceId) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/status`, token);
}

export async function checkActiveDevice(token, deviceId) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/check-active`, token);
}

export async function selectDevice(token, deviceId) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/select`, token, {
    method: "POST",
  });
}

export async function deselectDevice(token, deviceId) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/deselect`, token, {
    method: "POST",
  });
}

export async function changeDeviceMode(token, deviceId, mode) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/mode`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
}

export async function updateThreshold(token, deviceId, thresholds) {
  return authFetch(`${API_BASE_URL}/devices/${deviceId}/threshold`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(thresholds),
  });
}

export async function createDevice(token, deviceData) {
  return authFetch(`${API_BASE_URL}/devices`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviceData),
  });
}

export async function fetchUserThresholds(token) {
  return authFetch(`${API_BASE_URL}/devices/user-threshold`, token);
}

// ==================== CONTROL ====================

export async function controlPump(token, deviceId, action) {
  return authFetch(`${API_BASE_URL}/control/${deviceId}/pump`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export async function controlFan(token, deviceId, action) {
  return authFetch(`${API_BASE_URL}/control/${deviceId}/fan`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

// ==================== SENSORS ====================

export async function fetchLatestSensor(token, deviceId) {
  return authFetch(`${API_BASE_URL}/sensors/${deviceId}/latest`, token);
}

export async function fetchSensorHistory(token, deviceId, fromTime, toTime) {
  const params = new URLSearchParams();
  params.set("from_time", fromTime);
  params.set("to_time", toTime);
  return authFetch(`${API_BASE_URL}/sensors/${deviceId}/history?${params.toString()}`, token);
}

// ==================== USERS ====================

export async function fetchUsers(token) {
  return authFetch(`${API_BASE_URL}/users`, token);
}

export async function fetchUserById(token, userId) {
  return authFetch(`${API_BASE_URL}/users/${userId}`, token);
}

export async function updateMyProfile(token, data) {
  return authFetch(`${API_BASE_URL}/users/me`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminUpdateUser(token, userId, data) {
  return authFetch(`${API_BASE_URL}/users/${userId}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function adminToggleUserStatus(token, userId) {
  return authFetch(`${API_BASE_URL}/users/${userId}/toggle-status`, token, {
    method: "PATCH",
  });
}

export async function adminDeleteUser(token, userId) {
  return authFetch(`${API_BASE_URL}/users/${userId}`, token, {
    method: "DELETE",
  });
}

// ==================== WEBSOCKET NOTIFICATIONS ====================

export function createNotificationSocket(token, { onMessage, onOpen, onClose, onError } = {}) {
  if (!token) return null;

  const socket = new WebSocket(`${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`);

  socket.onopen = event => {
    onOpen?.(event);
  };

  socket.onmessage = event => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type !== "PONG") {
        onMessage?.(payload);
      }
    } catch {
      onMessage?.({ type: "MESSAGE", severity: "info", message: event.data });
    }
  };

  socket.onclose = event => {
    onClose?.(event);
  };

  socket.onerror = event => {
    onError?.(event);
  };

  return socket;
}

