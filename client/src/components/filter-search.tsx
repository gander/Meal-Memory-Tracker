import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface FilterSearchProps {
  onFilterChange: (search: string, rating: string) => void;
}

export default function FilterSearch({ onFilterChange }: FilterSearchProps) {
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange(value, rating);
  };

  const handleRatingChange = (value: string) => {
    const filterValue = value === "all" ? "" : value;
    setRating(value);
    onFilterChange(search, filterValue);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder="Szukaj posiłków, lokali, dań..."
                className="pl-10"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={rating} onValueChange={handleRatingChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Wszystkie oceny" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie oceny</SelectItem>
                <SelectItem value="excellent">Wyśmienite</SelectItem>
                <SelectItem value="want-again">Chcę ponownie</SelectItem>
                <SelectItem value="high">Wysokie (2-3)</SelectItem>
                <SelectItem value="average">Przeciętne (0-1)</SelectItem>
                <SelectItem value="low">Niskie (-1 do -3)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
