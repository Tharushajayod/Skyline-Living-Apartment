const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const inFlightRequests = new Map<string, Promise<any>>();

export const apiClient = {
  get: <T>(endpoint: string): Promise<T> => {
    if (inFlightRequests.has(endpoint)) {
      return inFlightRequests.get(endpoint) as Promise<T>;
    }
    const promise = request<T>(endpoint).finally(() => {
      inFlightRequests.delete(endpoint);
    });
    inFlightRequests.set(endpoint, promise);
    return promise;
  },
  post: <T>(endpoint: string, body: unknown) => {
    inFlightRequests.clear();
    return request<T>(endpoint, { method: 'POST', body });
  },
  put: <T>(endpoint: string, body: unknown) => {
    inFlightRequests.clear();
    return request<T>(endpoint, { method: 'PUT', body });
  },
  patch: <T>(endpoint: string, body: unknown) => {
    inFlightRequests.clear();
    return request<T>(endpoint, { method: 'PATCH', body });
  },
  delete: <T>(endpoint: string) => {
    inFlightRequests.clear();
    return request<T>(endpoint, { method: 'DELETE' });
  },
  upload: <T>(endpoint: string, formData: FormData) => {
    inFlightRequests.clear();
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`Upload Error: ${res.status}`);
      return res.json() as Promise<T>;
    });
  },
};

export const userService = {
  // Profile details update
  updateProfile: async (userId: string | number, data: { name: string; phone: string; avatarUrl?: string }) => {
    return apiClient.put(`/users/${userId}`, data);
  },

  // Profile image upload (Base64 or URL)
  uploadAvatar: async (userId: string | number, base64Image: string) => {
    return apiClient.put(`/users/${userId}`, { avatarUrl: base64Image });
  },

  // Password change
  changePassword: async (userId: string | number, data: { currentPassword: string; newPassword: string }) => {
    return apiClient.put(`/users/${userId}/password`, data);
  }
};

// Default export ekath damma mokak hari thanakin import api from './api' kiyala illuwath crash nowenna
export default apiClient;