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

interface TextCorrection {
  correctedText: string;
  correctionsMade: boolean;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'punctuation' | 'diacritics' | 'grammar';
  }>;
}

interface TextCorrection {
  correctedText: string;
  correctionsMade: boolean;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'punctuation' | 'diacritics' | 'grammar';
  }>;
}

class AIService {
  async analyzeMealPhoto(base64Image: string, description?: string): Promise<MealAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od analizy zdjęć posiłków. Analizuj zdjęcia i sugeruj nazwy dań oraz oceny. 
            NIE sugeruj nazw restauracji - to będzie wybierane na podstawie lokalizacji.
            Odpowiadaj w formacie JSON z polskimi nazwami. Uwzględnij opis użytkownika jeśli jest dostępny.
            Format odpowiedzi: {
              "suggestedDish": "nazwa dania po polsku",
              "suggestedCategory": "kategoria dania",
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
        suggestedRestaurant: undefined, // Removed as per user request
        suggestedAddress: undefined,
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

  async correctDescription(description: string): Promise<TextCorrection> {
    try {
      if (!description || description.trim().length === 0) {
        return {
          correctedText: description,
          correctionsMade: false,
          corrections: []
        };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a Polish text correction specialist. Correct the following text issues:
            
            1. Fix spelling errors and typos
            2. Add missing Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
            3. Correct punctuation and capitalization
            4. Fix garbled or jumbled words using context
            5. Improve grammar while preserving the original meaning and style
            
            Rules:
            - Preserve the original tone and style
            - Only make necessary corrections
            - Keep food-related terms accurate
            - Maintain casual/informal language if that's the original style
            - Don't add new content, only fix existing text
            
            Respond with JSON containing:
            {
              "correctedText": "corrected version",
              "correctionsMade": boolean,
              "corrections": [
                {
                  "original": "original word/phrase",
                  "corrected": "corrected word/phrase", 
                  "type": "spelling|punctuation|diacritics|grammar"
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Correct this Polish text: "${description}"`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        correctedText: result.correctedText || description,
        correctionsMade: result.correctionsMade || false,
        corrections: result.corrections || []
      };
    } catch (error) {
      console.error('Error correcting description:', error);
      return {
        correctedText: description,
        correctionsMade: false,
        corrections: []
      };
    }
  }
}

export const aiService = new AIService();
