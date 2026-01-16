// In production, use relative URLs since server serves both API and static files
// In development, use VITE_API_URL or default to localhost:3005
const API_BASE_URL = import.meta.env.PROD 
  ? '' // Empty string for relative URLs in production
  : (import.meta.env.VITE_API_URL || 'http://localhost:3005');

// Simple API client for guest mode
class ApiClient {
  private baseURL: string;
  private guestId: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.guestId = this.getOrCreateGuestId();
    console.log('API Client initialized with baseURL:', this.baseURL);
  }

  private getOrCreateGuestId(): string {
    let guestId = localStorage.getItem('coffee-timer-guest-id');
    if (!guestId) {
      guestId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('coffee-timer-guest-id', guestId);
    }
    return guestId;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Merge headers properly
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Guest-ID': this.guestId,
    };
    
    // Add any additional headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Recipe endpoints
  recipes = {
    list: () => this.request('/api/recipes'),
    create: (recipe: any) => this.request('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    }),
    update: (id: string, recipe: any) => this.request(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    }),
    delete: (id: string) => this.request(`/api/recipes/${id}`, {
      method: 'DELETE',
    }),
    toggleFavorite: (id: string) => this.request(`/api/recipes/${id}/favorite`, {
      method: 'POST',
    }),
    // Template endpoints
    getTemplates: () => this.request('/api/recipes/templates'),
    createFromTemplate: (templateId: string, name?: string) => this.request(`/api/recipes/from-template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  };

  // Admin endpoints
  admin = {
    getTemplates: (adminKey: string) => this.request('/api/admin/templates', {
      headers: { 'X-Admin-Key': adminKey },
    }),
    createTemplate: (adminKey: string, template: any) => this.request('/api/admin/templates', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey },
      body: JSON.stringify(template),
    }),
    updateTemplate: (adminKey: string, id: string, template: any) => this.request(`/api/admin/templates/${id}`, {
      method: 'PUT',
      headers: { 'X-Admin-Key': adminKey },
      body: JSON.stringify(template),
    }),
    deleteTemplate: (adminKey: string, id: string) => this.request(`/api/admin/templates/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey },
    }),
    getStats: (adminKey: string) => this.request('/api/admin/stats', {
      headers: { 'X-Admin-Key': adminKey },
    }),
  };
}

export const api = new ApiClient();