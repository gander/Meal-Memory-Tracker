import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import RatingSlider from "@/components/ui/rating-slider";
import { Switch } from "@/components/ui/switch";
import type { MealWithDetails } from "@shared/schema";

const mealEditSchema = z.object({
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
  const { toast } = useToast();

  const form = useForm<MealEditFormData>({
    resolver: zodResolver(mealEditSchema),
    defaultValues: {
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
      
      if (data.description) formData.append("description", data.description);
      if (data.price) formData.append("price", data.price);
      if (data.portionSize) formData.append("portionSize", data.portionSize);
      formData.append("tasteRating", data.tasteRating.toString());
      formData.append("presentationRating", data.presentationRating.toString());
      formData.append("valueRating", data.valueRating.toString());
      formData.append("serviceRating", data.serviceRating.toString());
      formData.append("isExcellent", data.isExcellent.toString());
      formData.append("wantAgain", data.wantAgain.toString());

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

  const onSubmit = (data: MealEditFormData) => {
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
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}