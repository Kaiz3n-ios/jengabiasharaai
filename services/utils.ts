import { GoogleGenAI, Modality, Chat } from "@google/genai";

// Fix: Define a global interface for `aistudio` to ensure type consistency
// across all declarations. This avoids conflicts when other parts of the
// application also augment the `Window` object.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Made the `aistudio` property optional to resolve a TypeScript declaration conflict.
    // The usage in `VideoGenerator.tsx` confirms that this property can be undefined.
    aistudio?: AIStudio;
  }
}

// Fix: Added missing file utility functions
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const dataUrlToParts = (dataUrl: string): { base64: string, mimeType: string } => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) {
    throw new Error('Invalid data URL.');
  }
  const mimeType = mimeMatch[1];
  const base64 = parts[1];
  return { base64, mimeType };
};
