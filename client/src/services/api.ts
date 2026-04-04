import { ApiResponse } from '@schofy/shared';

const API_BASE = '/api';
const TOKEN_KEY = 'token';
const REQUEST_TIMEOUT_MS = 8000;

class ApiService {
  private getToken() {
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token && !sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
    return token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (response.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
    }

    return data;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      return await this.parseResponse<T>(response);
    } catch (error) {
      console.error(`API ${options.method || 'GET'} error:`, error);
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      return { success: false, error: isTimeout ? 'Request timed out' : 'Network error' };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
