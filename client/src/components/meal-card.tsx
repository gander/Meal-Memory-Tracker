import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Edit2, MapPin, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { MealWithDetails } from "@shared/schema";

interface MealCardProps {
  meal: MealWithDetails;
  onUpdate: () => void;
}

export default function MealCard({ meal, onUpdate }: MealCardProps) {
  const { toast } = useToast();

  const getRatingColor = (rating: number) => {
    if (rating > 1) return "text-green-600";
    if (rating < 0) return "text-red-500";
    return "text-gray-500";
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "dzisiaj";
    if (diffDays === 2) return "wczoraj";
    if (diffDays <= 7) return `${diffDays - 1} dni temu`;
    if (diffDays <= 30) return `${Math.floor((diffDays - 1) / 7)} tygodni temu`;
    return d.toLocaleDateString("pl-PL");
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="md:flex">
        {meal.photoUrl && (
          <div className="md:w-1/3">
            <img
              src={meal.photoUrl}
              alt={meal.dish?.name || "Posiłek"}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
        )}
        <CardContent className={`${meal.photoUrl ? "md:w-2/3" : "w-full"} p-6`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary mb-1">
                {meal.dish?.name || "Nieznane danie"}
              </h3>
              <div className="flex items-center text-neutral-600 text-sm">
                <MapPin className="mr-1 h-3 w-3" />
                <span>{meal.restaurant?.name || "Nieznany lokal"}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(meal.createdAt!)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {meal.isExcellent && (
                <Badge variant="secondary" className="bg-accent text-white">
                  Wyśmienite
                </Badge>
              )}
              {meal.wantAgain && (
                <Badge className="bg-primary text-white">
                  Chcę ponownie
                </Badge>
              )}
            </div>
          </div>

          {/* Rating System */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Smak</div>
              <div className={`text-lg font-bold ${getRatingColor(meal.tasteRating)}`}>
                {meal.tasteRating > 0 ? `+${meal.tasteRating}` : meal.tasteRating}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Prezentacja</div>
              <div className={`text-lg font-bold ${getRatingColor(meal.presentationRating)}`}>
                {meal.presentationRating > 0 ? `+${meal.presentationRating}` : meal.presentationRating}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Wartość</div>
              <div className={`text-lg font-bold ${getRatingColor(meal.valueRating)}`}>
                {meal.valueRating > 0 ? `+${meal.valueRating}` : meal.valueRating}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Obsługa</div>
              <div className={`text-lg font-bold ${getRatingColor(meal.serviceRating)}`}>
                {meal.serviceRating > 0 ? `+${meal.serviceRating}` : meal.serviceRating}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-neutral-700 text-sm leading-relaxed">
              {meal.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {meal.price && (
                <div className="flex items-center text-warning text-sm">
                  <Euro className="mr-1 h-3 w-3" />
                  <span>{meal.price} zł</span>
                </div>
              )}
              <div className="flex space-x-1">
                {meal.people?.map((person) => (
                  <Badge key={person.id} variant="outline" className="text-xs">
                    {person.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
