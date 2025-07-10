import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Save, X, Trash2, Camera, Upload } from "lucide-react";
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
import type { MealWithDetails } from "@shared/schema";

const mealEditSchema = z.object({
  photo: z.any().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  portionSize: z.string().optional(),
  tasteRating: z.number().min(-3).max(3),
  presentationRating: z.number().min(-3).max(3),
  valueRating: z.number().min(-3).max(3),
  serviceRating: z.number().min(-3).max(3),
  isExcellent: z.boolean(),
  wantAgain: z.boolean(),
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
  const { toast } = useToast();
  const textCorrection = useTextCorrection();

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (newImagePreview && newImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  const form = useForm<MealEditFormData>({
    resolver: zodResolver(mealEditSchema),
    defaultValues: {
      photo: undefined,
      description: meal.description || "",
      price: meal.price || "",
      portionSize: meal.portionSize || "",
      tasteRating: meal.tasteRating,
      presentationRating: meal.presentationRating,
      valueRating: meal.valueRating,
      serviceRating: meal.serviceRating,
      isExcellent: meal.isExcellent || false,
      wantAgain: meal.wantAgain || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MealEditFormData) => {
      const formData = new FormData();
      
      if (data.photo) formData.append("photo", data.photo);
      if (data.description) formData.append("description", data.description);
      if (data.price) formData.append("price", data.price);
      if (data.portionSize) formData.append("portionSize", data.portionSize);
      formData.append("tasteRating", data.tasteRating.toString());
      formData.append("presentationRating", data.presentationRating.toString());
      formData.append("valueRating", data.valueRating.toString());
      formData.append("serviceRating", data.serviceRating.toString());
      formData.append("isExcellent", data.isExcellent.toString());
      formData.append("wantAgain", data.wantAgain.toString());
      
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Zdjęcie posiłku</h3>
              
              {/* Current Image Display */}
              {meal.photoUrl && !hasImageToDelete && !newImagePreview && (
                <div className="relative">
                  <img
                    src={meal.photoUrl}
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
                        {meal.photoUrl && !hasImageToDelete ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
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