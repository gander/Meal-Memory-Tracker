import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMealSchema, insertRestaurantSchema, insertDishSchema } from "@shared/schema";
import { aiService } from "./services/openai";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Get meal statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getMealStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get meals with optional filters
  app.get("/api/meals", async (req, res) => {
    try {
      const { search, rating, limit, offset } = req.query;
      const meals = await storage.getMeals({
        search: search as string,
        rating: rating as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  // Get single meal
  app.get("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meal = await storage.getMeal(id);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(meal);
    } catch (error) {
      console.error("Error fetching meal:", error);
      res.status(500).json({ message: "Failed to fetch meal" });
    }
  });

  // Create new meal with AI assistance
  app.post("/api/meals", upload.single("photo"), async (req, res) => {
    try {
      let photoUrl: string | undefined;
      let aiAnalysis: any = {};

      // Handle photo upload and AI analysis
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
        
        try {
          // Convert image to base64 for AI analysis
          const imageBuffer = fs.readFileSync(req.file.path);
          const base64Image = imageBuffer.toString("base64");
          
          // Get AI analysis of the image
          aiAnalysis = await aiService.analyzeMealPhoto(base64Image, req.body.description || "");
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          // Continue without AI analysis if it fails
        }
      }

      // Parse form data
      const formData = {
        restaurantName: req.body.restaurantName || aiAnalysis.suggestedRestaurant,
        dishName: req.body.dishName || aiAnalysis.suggestedDish,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        description: req.body.description,
        tasteRating: parseInt(req.body.tasteRating) || 0,
        presentationRating: parseInt(req.body.presentationRating) || 0,
        valueRating: parseInt(req.body.valueRating) || 0,
        serviceRating: parseInt(req.body.serviceRating) || 0,
        isExcellent: req.body.isExcellent === "true",
        wantAgain: req.body.wantAgain === "true",
        peopleNames: req.body.peopleNames ? JSON.parse(req.body.peopleNames) : [],
      };

      // Handle restaurant
      let restaurantId: number | undefined;
      if (formData.restaurantName) {
        let restaurant = await storage.getRestaurantByName(formData.restaurantName);
        if (!restaurant) {
          restaurant = await storage.createRestaurant({ 
            name: formData.restaurantName,
            address: aiAnalysis.suggestedAddress 
          });
        }
        restaurantId = restaurant.id;
      }

      // Handle dish
      let dishId: number | undefined;
      if (formData.dishName) {
        let dish = await storage.getDishByName(formData.dishName);
        if (!dish) {
          dish = await storage.createDish({ 
            name: formData.dishName,
            category: aiAnalysis.suggestedCategory 
          });
        }
        dishId = dish.id;
      }

      // Validate meal data
      const mealData = {
        restaurantId,
        dishId,
        photoUrl,
        price: formData.price?.toString(),
        description: formData.description,
        tasteRating: formData.tasteRating,
        presentationRating: formData.presentationRating,
        valueRating: formData.valueRating,
        serviceRating: formData.serviceRating,
        isExcellent: formData.isExcellent,
        wantAgain: formData.wantAgain,
        peopleNames: formData.peopleNames,
      };

      const validatedData = insertMealSchema.parse(mealData);
      const meal = await storage.createMeal(validatedData);

      res.status(201).json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create meal" 
      });
    }
  });

  // Update meal
  app.patch("/api/meals/:id", upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      let photoUrl: string | undefined;
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
      }

      const formData = {
        restaurantName: req.body.restaurantName,
        dishName: req.body.dishName,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        description: req.body.description,
        tasteRating: req.body.tasteRating ? parseInt(req.body.tasteRating) : undefined,
        presentationRating: req.body.presentationRating ? parseInt(req.body.presentationRating) : undefined,
        valueRating: req.body.valueRating ? parseInt(req.body.valueRating) : undefined,
        serviceRating: req.body.serviceRating ? parseInt(req.body.serviceRating) : undefined,
        isExcellent: req.body.isExcellent !== undefined ? req.body.isExcellent === "true" : undefined,
        wantAgain: req.body.wantAgain !== undefined ? req.body.wantAgain === "true" : undefined,
        peopleNames: req.body.peopleNames ? JSON.parse(req.body.peopleNames) : undefined,
      };

      // Handle restaurant update
      let restaurantId: number | undefined;
      if (formData.restaurantName) {
        let restaurant = await storage.getRestaurantByName(formData.restaurantName);
        if (!restaurant) {
          restaurant = await storage.createRestaurant({ name: formData.restaurantName });
        }
        restaurantId = restaurant.id;
      }

      // Handle dish update
      let dishId: number | undefined;
      if (formData.dishName) {
        let dish = await storage.getDishByName(formData.dishName);
        if (!dish) {
          dish = await storage.createDish({ name: formData.dishName });
        }
        dishId = dish.id;
      }

      const updateData: any = {};
      if (restaurantId !== undefined) updateData.restaurantId = restaurantId;
      if (dishId !== undefined) updateData.dishId = dishId;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (formData.price !== undefined) updateData.price = formData.price.toString();
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.tasteRating !== undefined) updateData.tasteRating = formData.tasteRating;
      if (formData.presentationRating !== undefined) updateData.presentationRating = formData.presentationRating;
      if (formData.valueRating !== undefined) updateData.valueRating = formData.valueRating;
      if (formData.serviceRating !== undefined) updateData.serviceRating = formData.serviceRating;
      if (formData.isExcellent !== undefined) updateData.isExcellent = formData.isExcellent;
      if (formData.wantAgain !== undefined) updateData.wantAgain = formData.wantAgain;
      if (formData.peopleNames !== undefined) updateData.peopleNames = formData.peopleNames;

      const meal = await storage.updateMeal(id, updateData);
      res.json(meal);
    } catch (error) {
      console.error("Error updating meal:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update meal" 
      });
    }
  });

  // Delete meal
  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMeal(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Search restaurants
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const restaurants = await storage.searchRestaurants(q);
      res.json(restaurants);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  // Search dishes
  app.get("/api/dishes/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const dishes = await storage.searchDishes(q);
      res.json(dishes);
    } catch (error) {
      console.error("Error searching dishes:", error);
      res.status(500).json({ message: "Failed to search dishes" });
    }
  });

  // Search people
  app.get("/api/people/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const people = await storage.searchPeople(q);
      res.json(people);
    } catch (error) {
      console.error("Error searching people:", error);
      res.status(500).json({ message: "Failed to search people" });
    }
  });

  // AI photo analysis endpoint
  app.post("/api/analyze-photo", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo provided" });
      }

      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString("base64");
      
      const analysis = await aiService.analyzeMealPhoto(base64Image, req.body.description || "");
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing photo:", error);
      res.status(500).json({ message: "Failed to analyze photo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
