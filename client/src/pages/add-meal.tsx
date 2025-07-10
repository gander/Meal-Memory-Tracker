import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Camera, Sparkles, Plus, Check, ChevronsUpDown, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";
import RatingSlider from "@/components/ui/rating-slider";
import { queryClient } from "@/lib/queryClient";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";
import LocationPicker from "@/components/ui/location-picker";
import { useTextCorrection } from "@/hooks/use-text-correction";
import TextCorrectionIndicator from "@/components/ui/text-correction-indicator";
import { getDistanceToRestaurant } from "@/lib/distance";
import type { Restaurant, Person } from "@shared/schema";

const mealFormSchema = z.object({
  photo: z.any().optional(),
  restaurantName: z.string().optional(),
  dishName: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
  portionSize: z.string().optional(),
  tasteRating: z.number().min(-3).max(3).default(0),
  presentationRating: z.number().min(-3).max(3).default(0),
  valueRating: z.number().min(-3).max(3).default(0),
  serviceRating: z.number().min(-3).max(3).default(0),
  isExcellent: z.boolean().default(false),
  wantAgain: z.boolean().default(false),
  peopleNames: z.array(z.string()).default([]),
});

type MealFormData = z.infer<typeof mealFormSchema>;

export default function AddMeal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [restaurantLocation, setRestaurantLocation] = useState<{latitude: string, longitude: string} | null>(null);
  const textCorrection = useTextCorrection();
  const geolocation = useGeolocation({ 
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes
    autoRequest: false // Disable automatic GPS request to prevent browser freeze
  });

  // Fetch restaurants for dropdown
  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/restaurants");
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      return response.json();
    },
  });

  // Fetch people for dropdown
  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
    queryFn: async () => {
      const response = await fetch("/api/people");
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
  });

  // Mutation to create new restaurant
  const createRestaurantMutation = useMutation({
    mutationFn: async (name: string) => {
      const restaurantData: any = { name };
      
      // Add GPS coordinates if available
      if (restaurantLocation) {
        restaurantData.latitude = restaurantLocation.latitude;
        restaurantData.longitude = restaurantLocation.longitude;
      }
      
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantData),
      });
      if (!response.ok) throw new Error("Failed to create restaurant");
      return response.json();
    },
    onSuccess: (newRestaurant) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      form.setValue("restaurantName", newRestaurant.name);
      setRestaurantSearch("");
      setIsCreatingRestaurant(false);
      toast({
        title: "Restauracja dodana",
        description: `${newRestaurant.name} została dodana do listy.`,
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać restauracji.",
        variant: "destructive",
      });
    },
  });

  // Mutation to create new person
  const createPersonMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to create person");
      return response.json();
    },
    onSuccess: (newPerson) => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      // Add the new person to the current selection
      const currentPeople = form.getValues("peopleNames");
      form.setValue("peopleNames", [...currentPeople, newPerson.name]);
      toast({
        title: "Osoba dodana",
        description: `${newPerson.name} została dodana do listy.`,
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać osoby.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      tasteRating: 0,
      presentationRating: 0,
      valueRating: 0,
      serviceRating: 0,
      isExcellent: false,
      wantAgain: false,
      peopleNames: [],
      description: "",
      restaurantName: "",
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async (data: MealFormData) => {
      const formData = new FormData();
      
      if (data.photo) {
        formData.append("photo", data.photo);
      }
      
      formData.append("restaurantName", data.restaurantName);
      formData.append("dishName", data.dishName || "");
      formData.append("price", data.price || "");
      formData.append("description", data.description || "");
      formData.append("portionSize", data.portionSize || "");
      formData.append("tasteRating", data.tasteRating.toString());
      formData.append("presentationRating", data.presentationRating.toString());
      formData.append("valueRating", data.valueRating.toString());
      formData.append("serviceRating", data.serviceRating.toString());
      formData.append("isExcellent", data.isExcellent.toString());
      formData.append("wantAgain", data.wantAgain.toString());
      formData.append("peopleNames", JSON.stringify(data.peopleNames));

      const response = await fetch("/api/meals", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create meal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Sukces!",
        description: "Posiłek został dodany pomyślnie.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać posiłku. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("description", form.getValues("description"));

      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const analysis = await response.json();
        
        // Automatically fill dish name with confidence
        if (analysis.suggestedDish) {
          form.setValue("dishName", analysis.suggestedDish);
        }
        
        // Note: Restaurant suggestion removed as per user request
        // Restaurant selection should be based on geolocation, not AI image analysis
        
        // Apply suggested ratings
        if (analysis.suggestedRatings) {
          form.setValue("tasteRating", analysis.suggestedRatings.taste || 0);
          form.setValue("presentationRating", analysis.suggestedRatings.presentation || 0);
          form.setValue("valueRating", analysis.suggestedRatings.value || 0);
          form.setValue("serviceRating", analysis.suggestedRatings.service || 0);
        }

        toast({
          title: "Nazwa dania rozpoznana!",
          description: `AI rozpoznało: ${analysis.suggestedDish}`,
        });
      }
    } catch (error) {
      console.error("Photo analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      const currentPeople = form.getValues("peopleNames");
      if (!currentPeople.includes(newPersonName.trim())) {
        // Create the person in the database and add to form
        createPersonMutation.mutate(newPersonName.trim());
      }
      setNewPersonName("");
    }
  };

  const handleRemovePerson = (name: string) => {
    const currentPeople = form.getValues("peopleNames");
    form.setValue("peopleNames", currentPeople.filter(p => p !== name));
  };

  const handleCreateRestaurant = () => {
    if (restaurantSearch.trim()) {
      setIsCreatingRestaurant(true);
      createRestaurantMutation.mutate(restaurantSearch.trim());
    }
  };

  // Filter and sort restaurants by distance and name match
  const filteredRestaurants = restaurants
    .filter(restaurant =>
      restaurant.name.toLowerCase().includes(restaurantSearch.toLowerCase())
    )
    .map(restaurant => {
      const distanceInfo = geolocation.coordinates ? 
        getDistanceToRestaurant(
          geolocation.coordinates.latitude,
          geolocation.coordinates.longitude,
          restaurant.latitude,
          restaurant.longitude
        ) : null;
      
      return {
        ...restaurant,
        distanceInfo
      };
    })
    .sort((a, b) => {
      // Sort by distance if both restaurants have distance info
      if (a.distanceInfo && b.distanceInfo) {
        return a.distanceInfo.distance - b.distanceInfo.distance;
      }
      // Restaurants with distance info come first
      if (a.distanceInfo && !b.distanceInfo) return -1;
      if (!a.distanceInfo && b.distanceInfo) return 1;
      // Fall back to alphabetical sorting
      return a.name.localeCompare(b.name);
    });



  const onSubmit = async (data: MealFormData) => {
    // Auto-correct description before submitting
    if (data.description && data.description.trim().length > 0) {
      const correctedDescription = await textCorrection.correctText(data.description);
      data.description = correctedDescription;
    }
    
    createMealMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-secondary">Dodaj nowy posiłek</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Nowy posiłek
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* GPS Status Indicator */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className={cn(
                    "h-4 w-4",
                    geolocation.permission === 'granted' && geolocation.coordinates ? "text-green-600" : 
                    geolocation.permission === 'denied' ? "text-red-600" : 
                    geolocation.loading ? "text-yellow-600" : "text-gray-600"
                  )} />
                  <span className="text-sm font-medium">
                    {geolocation.loading ? "Pobieranie lokalizacji..." :
                     geolocation.permission === 'denied' ? "Dostęp do lokalizacji zablokowany" :
                     geolocation.coordinates ? 
                       `GPS aktywny (dokładność: ${Math.round(geolocation.coordinates.accuracy)}m)` :
                       "GPS nieaktywny"
                    }
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={geolocation.requestLocation}
                  disabled={geolocation.loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", geolocation.loading && "animate-spin")} />
                  Odśwież
                </Button>
              </div>
              {geolocation.coordinates && (
                <div className="mt-2 text-xs text-blue-600">
                  Restauracje są sortowane według odległości od Twojej lokalizacji
                </div>
              )}
              {geolocation.error && (
                <div className="mt-2 text-xs text-red-600">
                  Błąd: {geolocation.error.message}
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload */}
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zdjęcie posiłku</FormLabel>
                      <FormControl>
                        <FileUpload
                          onFileSelect={(file) => {
                            field.onChange(file);
                            handlePhotoAnalysis(file);
                          }}
                          isAnalyzing={isAnalyzing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dish Name - AI Detected */}
                <FormField
                  control={form.control}
                  name="dishName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Nazwa dania
                        <Sparkles className="h-4 w-4 text-amber-500" title="Automatycznie rozpoznane przez AI" />
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Załaduj zdjęcie aby AI rozpoznało danie..." 
                            {...field}
                            className={field.value ? "bg-amber-50 border-amber-200" : ""}
                          />
                          {field.value && (
                            <div className="absolute right-3 top-3 text-amber-600">
                              <Sparkles className="h-4 w-4" title="Rozpoznane przez AI" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-amber-600 mt-1">
                          ✨ Nazwa rozpoznana automatycznie przez AI
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Restaurant Dropdown */}
                <FormField
                  control={form.control}
                  name="restaurantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokal</FormLabel>
                      <Popover open={restaurantOpen} onOpenChange={setRestaurantOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={restaurantOpen}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Wybierz lokal..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Szukaj lokalu..."
                              value={restaurantSearch}
                              onValueChange={setRestaurantSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Nie znaleziono lokalu
                                  </p>
                                  {restaurantSearch && (
                                    <Button
                                      size="sm"
                                      onClick={handleCreateRestaurant}
                                      disabled={isCreatingRestaurant}
                                      className="gap-2"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Dodaj "{restaurantSearch}"
                                    </Button>
                                  )}
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredRestaurants.map((restaurant) => (
                                  <CommandItem
                                    key={restaurant.id}
                                    value={restaurant.name}
                                    onSelect={() => {
                                      field.onChange(restaurant.name);
                                      setRestaurantOpen(false);
                                      setRestaurantSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === restaurant.name
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{restaurant.name}</div>
                                      {restaurant.distanceInfo && (
                                        <div className="text-xs text-muted-foreground">
                                          📍 {restaurant.distanceInfo.formatted} stąd
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                                {restaurantSearch && 
                                 !filteredRestaurants.some(r => 
                                   r.name.toLowerCase() === restaurantSearch.toLowerCase()
                                 ) && (
                                  <CommandItem
                                    onSelect={handleCreateRestaurant}
                                    className="border-t"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Dodaj "{restaurantSearch}"
                                  </CommandItem>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Picker for New Restaurant */}
                {isCreatingRestaurant && (
                  <div className="mt-4">
                    <LocationPicker
                      value={restaurantLocation}
                      onChange={setRestaurantLocation}
                      label="Lokalizacja nowej restauracji"
                      allowManualEdit={true}
                    />
                  </div>
                )}

                {/* Price and Portion Size */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cena (opcjonalnie)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              className="pl-8"
                              {...field} 
                            />
                            <span className="absolute left-3 top-3 text-neutral-500">zł</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portionSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gramatura (opcjonalnie)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="np. 300g, Duża" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* People Tags */}
                <div>
                  <FormLabel>Kto jadł?</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-3 mt-2">
                    {form.watch("peopleNames").map((name) => (
                      <span key={name} className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center">
                        {name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-0 text-white hover:text-neutral-200"
                          onClick={() => handleRemovePerson(name)}
                        >
                          ×
                        </Button>
                      </span>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {/* Select from existing people */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Wybierz z listy
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {people.map((person) => (
                          <Button
                            key={person.id}
                            type="button"
                            variant={form.watch("peopleNames").includes(person.name) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const currentPeople = form.getValues("peopleNames");
                              if (currentPeople.includes(person.name)) {
                                form.setValue("peopleNames", currentPeople.filter(p => p !== person.name));
                              } else {
                                form.setValue("peopleNames", [...currentPeople, person.name]);
                              }
                            }}
                          >
                            {person.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Add new person */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Lub dodaj nową osobę
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Dodaj nową osobę..."
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPerson())}
                        />
                        <Button type="button" onClick={handleAddPerson} disabled={!newPersonName.trim()}>
                          Dodaj
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis smaku i wrażeń</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Opisz jak smakowało danie, co ci się podobało lub nie podobało..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <TextCorrectionIndicator
                        corrections={textCorrection.lastCorrection?.corrections || []}
                        isVisible={textCorrection.isVisible}
                        onHide={textCorrection.hideCorrections}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-dimensional Rating System */}
                <div>
                  <FormLabel className="mb-4 block">Ocena wielowymiarowa</FormLabel>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tasteRating"
                      render={({ field }) => (
                        <RatingSlider
                          label="Smak"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="presentationRating"
                      render={({ field }) => (
                        <RatingSlider
                          label="Prezentacja"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valueRating"
                      render={({ field }) => (
                        <RatingSlider
                          label="Wartość za cenę"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceRating"
                      render={({ field }) => (
                        <RatingSlider
                          label="Obsługa"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Special Markers */}
                <div>
                  <FormLabel className="mb-3 block">Specjalne znaczniki</FormLabel>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="isExcellent"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isExcellent"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <label htmlFor="isExcellent" className="text-sm">Wyśmienite</label>
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wantAgain"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="wantAgain"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <label htmlFor="wantAgain" className="text-sm">Chcę zjeść ponownie</label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* AI Processing Indicator */}
                {isAnalyzing && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Sparkles className="text-primary mr-3 animate-pulse" />
                      <div>
                        <div className="text-sm font-medium text-neutral-700">AI analizuje zdjęcie...</div>
                        <div className="text-xs text-neutral-500">Rozpoznawanie dania i generowanie sugestii</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLocation("/")}
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createMealMutation.isPending}
                  >
                    {createMealMutation.isPending ? "Dodawanie..." : "Dodaj posiłek"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
