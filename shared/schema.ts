import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  dishId: integer("dish_id").references(() => dishes.id),
  photoUrl: text("photo_url"), // Keep for backward compatibility during migration
  imageData: text("image_data"), // QOI encoded image as base64 string
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  price: decimal("price", { precision: 10, scale: 2 }),
  description: text("description"),
  portionSize: text("portion_size"), // gramatura
  tasteRating: integer("taste_rating").notNull().default(0),
  presentationRating: integer("presentation_rating").notNull().default(0),
  valueRating: integer("value_rating").notNull().default(0),
  serviceRating: integer("service_rating").notNull().default(0),
  isExcellent: boolean("is_excellent").default(false),
  wantAgain: boolean("want_again").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealPeople = pgTable("meal_people", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id),
  personId: integer("person_id").references(() => people.id),
});

// Relations
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  meals: many(meals),
}));

export const dishesRelations = relations(dishes, ({ many }) => ({
  meals: many(meals),
}));

export const peopleRelations = relations(people, ({ many }) => ({
  mealPeople: many(mealPeople),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [meals.restaurantId],
    references: [restaurants.id],
  }),
  dish: one(dishes, {
    fields: [meals.dishId],
    references: [dishes.id],
  }),
  mealPeople: many(mealPeople),
}));

export const mealPeopleRelations = relations(mealPeople, ({ one }) => ({
  meal: one(meals, {
    fields: [mealPeople.mealId],
    references: [meals.id],
  }),
  person: one(people, {
    fields: [mealPeople.personId],
    references: [people.id],
  }),
}));

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
});

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  createdAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
}).extend({
  peopleNames: z.array(z.string()).optional(),
});

// Types
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Dish = typeof dishes.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;

export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type MealPerson = typeof mealPeople.$inferSelect;

// Extended types for API responses
export type MealWithDetails = Meal & {
  restaurant?: Restaurant;
  dish?: Dish;
  people: Person[];
  portionSize?: string;
  // Helper property for frontend image display
  imageUrl?: string;
};

export type MealStats = {
  totalMeals: number;
  avgRating: number;
  uniqueRestaurants: number;
  currentMonth: number;
};
