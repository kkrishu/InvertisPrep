import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Department,
  CreateDepartmentDTO,
  Branch,
  CreateBranchDTO,
  Session,
  CreateSessionDTO,
  PYQPaper,
  PYQFilterQuery,
  APIResponse,
  UserResponse,
  PublicUserProfile,
  Report,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if we're already on a view or login page to avoid loops
      const isViewing = window.location.pathname.includes('/view/');
      const isLogin = window.location.pathname.includes('/login');

      if (!isViewing && !isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect based on current path
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>('/auth/me');
    return data;
  },

  updateProfile: async (profileData: { name: string; studentId: string; phoneNumber: string; course: string }): Promise<UserResponse> => {
    const { data } = await apiClient.put<UserResponse>('/auth/profile', profileData);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Department API
export const departmentApi = {
  getAll: async (): Promise<APIResponse<Department[]>> => {
    const { data } = await apiClient.get<APIResponse<Department[]>>('/departments');
    return data;
  },

  create: async (department: CreateDepartmentDTO): Promise<APIResponse<Department>> => {
    const { data } = await apiClient.post<APIResponse<Department>>('/departments', department);
    return data;
  },

  update: async (id: string, updates: Partial<Department>): Promise<APIResponse<Department>> => {
    const { data } = await apiClient.put<APIResponse<Department>>(`/departments/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/departments/${id}`);
    return data;
  },

  getBranches: async (departmentId: string): Promise<APIResponse<Branch[]>> => {
    const { data } = await apiClient.get<APIResponse<Branch[]>>(`/departments/${departmentId}/branches`);
    return data;
  },
};

// Branch API
export const branchApi = {
  getAll: async (): Promise<APIResponse<Branch[]>> => {
    const { data } = await apiClient.get<APIResponse<Branch[]>>('/branches');
    return data;
  },

  create: async (branch: CreateBranchDTO): Promise<APIResponse<Branch>> => {
    const { data } = await apiClient.post<APIResponse<Branch>>('/branches', branch);
    return data;
  },

  update: async (id: string, updates: Partial<Branch>): Promise<APIResponse<Branch>> => {
    const { data } = await apiClient.put<APIResponse<Branch>>(`/branches/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/branches/${id}`);
    return data;
  },
};

// Session API
export const sessionApi = {
  getAll: async (): Promise<APIResponse<Session[]>> => {
    const { data } = await apiClient.get<APIResponse<Session[]>>('/sessions');
    return data;
  },

  create: async (session: CreateSessionDTO): Promise<APIResponse<Session>> => {
    const { data } = await apiClient.post<APIResponse<Session>>('/sessions', session);
    return data;
  },

  update: async (id: string, updates: Partial<Session>): Promise<APIResponse<Session>> => {
    const { data } = await apiClient.put<APIResponse<Session>>(`/sessions/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/sessions/${id}`);
    return data;
  },
};

// PYQ API
export const pyqApi = {
  upload: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.post<APIResponse<PYQPaper>>('/pyq/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  uploadPublic: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.post<APIResponse<PYQPaper>>('/pyq/upload-public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getDailyUploadCount: async (): Promise<APIResponse<{ count: number; limit: number; isExempt: boolean }>> => {
    const { data } = await apiClient.get<APIResponse<{ count: number; limit: number; isExempt: boolean }>>('/pyq/upload-count');
    return data;
  },

  getFiltered: async (filters: PYQFilterQuery): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await apiClient.get<APIResponse<PYQPaper[]>>('/pyq', { params: filters });
    return data;
  },

  getAll: async (params?: Record<string, any>): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await apiClient.get<APIResponse<PYQPaper[]>>('/pyq/all', { params });
    return data;
  },

  trackDownload: async (id: string): Promise<void> => {
    await apiClient.post(`/pyq/${id}/download`);
  },

  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/pyq/${id}/view`);
  },

  verify: async (id: string): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.patch<APIResponse<PYQPaper>>(`/pyq/${id}/verify`);
    return data;
  },

  update: async (id: string, updates: Partial<PYQPaper>): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.put<APIResponse<PYQPaper>>(`/pyq/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/pyq/${id}`);
    return data;
  },
};

export const syllabusApi = {
  upload: async (formData: FormData): Promise<APIResponse<any>> => {
    const { data } = await apiClient.post<APIResponse<any>>('/syllabus/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getAll: async (): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/syllabus/all');
    return data;
  },

  getFiltered: async (filters?: Record<string, any>): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/syllabus', { params: filters });
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/syllabus/${id}`);
    return data;
  },
};

// User API
export const userApi = {
  getProfile: async (id: string): Promise<APIResponse<PublicUserProfile>> => {
    const { data } = await apiClient.get<APIResponse<PublicUserProfile>>(`/users/${id}`);
    return data;
  },
  follow: async (id: string): Promise<APIResponse<void>> => {
    const { data } = await apiClient.post<APIResponse<void>>(`/users/${id}/follow`);
    return data;
  },
  unfollow: async (id: string): Promise<APIResponse<void>> => {
    const { data } = await apiClient.post<APIResponse<void>>(`/users/${id}/unfollow`);
    return data;
  },
};

// Report API
export const reportApi = {
  create: async (reportData: { paperId: string; reason: string; description?: string }): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.post<APIResponse<Report>>('/reports', reportData);
    return data;
  },

  getAll: async (status?: string): Promise<APIResponse<Report[]>> => {
    const { data } = await apiClient.get<APIResponse<Report[]>>('/reports', { params: { status } });
    return data;
  },

  updateStatus: async (id: string, status: 'resolved' | 'dismissed'): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.patch<APIResponse<Report>>(`/reports/${id}`, { status });
    return data;
  },
};

// PDF API
export const pdfApi = {
  view: async (id: string, type: 'pyq' | 'syllabus' = 'pyq'): Promise<Blob> => {
    const { data } = await apiClient.get(`/pdf/view/${id}`, {
      params: { type },
      responseType: 'blob',
    });
    return data;
  },
};

export default apiClient;
