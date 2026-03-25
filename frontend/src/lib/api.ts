/**
 * API Client for AI-WorkHub Backend
 *
 * Axios-based HTTP client with interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// API base URL - in production this would come from env vars
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login or refresh token
          console.error('Unauthorized request');
        }
        return Promise.reject(error);
      }
    );
  }

  // Employees
  async getEmployees() {
    const { data } = await this.client.get('/employees');
    return data;
  }

  async getEmployee(id: string) {
    const { data } = await this.client.get(`/employees/${id}`);
    return data;
  }

  async createEmployee(employee: Partial<{
    name: string;
    role: string;
    identity: string;
    plan: string;
    model: string;
    temperature: number;
  }>) {
    const { data } = await this.client.post('/employees', employee);
    return data;
  }

  async updateEmployee(id: string, updates: Partial<{
    name: string;
    role: string;
    identity: string;
    plan: string;
    model: string;
    temperature: number;
    status: string;
  }>) {
    const { data } = await this.client.put(`/employees/${id}`, updates);
    return data;
  }

  async deleteEmployee(id: string) {
    await this.client.delete(`/employees/${id}`);
  }

  // Teams
  async getTeams() {
    const { data } = await this.client.get('/teams');
    return data;
  }

  async getTeam(id: string) {
    const { data } = await this.client.get(`/teams/${id}`);
    return data;
  }

  async createTeam(team: { name: string; description?: string; plan?: string }) {
    const { data } = await this.client.post('/teams', team);
    return data;
  }

  async addTeamMember(teamId: string, employeeId: string, role: string = 'member') {
    const { data } = await this.client.post(`/teams/${teamId}/members`, { employeeId, role });
    return data;
  }

  async removeTeamMember(teamId: string, employeeId: string) {
    await this.client.delete(`/teams/${teamId}/members/${employeeId}`);
  }

  // Tasks
  async getTasks(filters?: {
    status?: string;
    assigneeType?: string;
    assigneeId?: string;
  }) {
    const { data } = await this.client.get('/tasks', { params: filters });
    return data;
  }

  async getTask(id: string) {
    const { data } = await this.client.get(`/tasks/${id}`);
    return data;
  }

  async createTask(task: {
    title: string;
    description?: string;
    assigneeType: 'employee' | 'team';
    assigneeId: string;
  }) {
    const { data } = await this.client.post('/tasks', task);
    return data;
  }

  async updateTask(id: string, updates: {
    title?: string;
    description?: string;
    status?: string;
    result?: string;
  }) {
    const { data } = await this.client.put(`/tasks/${id}`, updates);
    return data;
  }

  async executeTask(id: string) {
    const { data } = await this.client.post(`/tasks/${id}/execute`);
    return data;
  }

  // Conversations
  async getConversations(roomType?: string, roomId?: string) {
    const { data } = await this.client.get('/conversations', {
      params: { type: roomType, roomId },
    });
    return data;
  }

  async createConversation(conversation: {
    type: 'direct' | 'team';
    initiatorId?: string;
    recipientId?: string;
    teamId?: string;
  }) {
    const { data } = await this.client.post('/conversations', conversation);
    return data;
  }

  async getConversationMessages(conversationId: string, limit?: number) {
    const { data } = await this.client.get(`/conversations/${conversationId}/messages`, {
      params: { limit },
    });
    return data;
  }

  async sendMessage(conversationId: string, message: {
    senderId: string;
    senderType: 'user' | 'agent';
    content: string;
  }) {
    const { data } = await this.client.post(`/conversations/${conversationId}/messages`, message);
    return data;
  }

  // Messages (Logging)
  async searchMessages(params: {
    query?: string;
    conversationId?: string;
    senderId?: string;
    participantId?: string;
    startTime?: number;
    endTime?: number;
    page?: number;
    limit?: number;
  }) {
    const { data } = await this.client.get('/messages/search', { params });
    return data;
  }

  async getMessageStats(params: {
    conversationId?: string;
    participantId?: string;
    startTime?: number;
    endTime?: number;
  }) {
    const { data } = await this.client.get('/messages/stats', { params });
    return data;
  }

  // Memories
  async getMemories(employeeId: string, type?: string) {
    const { data } = await this.client.get(`/memories/${employeeId}`, {
      params: { type },
    });
    return data;
  }

  async searchMemories(params: {
    query: string;
    employeeId: string;
    type?: string;
    limit?: number;
  }) {
    const { data } = await this.client.get('/memories/search', { params });
    return data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export type for use in components
export type { AxiosResponse };
