import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Pencil, Trash2, Building, Utensils, Users } from "lucide-react";
import LocationPicker from "@/components/ui/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const restaurantSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const dishSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  category: z.string().optional(),
});

const personSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;
type DishFormData = z.infer<typeof dishSchema>;
type PersonFormData = z.infer<typeof personSchema>;

interface EntityFormProps<T> {
  entity?: T;
  onSubmit: (data: T) => void;
  onCancel: () => void;
  schema: z.ZodSchema<T>;
  defaultValues: T;
  title: string;
  fields: Array<{
    name: keyof T;
    label: string;
    type?: "text" | "textarea";
    placeholder?: string;
  }>;
}

function EntityForm<T extends Record<string, any>>({
  entity,
  onSubmit,
  onCancel,
  schema,
  defaultValues,
  title,
  fields,
}: EntityFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: entity || defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entity ? `Edytuj ${title}` : `Dodaj ${title}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field) => (
              <FormField
                key={field.name as string}
                control={form.control}
                name={field.name as any}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {field.type === "textarea" ? (
                        <Textarea
                          placeholder={field.placeholder}
                          {...formField}
                        />
                      ) : (
                        <Input
                          placeholder={field.placeholder}
                          {...formField}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex gap-2">
              <Button type="submit">
                {entity ? "Aktualizuj" : "Dodaj"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Anuluj
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RestaurantManager() {
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [restaurantLocation, setRestaurantLocation] = useState<{latitude: string, longitude: string} | null>(null);
  const { toast } = useToast();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["/api/restaurants"],
    queryFn: () => fetch("/api/restaurants").then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: RestaurantFormData) =>
      fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setShowForm(false);
      toast({ title: "Lokal został dodany" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RestaurantFormData }) =>
      fetch(`/api/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setEditingRestaurant(null);
      toast({ title: "Lokal został zaktualizowany" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/restaurants/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Lokal został usunięty" });
    },
  });

  const handleSubmit = (data: RestaurantFormData) => {
    // Include GPS coordinates from LocationPicker if available
    const submitData = { ...data };
    if (restaurantLocation) {
      submitData.latitude = restaurantLocation.latitude;
      submitData.longitude = restaurantLocation.longitude;
    }
    
    if (editingRestaurant) {
      updateMutation.mutate({ id: editingRestaurant.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Update location picker when editing restaurant
  const handleEdit = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    if (restaurant.latitude && restaurant.longitude) {
      setRestaurantLocation({
        latitude: restaurant.latitude,
        longitude: restaurant.longitude
      });
    } else {
      setRestaurantLocation(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRestaurant(null);
    setRestaurantLocation(null);
  };

  if (showForm || editingRestaurant) {
    return (
      <div className="space-y-6">
        <EntityForm
          entity={editingRestaurant}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          schema={restaurantSchema}
          defaultValues={{ name: "", address: "", latitude: "", longitude: "" }}
          title="lokal"
          fields={[
            { name: "name", label: "Nazwa", placeholder: "Nazwa lokalu..." },
            { name: "address", label: "Adres", placeholder: "Adres lokalu..." },
          ]}
        />
        
        {/* GPS Location Picker */}
        <LocationPicker
          value={restaurantLocation}
          onChange={setRestaurantLocation}
          label="Lokalizacja GPS"
          allowManualEdit={true}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Lokale ({restaurants.length})
        </CardTitle>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj lokal
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Ładowanie...</div>
        ) : restaurants.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Brak lokali. Dodaj pierwszy lokal.
          </div>
        ) : (
          <div className="space-y-2">
            {restaurants.map((restaurant: any) => (
              <div key={restaurant.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{restaurant.name}</div>
                  {restaurant.address && (
                    <div className="text-sm text-muted-foreground">{restaurant.address}</div>
                  )}
                  {restaurant.latitude && restaurant.longitude && (
                    <div className="text-xs text-green-600">
                      GPS: {parseFloat(restaurant.latitude).toFixed(4)}, {parseFloat(restaurant.longitude).toFixed(4)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(restaurant)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(restaurant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DishManager() {
  const [editingDish, setEditingDish] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: dishes = [], isLoading } = useQuery({
    queryKey: ["/api/dishes"],
    queryFn: () => fetch("/api/dishes").then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: DishFormData) =>
      fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      setShowForm(false);
      toast({ title: "Danie zostało dodane" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DishFormData }) =>
      fetch(`/api/dishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      setEditingDish(null);
      toast({ title: "Danie zostało zaktualizowane" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/dishes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({ title: "Danie zostało usunięte" });
    },
  });

  const handleSubmit = (data: DishFormData) => {
    if (editingDish) {
      updateMutation.mutate({ id: editingDish.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (showForm || editingDish) {
    return (
      <EntityForm
        entity={editingDish}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingDish(null);
        }}
        schema={dishSchema}
        defaultValues={{ name: "", category: "" }}
        title="danie"
        fields={[
          { name: "name", label: "Nazwa", placeholder: "Nazwa dania..." },
          { name: "category", label: "Kategoria", placeholder: "np. Główne, Deser..." },
        ]}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Dania ({dishes.length})
        </CardTitle>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj danie
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Ładowanie...</div>
        ) : dishes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Brak dań. Dodaj pierwsze danie.
          </div>
        ) : (
          <div className="space-y-2">
            {dishes.map((dish: any) => (
              <div key={dish.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{dish.name}</div>
                  {dish.category && (
                    <div className="text-sm text-muted-foreground">{dish.category}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingDish(dish)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(dish.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PeopleManager() {
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["/api/people"],
    queryFn: () => fetch("/api/people").then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: PersonFormData) =>
      fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      setShowForm(false);
      toast({ title: "Osoba została dodana" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PersonFormData }) =>
      fetch(`/api/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      setEditingPerson(null);
      toast({ title: "Osoba została zaktualizowana" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/people/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({ title: "Osoba została usunięta" });
    },
  });

  const handleSubmit = (data: PersonFormData) => {
    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (showForm || editingPerson) {
    return (
      <EntityForm
        entity={editingPerson}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingPerson(null);
        }}
        schema={personSchema}
        defaultValues={{ name: "" }}
        title="osobę"
        fields={[
          { name: "name", label: "Imię", placeholder: "Imię osoby..." },
        ]}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Osoby ({people.length})
        </CardTitle>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj osobę
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Ładowanie...</div>
        ) : people.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Brak osób. Dodaj pierwszą osobę.
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((person: any) => (
              <div key={person.id} className="flex items-center justify-between p-3 border rounded">
                <div className="font-medium">{person.name}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPerson(person)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(person.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Manage() {
  const [, setLocation] = useLocation();

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
            <h1 className="text-xl font-bold text-secondary">Zarządzanie danymi</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="restaurants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="restaurants">Lokale</TabsTrigger>
            <TabsTrigger value="dishes">Dania</TabsTrigger>
            <TabsTrigger value="people">Osoby</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants">
            <RestaurantManager />
          </TabsContent>

          <TabsContent value="dishes">
            <DishManager />
          </TabsContent>

          <TabsContent value="people">
            <PeopleManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}