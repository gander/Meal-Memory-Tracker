import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Camera, Sparkles } from "lucide-react";
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
  peopleNames: z.array(z.string()).default(["Ja"]),
});

type MealFormData = z.infer<typeof mealFormSchema>;

export default function AddMeal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      tasteRating: 0,
      presentationRating: 0,
      valueRating: 0,
      serviceRating: 0,
      isExcellent: false,
      wantAgain: false,
      peopleNames: ["Ja"],
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
        
        // Update form with AI suggestions
        if (analysis.suggestedDish) {
          form.setValue("dishName", analysis.suggestedDish);
        }
        if (analysis.suggestedRestaurant) {
          form.setValue("restaurantName", analysis.suggestedRestaurant);
        }
        if (analysis.suggestedRatings) {
          form.setValue("tasteRating", analysis.suggestedRatings.taste || 0);
          form.setValue("presentationRating", analysis.suggestedRatings.presentation || 0);
          form.setValue("valueRating", analysis.suggestedRatings.value || 0);
          form.setValue("serviceRating", analysis.suggestedRatings.service || 0);
        }

        toast({
          title: "Analiza AI zakończona",
          description: "Sugestie zostały dodane do formularza.",
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
        form.setValue("peopleNames", [...currentPeople, newPersonName.trim()]);
      }
      setNewPersonName("");
    }
  };

  const handleRemovePerson = (name: string) => {
    const currentPeople = form.getValues("peopleNames");
    form.setValue("peopleNames", currentPeople.filter(p => p !== name));
  };

  const onSubmit = (data: MealFormData) => {
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

                {/* Restaurant */}
                <FormField
                  control={form.control}
                  name="restaurantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokal</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Wpisz nazwę lokalu..." 
                            {...field} 
                          />
                          <div className="absolute right-3 top-3 text-neutral-400">
                            <Sparkles className="h-4 w-4" title="AI suggestions" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dish Name */}
                <FormField
                  control={form.control}
                  name="dishName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa dania</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="AI rozpozna danie ze zdjęcia..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        {name !== "Ja" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-auto p-0 text-white hover:text-neutral-200"
                            onClick={() => handleRemovePerson(name)}
                          >
                            ×
                          </Button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Dodaj osobę..."
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPerson())}
                    />
                    <Button type="button" onClick={handleAddPerson} disabled={!newPersonName.trim()}>
                      Dodaj
                    </Button>
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
