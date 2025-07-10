import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, User, Utensils, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsOverview from "@/components/stats-overview";
import MealCard from "@/components/meal-card";
import FilterSearch from "@/components/filter-search";
import FloatingActionButton from "@/components/floating-action-button";
import type { MealWithDetails } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [offset, setOffset] = useState(0);

  const { data: meals = [], isLoading, refetch } = useQuery<MealWithDetails[]>({
    queryKey: ["/api/meals", { search: searchQuery, rating: ratingFilter, offset }],
  });

  const handleLoadMore = () => {
    setOffset(prev => prev + 20);
  };

  const handleFilterChange = (search: string, rating: string) => {
    setSearchQuery(search);
    setRatingFilter(rating);
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center">
                <Utensils className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-secondary">Co i gdzie jedliśmy?</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/manage">
                <Button variant="ghost" size="icon" title="Zarządzanie danymi">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsOverview />
        
        <FilterSearch onFilterChange={handleFilterChange} />

        {/* Meal Entries */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-neutral-500">Ładowanie posiłków...</div>
            </div>
          ) : meals.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Brak zapisanych posiłków</h3>
              <p className="text-neutral-500 mb-6">Dodaj swój pierwszy posiłek aby rozpocząć śledzenie historii jedzenia.</p>
              <Link href="/add-meal">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj posiłek
                </Button>
              </Link>
            </div>
          ) : (
            meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onUpdate={() => refetch()} />
            ))
          )}
        </div>

        {/* Load More Button */}
        {meals.length >= 20 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              className="px-6 py-3"
            >
              Załaduj więcej posiłków
            </Button>
          </div>
        )}
      </main>

      <FloatingActionButton />
    </div>
  );
}
