import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { MealStats } from "@shared/schema";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<MealStats>({
    queryKey: ["/api/stats"],
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
  });

  // Debug logging
  console.log("Stats data:", stats);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">
            {stats?.totalMeals || 0}
          </div>
          <div className="text-sm text-neutral-600">Posiłków</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-accent">
            {stats?.avgRating || 0}
          </div>
          <div className="text-sm text-neutral-600">Średnia ocena</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-warning">
            {stats?.uniqueRestaurants || 0}
          </div>
          <div className="text-sm text-neutral-600">Lokali</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-secondary">
            {stats?.currentMonth ?? 0}
          </div>
          <div className="text-sm text-neutral-600">W tym miesiącu</div>
        </CardContent>
      </Card>
    </div>
  );
}
