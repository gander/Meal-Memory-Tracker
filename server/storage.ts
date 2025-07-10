import { 
  restaurants, dishes, people, meals, mealPeople,
  type Restaurant, type InsertRestaurant,
  type Dish, type InsertDish,
  type Person, type InsertPerson,
  type Meal, type InsertMeal,
  type MealWithDetails, type MealStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, sql, and } from "drizzle-orm";

export interface IStorage {
  // Restaurants
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantByName(name: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  searchRestaurants(query: string): Promise<Restaurant[]>;

  // Dishes
  getDish(id: number): Promise<Dish | undefined>;
  getDishByName(name: string): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  searchDishes(query: string): Promise<Dish[]>;

  // People
  getPerson(id: number): Promise<Person | undefined>;
  getPersonByName(name: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  searchPeople(query: string): Promise<Person[]>;

  // Meals
  getMeal(id: number): Promise<MealWithDetails | undefined>;
  getMeals(filters?: {
    search?: string;
    rating?: string;
    limit?: number;
    offset?: number;
  }): Promise<MealWithDetails[]>;
  createMeal(meal: InsertMeal): Promise<MealWithDetails>;
  updateMeal(id: number, meal: Partial<InsertMeal>): Promise<MealWithDetails>;
  deleteMeal(id: number): Promise<void>;

  // Stats
  getMealStats(): Promise<MealStats>;
}

export class DatabaseStorage implements IStorage {
  // Restaurants
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async getRestaurantByName(name: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.name, name));
    return restaurant || undefined;
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db
      .insert(restaurants)
      .values(insertRestaurant)
      .returning();
    return restaurant;
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    return await db
      .select()
      .from(restaurants)
      .where(like(restaurants.name, `%${query}%`))
      .limit(10);
  }

  // Dishes
  async getDish(id: number): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    return dish || undefined;
  }

  async getDishByName(name: string): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.name, name));
    return dish || undefined;
  }

  async createDish(insertDish: InsertDish): Promise<Dish> {
    const [dish] = await db
      .insert(dishes)
      .values(insertDish)
      .returning();
    return dish;
  }

  async searchDishes(query: string): Promise<Dish[]> {
    return await db
      .select()
      .from(dishes)
      .where(like(dishes.name, `%${query}%`))
      .limit(10);
  }

  // People
  async getPerson(id: number): Promise<Person | undefined> {
    const [person] = await db.select().from(people).where(eq(people.id, id));
    return person || undefined;
  }

  async getPersonByName(name: string): Promise<Person | undefined> {
    const [person] = await db.select().from(people).where(eq(people.name, name));
    return person || undefined;
  }

  async createPerson(insertPerson: InsertPerson): Promise<Person> {
    const [person] = await db
      .insert(people)
      .values(insertPerson)
      .returning();
    return person;
  }

  async searchPeople(query: string): Promise<Person[]> {
    return await db
      .select()
      .from(people)
      .where(like(people.name, `%${query}%`))
      .limit(10);
  }

  // Meals
  async getMeal(id: number): Promise<MealWithDetails | undefined> {
    const [meal] = await db
      .select({
        id: meals.id,
        restaurantId: meals.restaurantId,
        dishId: meals.dishId,
        photoUrl: meals.photoUrl,
        price: meals.price,
        description: meals.description,
        tasteRating: meals.tasteRating,
        presentationRating: meals.presentationRating,
        valueRating: meals.valueRating,
        serviceRating: meals.serviceRating,
        isExcellent: meals.isExcellent,
        wantAgain: meals.wantAgain,
        createdAt: meals.createdAt,
        restaurant: restaurants,
        dish: dishes,
      })
      .from(meals)
      .leftJoin(restaurants, eq(meals.restaurantId, restaurants.id))
      .leftJoin(dishes, eq(meals.dishId, dishes.id))
      .where(eq(meals.id, id));

    if (!meal) return undefined;

    const mealPeopleResult = await db
      .select({
        person: people,
      })
      .from(mealPeople)
      .leftJoin(people, eq(mealPeople.personId, people.id))
      .where(eq(mealPeople.mealId, id));

    return {
      ...meal,
      restaurant: meal.restaurant || undefined,
      dish: meal.dish || undefined,
      people: mealPeopleResult.map(mp => mp.person).filter(Boolean) as Person[],
    };
  }

  async getMeals(filters: {
    search?: string;
    rating?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MealWithDetails[]> {
    const { search, rating, limit = 20, offset = 0 } = filters;

    let query = db
      .select({
        id: meals.id,
        restaurantId: meals.restaurantId,
        dishId: meals.dishId,
        photoUrl: meals.photoUrl,
        price: meals.price,
        description: meals.description,
        tasteRating: meals.tasteRating,
        presentationRating: meals.presentationRating,
        valueRating: meals.valueRating,
        serviceRating: meals.serviceRating,
        isExcellent: meals.isExcellent,
        wantAgain: meals.wantAgain,
        createdAt: meals.createdAt,
        restaurant: restaurants,
        dish: dishes,
      })
      .from(meals)
      .leftJoin(restaurants, eq(meals.restaurantId, restaurants.id))
      .leftJoin(dishes, eq(meals.dishId, dishes.id));

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${restaurants.name} ILIKE ${`%${search}%`} OR ${dishes.name} ILIKE ${`%${search}%`} OR ${meals.description} ILIKE ${`%${search}%`})`
      );
    }

    if (rating) {
      switch (rating) {
        case 'excellent':
          conditions.push(eq(meals.isExcellent, true));
          break;
        case 'want-again':
          conditions.push(eq(meals.wantAgain, true));
          break;
        case 'high':
          conditions.push(
            sql`(${meals.tasteRating} >= 2 OR ${meals.presentationRating} >= 2 OR ${meals.valueRating} >= 2 OR ${meals.serviceRating} >= 2)`
          );
          break;
        case 'average':
          conditions.push(
            sql`(${meals.tasteRating} BETWEEN 0 AND 1 AND ${meals.presentationRating} BETWEEN 0 AND 1 AND ${meals.valueRating} BETWEEN 0 AND 1 AND ${meals.serviceRating} BETWEEN 0 AND 1)`
          );
          break;
        case 'low':
          conditions.push(
            sql`(${meals.tasteRating} <= -1 OR ${meals.presentationRating} <= -1 OR ${meals.valueRating} <= -1 OR ${meals.serviceRating} <= -1)`
          );
          break;
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const mealsResult = await query
      .orderBy(desc(meals.createdAt))
      .limit(limit)
      .offset(offset);

    // Get people for each meal
    const mealsWithPeople = await Promise.all(
      mealsResult.map(async (meal) => {
        const mealPeopleResult = await db
          .select({ person: people })
          .from(mealPeople)
          .leftJoin(people, eq(mealPeople.personId, people.id))
          .where(eq(mealPeople.mealId, meal.id));

        return {
          ...meal,
          restaurant: meal.restaurant || undefined,
          dish: meal.dish || undefined,
          people: mealPeopleResult.map(mp => mp.person).filter(Boolean) as Person[],
        };
      })
    );

    return mealsWithPeople;
  }

  async createMeal(insertMeal: InsertMeal): Promise<MealWithDetails> {
    const { peopleNames, ...mealData } = insertMeal;

    const [meal] = await db
      .insert(meals)
      .values(mealData)
      .returning();

    // Handle people associations
    if (peopleNames && peopleNames.length > 0) {
      for (const personName of peopleNames) {
        let person = await this.getPersonByName(personName);
        if (!person) {
          person = await this.createPerson({ name: personName });
        }

        await db.insert(mealPeople).values({
          mealId: meal.id,
          personId: person.id,
        });
      }
    }

    const createdMeal = await this.getMeal(meal.id);
    if (!createdMeal) {
      throw new Error("Failed to create meal");
    }

    return createdMeal;
  }

  async updateMeal(id: number, updateData: Partial<InsertMeal>): Promise<MealWithDetails> {
    const { peopleNames, ...mealData } = updateData;

    await db
      .update(meals)
      .set(mealData)
      .where(eq(meals.id, id));

    // Update people associations if provided
    if (peopleNames !== undefined) {
      // Remove existing associations
      await db.delete(mealPeople).where(eq(mealPeople.mealId, id));

      // Add new associations
      if (peopleNames.length > 0) {
        for (const personName of peopleNames) {
          let person = await this.getPersonByName(personName);
          if (!person) {
            person = await this.createPerson({ name: personName });
          }

          await db.insert(mealPeople).values({
            mealId: id,
            personId: person.id,
          });
        }
      }
    }

    const updatedMeal = await this.getMeal(id);
    if (!updatedMeal) {
      throw new Error("Failed to update meal");
    }

    return updatedMeal;
  }

  async deleteMeal(id: number): Promise<void> {
    // Delete associations first
    await db.delete(mealPeople).where(eq(mealPeople.mealId, id));
    
    // Delete meal
    await db.delete(meals).where(eq(meals.id, id));
  }

  async getMealStats(): Promise<MealStats> {
    const [totalMealsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(meals);

    const [avgRatingResult] = await db
      .select({
        avg: sql<number>`ROUND(AVG((${meals.tasteRating} + ${meals.presentationRating} + ${meals.valueRating} + ${meals.serviceRating})) / 4, 1)`
      })
      .from(meals);

    const [uniqueRestaurantsResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${meals.restaurantId})` })
      .from(meals)
      .where(sql`${meals.restaurantId} IS NOT NULL`);

    const [currentMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(meals)
      .where(sql`EXTRACT(MONTH FROM ${meals.createdAt}) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ${meals.createdAt}) = EXTRACT(YEAR FROM CURRENT_DATE)`);

    return {
      totalMeals: totalMealsResult.count || 0,
      avgRating: avgRatingResult.avg || 0,
      uniqueRestaurants: uniqueRestaurantsResult.count || 0,
      currentMonth: currentMonthResult.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
