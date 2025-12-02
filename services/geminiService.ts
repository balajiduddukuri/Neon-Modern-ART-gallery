
import { GoogleGenAI } from "@google/genai";

// Use the flash image model which doesn't require explicit paid key selection in the UI
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateArt = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error("Invalid prompt provided");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Portrait format suitable for portraits/gallery
        },
      },
    });

    // Extract image
    // The response structure for images in generateContent can vary, we look for inlineData
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};
