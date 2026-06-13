import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "./logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type AnalysisMode = 'OUTFIT' | 'BEAUTY' | 'COLOR' | 'WARDROBE' | 'FACIAL_PROFILE' | 'MAKEUP' | 'HAIRSTYLE';

const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
  "gemini-pro-latest"
];

const IMAGE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

function isQuotaError(error: any): boolean {
  const msg = error?.message || error?.toString() || '';
  return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
}

async function runWithModelFallback(
  models: string[],
  fn: (modelName: string) => Promise<any>
): Promise<any> {
  let lastError: any = null;
  for (const modelName of models) {
    try {
      return await fn(modelName);
    } catch (error: any) {
      lastError = error;
      logger.warn(`Model ${modelName} failed, trying next fallback model... Error: ${error.message || error}`);
      continue; // Try next model
    }
  }
  // All models exhausted
  throw lastError;
}

export async function analyzeImageCore(
  base64Data: string,
  mimeType: string,
  mode: AnalysisMode = 'OUTFIT',
  locale: string = 'es',
  location: string = '',
  facialProfile: string = ''
) {
  const prompts = {
    OUTFIT: `
      Eres el Asesor de Estilo Personal de Looksy, experto en moda de lujo y tendencias actuales.
      Analiza la imagen adjunta (un outfit o persona vestida).
      Contexto del usuario: Ubicación: ${location || 'Global'}.
      Responde en ${locale === 'es' ? 'Español' : 'English'} siguiendo estrictamente este formato JSON:
      {
        "feedback": "Un análisis detallado (3-4 párrafos) que proyecte exclusividad. Habla sobre la coherencia del outfit, el uso de colores y texturas, y cómo se adapta a la ubicación mencionada.",
        "harmonyScore": 0-100,
        "style": "Nombre del estilo (ej. Quiet Luxury, Streetwear, Old Money)",
        "pros": ["mínimo 3 aciertos técnicos"],
        "cons": ["mínimo 2 puntos de mejora"],
        "tips": ["3 consejos de experto para elevar el look"]
      }
    `,
    BEAUTY: `
      Eres un experto en visagismo y estética facial de alta gama para Looksy.
      Analiza la foto del rostro adjunta.
      Perfil facial previo: ${facialProfile || 'No analizado'}.
      Responde en ${locale === 'es' ? 'Español' : 'English'} siguiendo estrictamente este formato JSON:
      {
        "feedback": "Análisis detallado de la simetría, proporciones y armonía facial. Proyecta un tono profesional y empoderador.",
        "harmonyScore": 0-100,
        "faceShape": "Forma identificada (Ovalada, Diamante, etc.)",
        "skinTone": "Subtono y estación cromática",
        "recommendations": {
          "makeup": "Técnicas de maquillaje sugeridas",
          "hairstyle": "Estilos de cabello ideales"
        }
      }
    `,
    COLOR: `
      Realiza un análisis de colorimetría avanzado. Identifica la estación (Primavera, Verano, Otoño, Invierno) y los colores que más favorecen.
      Responde JSON: { "feedback": "Análisis de color", "harmonyScore": 0-100, "palette": ["hex codes"], "season": "string" }
    `,
    WARDROBE: `
      Identifica todas las prendas en la imagen. Clasifícalas y describe su estilo.
      Responde JSON: { "feedback": "Resumen de prendas", "harmonyScore": 0-100, "items": [{ "category": "string", "color": "string", "style": "string" }] }
    `,
    FACIAL_PROFILE: `
      Eres un experto en visagismo y análisis facial de alta gama para Looksy.
      Analiza la foto del rostro adjunta.
      Responde en ${locale === 'es' ? 'Español' : 'English'} siguiendo estrictamente este formato JSON:
      {
        "faceShape": "Forma identificada (e.g. Ovalada, Diamante, Redonda, Cuadrada, Rectangular, Corazón)",
        "skinTone": "Estación y subtono cromático (ej. Otoño Cálido, Primavera Clara)",
        "eyebrows": "Recomendación específica para cejas",
        "jawline": "Características de la mandíbula y pómulos"
      }
    `,
    MAKEUP: `
      Eres un experto en maquillaje profesional y visagismo de alta gama para Looksy.
      Analiza la foto del rostro adjunta.
      Perfil facial previo: ${facialProfile || 'No analizado'}.
      Responde en ${locale === 'es' ? 'Español' : 'English'} siguiendo estrictamente este formato JSON:
      {
        "harmonyScore": 0-100,
        "faceShape": "Forma identificada (Ovalada, Diamante, etc.)",
        "colorPalette": "Subtono y estación cromática (ej. Otoño Cálido)",
        "keyFeatures": ["mínimo 3 rasgos clave identificados, e.g. Cejas arqueadas, Pómulos altos, Ojos expresivos"],
        "suggestions": ["mínimo 3 recomendaciones de maquillaje personalizadas y detalladas para elevar su estilo"]
      }
    `,
    HAIRSTYLE: `
      Eres un experto en estilismo de cabello y visagismo de alta gama para Looksy.
      Analiza la foto del rostro adjunta.
      Perfil facial previo: ${facialProfile || 'No analizado'}.
      Responde en ${locale === 'es' ? 'Español' : 'English'} siguiendo estrictamente este formato JSON:
      {
        "harmonyScore": 0-100,
        "faceShape": "Forma identificada (Ovalada, Diamante, etc.)",
        "colorPalette": "Subtono y estación cromática o color ideal",
        "keyFeatures": ["mínimo 3 rasgos clave identificados, e.g. Rostro alargado, Frente despejada, Ojos almendrados"],
        "suggestions": ["mínimo 3 recomendaciones de peinado y corte personalizadas y detalladas según su estructura facial"]
      }
    `
  };

  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent([
        prompts[mode] || prompts.OUTFIT,
        { inlineData: { data: base64Data, mimeType } }
      ]);

      const text = result.response.text();
      return JSON.parse(text);
    });
  } catch (error: any) {
    logger.error(`Error in analyzeImageCore (${mode}):`, error.message);
    throw error;
  }
}

export async function analyzeImage(base64Data: string, mimeType: string, mode: AnalysisMode = 'OUTFIT') {
  // Backwards compatibility wrapper
  const result = await analyzeImageCore(base64Data, mimeType, mode);
  return result;
}

export async function identifyGarment(base64Data: string, mimeType: string) {
  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Analiza esta prenda y devuelve JSON: { "category": "TOP"|"BOTTOM"|"SHOES"|"ACCESSORY", "color": "string", "style": "string" }`;
      const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    });
  } catch (error: any) {
    logger.error('Error in identifyGarment:', error.message);
    throw error;
  }
}

export async function analyzeFit(
  userImageBase64: string,
  garmentImageBase64: string,
  locale: string = 'es',
  garmentCategory: string = 'top'
) {
  const prompt = `
    Eres un Asesor de Imagen de Lujo. Tienes dos imágenes:
    1. El "Clon Digital" del usuario (su cuerpo y rostro).
    2. Una prenda de ropa (${garmentCategory}).
    
    Analiza ambas. Responde en ${locale} con este JSON exacto:
    { "fitAnalysis": "string", "styleVerdict": "string", "matchScore": 0-100, "suggestions": ["list"] }
  `;

  return runWithModelFallback(TEXT_MODELS, async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: userImageBase64, mimeType: "image/jpeg" } },
      { inlineData: { data: garmentImageBase64, mimeType: "image/jpeg" } }
    ]);
    const text = result.response.text();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return JSON.parse(cleaned.substring(start, end + 1));
  });
}

export async function generateNanoBananaVTO(
  userImageBase64: string,
  garmentImageBase64: string,
  garmentCategory: string = 'top'
) {
  const prompt = `
    VIRTUAL TRY-ON. You MUST generate a new image.
    - Person: IMAGE 1
    - Garment (${garmentCategory}): IMAGE 2
    Generate a photorealistic fashion image of the person wearing the garment.
    Maintain face identity, body shape, and pose exactly.
    Output the generated image.
  `;

  try {
    const resultUrl = await runWithModelFallback(IMAGE_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.7 } });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: userImageBase64, mimeType: "image/jpeg" } },
        { inlineData: { data: garmentImageBase64, mimeType: "image/jpeg" } }
      ]);
      const response = await result.response;
      const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imagePart?.inlineData) {
        return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
      }
      logger.warn(`${modelName} returned no image part — returning fallback`);
      return `data:image/jpeg;base64,${userImageBase64}`;
    });
    return resultUrl || `data:image/jpeg;base64,${userImageBase64}`;
  } catch (error: any) {
    logger.error("Nano Banana VTO failed, using user image as fallback:", error.message);
    return `data:image/jpeg;base64,${userImageBase64}`;
  }
}

export async function generateDailyOutfit(context: any) {
  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Sugiere un outfit diario basado en: ${JSON.stringify(context)}. Responde JSON: { "message": "string", "selectedItemIds": ["ids"] }`;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
    });
  } catch (error: any) {
    logger.error('Error in generateDailyOutfit:', error.message);
    throw error;
  }
}

export async function generateChallenges() {
  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Genera 3 retos de moda. Responde JSON array: [{ "title": "string", "description": "string" }]`;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
    });
  } catch (error: any) {
    logger.error('Error in generateChallenges:', error.message);
    throw error;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    logger.error('Error generating embedding:', error.message);
    throw error;
  }
}

export async function generateCampaignContent(topic: string, locale: string = 'es') {
  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `
        Genera contenido de campaña de marketing de moda premium para el tema: "${topic}".
        Responde estrictamente en formato JSON en el idioma: ${locale === 'es' ? 'Español' : 'English'}.
        El JSON debe tener exactamente esta estructura:
        {
          "title": "Título sugerido para la campaña",
          "subjectLine": "Asunto atractivo para email marketing",
          "description": "Una descripción premium o copy principal de la campaña (1-2 párrafos)",
          "callToAction": "Texto para el botón de acción (CTA)",
          "socialMediaPosts": [
            "Ejemplo de post para Instagram/TikTok con hashtags",
            "Otro ejemplo de post corto"
          ]
        }
      `;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    });
  } catch (error: any) {
    logger.error('Error in generateCampaignContent:', error.message);
    throw error;
  }
}

export async function generateEventStyling(
  eventTitle: string,
  eventDesc: string,
  dressCode: string,
  garments: { name?: string; category: string; color?: string | null; brand?: string | null }[]
): Promise<string> {
  const garmentsListStr = garments
    .map((g) => {
      const name = g.name || `${g.color || ''} ${g.brand || ''} ${g.category}`.trim();
      return `- ${name} (${g.category})`;
    })
    .join('\n');

  const prompt = `
    Actúa como el estilista personal estrella de Looksy. El usuario asistirá a un evento social.
    Detalles del evento:
    - Título: ${eventTitle}
    - Descripción: ${eventDesc || 'Sin descripción'}
    - Código de vestimenta obligatorio: ${dressCode}

    Prendas disponibles en el ropero del usuario:
    ${garmentsListStr}

    Por favor, analiza estas prendas y recomiéndale el outfit perfecto combinándolas.
    Sé creativo, profesional y amigable en español.
    Si consideras que le falta alguna prenda básica o accesorio clave para clavar el look sugerido, menciónala amigablemente al final bajo el título "Tip de Estilo 💡".
  `;

  return runWithModelFallback(TEXT_MODELS, async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

export async function generateStylistOutfits(wardrobe: any[], stylePreferences: any) {
  const prompt = `
    Eres el Asesor de Imagen de Lujo de Looksy.
    Se te proporciona el ropero del usuario: ${JSON.stringify(wardrobe)}
    Preferencias de estilo: ${JSON.stringify(stylePreferences)}

    Crea 3 opciones de outfits completos diferentes (por ejemplo: Casual, Formal, Noche, Deportivo, etc.) utilizando EXCLUSIVAMENTE los IDs de prendas provistos en el ropero.
    Cada outfit debe incluir al menos 2 prendas (ej. Remera y Pantalón).
    
    Responde estrictamente en formato JSON en Español con la siguiente estructura:
    {
      "outfits": [
        {
          "title": "Nombre del outfit (ej. Quiet Luxury Urbano)",
          "description": "Una descripción detallada de por qué combinan estas prendas y consejos de estilo para el look.",
          "confidence": 85,
          "itemIds": ["id1", "id2"]
        }
      ]
    }
  `;

  try {
    return await runWithModelFallback(TEXT_MODELS, async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    });
  } catch (error: any) {
    logger.error('Error in generateStylistOutfits:', error.message);
    throw error;
  }
}


