import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface MealAnalysis {
  suggestedDish: string;
  suggestedRestaurant?: string;
  suggestedCategory?: string;
  suggestedAddress?: string;
  suggestedRatings?: {
    taste: number;
    presentation: number;
    value: number;
    service: number;
  };
  confidence: number;
}

class AIService {
  async analyzeMealPhoto(base64Image: string, description?: string): Promise<MealAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od analizy zdjęć posiłków. Analizuj zdjęcia i sugeruj nazwy dań, kategorie, i potencjalne restauracje. 
            Odpowiadaj w formacie JSON z polskimi nazwami. Uwzględnij opis użytkownika jeśli jest dostępny.
            Format odpowiedzi: {
              "suggestedDish": "nazwa dania po polsku",
              "suggestedCategory": "kategoria dania",
              "suggestedRestaurant": "typ restauracji lub nazwa jeśli rozpoznawalna",
              "suggestedRatings": {
                "taste": ocena_smaku_od_minus3_do_plus3,
                "presentation": ocena_prezentacji_od_minus3_do_plus3,
                "value": ocena_wartości_od_minus3_do_plus3,
                "service": 0
              },
              "confidence": poziom_pewności_od_0_do_1
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Przeanalizuj to zdjęcie posiłku i sugeruj odpowiednie informacje. ${description ? `Dodatkowy opis od użytkownika: ${description}` : ""}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        suggestedDish: result.suggestedDish || "Nieznane danie",
        suggestedCategory: result.suggestedCategory || "Inne",
        suggestedRestaurant: result.suggestedRestaurant,
        suggestedAddress: result.suggestedAddress,
        suggestedRatings: result.suggestedRatings || {
          taste: 0,
          presentation: 0,
          value: 0,
          service: 0
        },
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error("Failed to analyze meal photo with AI");
    }
  }

  async suggestRestaurant(query: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od restauracji w Polsce. Sugeruj nazwy restauracji na podstawie zapytania użytkownika.
            Odpowiadaj w formacie JSON z listą sugestii.
            Format: { "suggestions": ["nazwa1", "nazwa2", "nazwa3"] }`
          },
          {
            role: "user",
            content: `Zasugeruj restauracje podobne do: ${query}. Maksymalnie 5 sugestii.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("Restaurant suggestion error:", error);
      return [];
    }
  }

  async suggestDish(query: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od polskiej i międzynarodowej kuchni. Sugeruj nazwy dań na podstawie zapytania użytkownika.
            Odpowiadaj w formacie JSON z listą sugestii.
            Format: { "suggestions": ["nazwa1", "nazwa2", "nazwa3"] }`
          },
          {
            role: "user",
            content: `Zasugeruj dania podobne do: ${query}. Maksymalnie 5 sugestii.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("Dish suggestion error:", error);
      return [];
    }
  }
}

export const aiService = new AIService();
