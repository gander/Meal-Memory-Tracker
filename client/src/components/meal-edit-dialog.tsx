import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Save, X, Trash2, Camera, Upload, Check, ChevronsUpDown, Plus, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useTextCorrection } from "@/hooks/use-text-correction";
import TextCorrectionIndicator from "@/components/ui/text-correction-indicator";
import RatingSlider from "@/components/ui/rating-slider";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import FileUpload from "@/components/ui/file-upload";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getDistanceToRestaurant } from "@/lib/distance";
import type { MealWithDetails, Person, Restaurant } from "@shared/schema";

const mealEditSchema = z.object({
  photo: z.any().optional(),
  dishName: z.string().optional(),
  restaurantName: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  portionSize: z.string().optional(),
  tasteRating: z.number().min(-3).max(3),
  presentationRating: z.number().min(-3).max(3),
  valueRating: z.number().min(-3).max(3),
  serviceRating: z.number().min(-3).max(3),
  isExcellent: z.boolean(),
  wantAgain: z.boolean(),
  peopleNames: z.array(z.string()).default([]),
});

type MealEditFormData = z.infer<typeof mealEditSchema>;

interface MealEditDialogProps {
  meal: MealWithDetails;
  onUpdate: () => void;
}

export default function MealEditDialog({ meal, onUpdate }: MealEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [hasImageToDelete, setHasImageToDelete] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const { toast } = useToast();
  const textCorrection = useTextCorrection();
  const geolocation = useGeolocation({ 
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000 // 5 minutes
  });

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (newImagePreview && newImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  // Fetch people for dropdown
  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
    queryFn: async () => {
      const response = await fetch("/api/people");
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    },
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

  const form = useForm<MealEditFormData>({
    resolver: zodResolver(mealEditSchema),
    defaultValues: {
      photo: undefined,
      dishName: meal.dish?.name || "",
      restaurantName: meal.restaurant?.name || "",
      description: meal.description || "",
      price: meal.price || "",
      portionSize: meal.portionSize || "",
      tasteRating: meal.tasteRating,
      presentationRating: meal.presentationRating,
      valueRating: meal.valueRating,
      serviceRating: meal.serviceRating,
      isExcellent: meal.isExcellent || false,
      wantAgain: meal.wantAgain || false,
      peopleNames: meal.people?.map(p => p.name) || [],
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MealEditFormData) => {
      const formData = new FormData();
      
      if (data.photo) formData.append("photo", data.photo);
      if (data.dishName) formData.append("dishName", data.dishName);
      if (data.restaurantName) formData.append("restaurantName", data.restaurantName);
      if (data.description) formData.append("description", data.description);
      if (data.price) formData.append("price", data.price);
      if (data.portionSize) formData.append("portionSize", data.portionSize);
      formData.append("tasteRating", data.tasteRating.toString());
      formData.append("presentationRating", data.presentationRating.toString());
      formData.append("valueRating", data.valueRating.toString());
      formData.append("serviceRating", data.serviceRating.toString());
      formData.append("isExcellent", data.isExcellent.toString());
      formData.append("wantAgain", data.wantAgain.toString());
      formData.append("peopleNames", JSON.stringify(data.peopleNames));
      
      // Flag to indicate image should be deleted
      if (hasImageToDelete && !data.photo) {
        formData.append("deleteImage", "true");
      }

      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update meal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Cleanup state
      if (newImagePreview && newImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newImagePreview);
      }
      setNewImagePreview(null);
      setHasImageToDelete(false);
      
      setOpen(false);
      onUpdate();
      toast({ title: "Posiłek został zaktualizowany" });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować posiłku",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      onUpdate();
      toast({ 
        title: "Posiłek został usunięty",
        description: "Zdjęcie zostało również usunięte z serwera"
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć posiłku",
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

  const handleImageUpload = (file: File) => {
    form.setValue("photo", file);
    setNewImagePreview(URL.createObjectURL(file));
    setHasImageToDelete(false);
  };

  const handleRemoveCurrentImage = () => {
    setHasImageToDelete(true);
    setNewImagePreview(null);
    form.setValue("photo", undefined);
  };

  const handleRemoveNewImage = () => {
    if (newImagePreview && newImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview(null);
    form.setValue("photo", undefined);
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

  const onSubmit = async (data: MealEditFormData) => {
    // Auto-correct description before submitting
    if (data.description && data.description.trim().length > 0) {
      const correctedDescription = await textCorrection.correctText(data.description);
      data.description = correctedDescription;
    }
    
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-4 w-4 mr-2" />
          Edytuj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj posiłek</DialogTitle>
        </DialogHeader>
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
            {/* Image Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Zdjęcie posiłku</h3>
              
              {/* Current Image Display */}
              {meal.imageUrl && !hasImageToDelete && !newImagePreview && (
                <div className="relative">
                  <img
                    src={meal.imageUrl}
                    alt="Aktualne zdjęcie posiłku"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveCurrentImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Aktualne zdjęcie
                  </div>
                </div>
              )}

              {/* New Image Preview */}
              {newImagePreview && (
                <div className="relative">
                  <img
                    src={newImagePreview}
                    alt="Nowe zdjęcie posiłku"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveNewImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    Nowe zdjęcie (zostanie zapisane po zatwierdzeniu)
                  </div>
                </div>
              )}

              {/* Upload New Image */}
              {!newImagePreview && (
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {meal.imageUrl && !hasImageToDelete ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
                      </FormLabel>
                      <FormControl>
                        <FileUpload
                          onFileSelect={handleImageUpload}
                          isAnalyzing={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Message when image marked for deletion */}
              {hasImageToDelete && !newImagePreview && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-700">
                    Zdjęcie zostanie usunięte po zatwierdzeniu zmian
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setHasImageToDelete(false)}
                  >
                    Anuluj usuwanie
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Podstawowe informacje</h3>
              
              <FormField
                control={form.control}
                name="dishName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa dania</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Wpisz nazwę dania..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            <CommandEmpty>Nie znaleziono lokalu.</CommandEmpty>
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
                                      field.value === restaurant.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{restaurant.name}</div>
                                    {restaurant.address && (
                                      <div className="text-xs text-muted-foreground">
                                        {restaurant.address}
                                      </div>
                                    )}
                                    {restaurant.distanceInfo && (
                                      <div className="text-xs text-blue-600">
                                        📍 {restaurant.distanceInfo.formatted}
                                      </div>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Opisz swoje wrażenia z posiłku..."
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena (PLN)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
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
                      <FormLabel>Gramatura</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="np. 300g, Duża, Średnia"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rating System */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Oceny</h3>
              
              <FormField
                control={form.control}
                name="tasteRating"
                render={({ field }) => (
                  <FormItem>
                    <RatingSlider
                      label="Smak"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presentationRating"
                render={({ field }) => (
                  <FormItem>
                    <RatingSlider
                      label="Prezentacja"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueRating"
                render={({ field }) => (
                  <FormItem>
                    <RatingSlider
                      label="Stosunek jakości do ceny"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceRating"
                render={({ field }) => (
                  <FormItem>
                    <RatingSlider
                      label="Obsługa"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Special Flags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specjalne oznaczenia</h3>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isExcellent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Wyśmienite</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wantAgain"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Chcę ponownie</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* People Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Kto jadł?</h3>
              
              {/* Display selected people */}
              <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Usuń
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usuń posiłek</AlertDialogTitle>
                    <AlertDialogDescription>
                      Czy na pewno chcesz usunąć ten posiłek? Ta operacja nie może być cofnięta. 
                      Zdjęcie również zostanie usunięte z serwera.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteMutation.isPending ? "Usuwanie..." : "Usuń"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Save/Cancel Buttons */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Zapisywanie..." : "Zapisz"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}