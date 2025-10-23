import { GoogleGenAI, Modality, Chat } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Image Editing Service ---
export const editImageWithPrompt = async (
  productBase64: string,
  productMimeType: string,
  prompt: string,
  modelBase64?: string,
  modelMimeType?: string
): Promise<string> => {
  const ai = getAIClient();

  const parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = [
    { inlineData: { data: productBase64, mimeType: productMimeType } },
  ];

  if (modelBase64 && modelMimeType) {
    parts.push({ inlineData: { data: modelBase64, mimeType: modelMimeType } });
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && firstPart.inlineData) {
    return firstPart.inlineData.data;
  }
  throw new Error("No image data received from API.");
};


// --- Ad Image Generation Service ---
export const generateAdScene = async (baseImageBase64: string, baseImageMimeType: string, prompt: string): Promise<string> => {
    const ai = getAIClient();
    const parts = [
        { inlineData: { data: baseImageBase64, mimeType: baseImageMimeType } },
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
        return firstPart.inlineData.data;
    }
    throw new Error("No image data received from API.");
};


// --- Video Generation Service ---
export const generateVideoAd = async (prompt: string, base64ImageData?: string, mimeType?: string) => {
  // A new client is created to ensure the latest API key is used after selection.
  const ai = getAIClient();

  const imagePayload = (base64ImageData && mimeType) ? { image: { imageBytes: base64ImageData, mimeType } } : {};

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    ...imagePayload,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
    },
  });

  const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  const startTime = Date.now();

  while (!operation.done) {
    if (Date.now() - startTime > MAX_WAIT_MS) {
      throw new Error("Video generation timed out after 5 minutes. Please try a simpler prompt or try again later.");
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (downloadLink) {
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  throw new Error("Video generation failed or no video URI returned.");
};

// --- Chat Service ---
let chatInstance: Chat | null = null;

export const startChat = (): Chat => {
  if (chatInstance) {
    return chatInstance;
  }
  const ai = getAIClient();
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a helpful AI assistant for small business owners in Africa. Your name is Jenga, which means "build" in Swahili. You provide concise, actionable advice on marketing, sales, and branding.',
    },
  });
  return chatInstance;
};

export const streamChatMessage = (message: string) => {
    const chat = startChat();
    return chat.sendMessageStream({ message });
};