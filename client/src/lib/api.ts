import { apiRequest } from "@/lib/queryClient";
import type { MealWithDetails, MealStats } from "@shared/schema";

export const api = {
  // Stats
  getStats: () => apiRequest("GET", "/api/stats"),

  // Meals
  getMeals: (params?: {
    search?: string;
    rating?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.rating) searchParams.append("rating", params.rating);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest("GET", `/api/meals${query ? `?${query}` : ""}`);
  },

  getMeal: (id: number) => apiRequest("GET", `/api/meals/${id}`),

  createMeal: (formData: FormData) => 
    fetch("/api/meals", { method: "POST", body: formData }),

  updateMeal: (id: number, formData: FormData) =>
    fetch(`/api/meals/${id}`, { method: "PATCH", body: formData }),

  deleteMeal: (id: number) => apiRequest("DELETE", `/api/meals/${id}`),

  // Search
  searchRestaurants: (query: string) => 
    apiRequest("GET", `/api/restaurants/search?q=${encodeURIComponent(query)}`),

  searchDishes: (query: string) =>
    apiRequest("GET", `/api/dishes/search?q=${encodeURIComponent(query)}`),

  searchPeople: (query: string) =>
    apiRequest("GET", `/api/people/search?q=${encodeURIComponent(query)}`),

  // AI
  analyzePhoto: (formData: FormData) =>
    fetch("/api/analyze-photo", { method: "POST", body: formData }),
};
