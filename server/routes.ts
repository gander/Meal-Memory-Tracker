import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMealSchema, insertRestaurantSchema, insertDishSchema, insertPersonSchema } from "@shared/schema";
import { aiService } from "./services/openai";
import { qoiImageService } from "./services/qoi-image";
import multer from "multer";
import path from "path";
import fs from "fs";

// Helper function for safe file deletion
const safeDeleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (!filePath) return false;
    
    // Convert photoUrl to actual file path
    const actualPath = filePath.startsWith('/uploads/') 
      ? filePath.substring(1) // Remove leading slash
      : filePath;
    
    // Check if file exists before attempting deletion
    if (fs.existsSync(actualPath)) {
      await fs.promises.unlink(actualPath);
      console.log(`Successfully deleted file: ${actualPath}`);
      return true;
    } else {
      console.log(`File not found (already deleted): ${actualPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    // Don't throw error - deletion should be resilient to missing files
    return false;
  }
};

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
  // Serve uploaded files (for backward compatibility with existing photoUrl entries)
  app.use("/uploads", express.static("uploads"));
  
  // Serve QOI images from database
  app.get("/api/images/:id", async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const meal = await storage.getMeal(mealId);
      
      if (!meal || !meal.imageData) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      let pngBuffer: Buffer;
      
      try {
        // Try QOI decoding first
        pngBuffer = await qoiImageService.convertQOIToWebFormat(
          meal.imageData,
          meal.imageWidth || 800,
          meal.imageHeight || 600
        );
      } catch (qoiError) {
        console.log('QOI decoding failed, trying base64 fallback');
        // Fallback: treat as base64 image and convert to PNG
        const imageBuffer = Buffer.from(meal.imageData, 'base64');
        pngBuffer = await sharp(imageBuffer).png().toBuffer();
      }
      
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      });
      
      res.send(pngBuffer);
    } catch (error) {
      console.error("Error serving QOI image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

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
      let imageData: string | undefined;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;
      
      if (req.file) {
        try {
          // Convert image to base64 for AI analysis first
          const imageBuffer = fs.readFileSync(req.file.path);
          const base64Image = imageBuffer.toString("base64");
          
          // Get AI analysis of the image
          aiAnalysis = await aiService.analyzeMealPhoto(base64Image, req.body.description || "");
          
          // Process image for QOI storage in database
          console.log('Starting QOI image processing...');
          try {
            const qoiResult = await qoiImageService.processImageForStorage(imageBuffer);
            imageData = qoiResult.qoiData;
            imageWidth = qoiResult.width;
            imageHeight = qoiResult.height;
            console.log(`QOI processing complete: ${imageWidth}x${imageHeight}, data length: ${imageData.length}`);
          } catch (qoiError) {
            console.error('QOI processing failed, falling back to base64:', qoiError);
            // Fallback to base64 storage if QOI fails  
            const sharp = require('sharp');
            const base64ImageFallback = imageBuffer.toString('base64');
            imageData = base64ImageFallback;
            const metadata = await sharp(imageBuffer).metadata();
            imageWidth = metadata.width || 800;
            imageHeight = metadata.height || 600;
            console.log(`Fallback base64 processing: ${imageWidth}x${imageHeight}, data length: ${imageData.length}`);
          }
          
          // Clean up temporary file
          await fs.promises.unlink(req.file.path);
        } catch (processingError) {
          console.error("Image processing failed:", processingError);
          console.error("Stack trace:", processingError.stack);
          // Clean up temporary file on error
          if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => {});
          }
          // Continue without image if processing fails
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
        photoUrl, // Keep for backward compatibility
        imageData,
        imageWidth,
        imageHeight,
        price: formData.price?.toString(),
        description: formData.description,
        portionSize: req.body.portionSize,
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
      
      // Get current meal for reference
      const currentMeal = await storage.getMeal(id);
      
      let photoUrl: string | undefined;
      let imageData: string | undefined;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;
      let shouldDeleteCurrentImage = false;

      // Handle new photo upload
      if (req.file) {
        try {
          // Process image for QOI storage in database
          const imageBuffer = fs.readFileSync(req.file.path);
          const qoiResult = await qoiImageService.processImageForStorage(imageBuffer);
          
          imageData = qoiResult.qoiData;
          imageWidth = qoiResult.width;
          imageHeight = qoiResult.height;
          
          // Clean up temporary file
          await fs.promises.unlink(req.file.path);
          
          // Clean up old file if it exists
          if (currentMeal?.photoUrl) {
            await safeDeleteFile(currentMeal.photoUrl);
          }
        } catch (processingError) {
          console.error("Image processing failed:", processingError);
          // Clean up temporary file on error
          if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => {});
          }
          throw processingError;
        }
      }

      // Handle explicit image deletion request
      if (req.body.deleteImage === "true" && !req.file) {
        shouldDeleteCurrentImage = true;
        photoUrl = null; // Set to null to clear the photoUrl field
        imageData = null; // Clear QOI data
        imageWidth = null;
        imageHeight = null;
        
        // Delete the current image file if it exists
        if (currentMeal?.photoUrl) {
          await safeDeleteFile(currentMeal.photoUrl);
        }
      }

      const formData = {
        restaurantName: req.body.restaurantName,
        dishName: req.body.dishName,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        description: req.body.description,
        portionSize: req.body.portionSize,
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
      if (imageData !== undefined) updateData.imageData = imageData;
      if (imageWidth !== undefined) updateData.imageWidth = imageWidth;
      if (imageHeight !== undefined) updateData.imageHeight = imageHeight;
      if (shouldDeleteCurrentImage) {
        updateData.photoUrl = null;
        updateData.imageData = null;
        updateData.imageWidth = null;
        updateData.imageHeight = null;
      }
      if (formData.price !== undefined) updateData.price = formData.price.toString();
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.portionSize !== undefined) updateData.portionSize = formData.portionSize;
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
      
      // Get meal details before deletion to access photo URL
      const meal = await storage.getMeal(id);
      
      // Delete the meal from database
      await storage.deleteMeal(id);
      
      // Attempt to delete associated image file (resilient to missing files)
      if (meal?.photoUrl) {
        await safeDeleteFile(meal.photoUrl);
      }
      
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

  // CRUD for Restaurants
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(validatedData);
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create restaurant" 
      });
    }
  });

  app.patch("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRestaurantSchema.partial().parse(req.body);
      const restaurant = await storage.updateRestaurant(id, validatedData);
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update restaurant" 
      });
    }
  });

  app.delete("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRestaurant(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  // CRUD for Dishes
  app.get("/api/dishes", async (req, res) => {
    try {
      const dishes = await storage.getDishes();
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ message: "Failed to fetch dishes" });
    }
  });

  app.get("/api/dishes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dish = await storage.getDish(id);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error fetching dish:", error);
      res.status(500).json({ message: "Failed to fetch dish" });
    }
  });

  app.post("/api/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create dish" 
      });
    }
  });

  app.patch("/api/dishes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDishSchema.partial().parse(req.body);
      const dish = await storage.updateDish(id, validatedData);
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update dish" 
      });
    }
  });

  app.delete("/api/dishes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDish(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ message: "Failed to delete dish" });
    }
  });

  // CRUD for People
  app.get("/api/people", async (req, res) => {
    try {
      const people = await storage.getPeople();
      res.json(people);
    } catch (error) {
      console.error("Error fetching people:", error);
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get("/api/people/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const person = await storage.getPerson(id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post("/api/people", async (req, res) => {
    try {
      const validatedData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(validatedData);
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create person" 
      });
    }
  });

  app.patch("/api/people/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPersonSchema.partial().parse(req.body);
      const person = await storage.updatePerson(id, validatedData);
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update person" 
      });
    }
  });

  app.delete("/api/people/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePerson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
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

  // Text correction endpoint
  app.post("/api/correct-text", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required" });
      }

      const correction = await aiService.correctDescription(text);
      res.json(correction);
    } catch (error) {
      console.error("Text correction error:", error);
      res.status(500).json({ message: "Failed to correct text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
