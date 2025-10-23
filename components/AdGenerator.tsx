
import React, { useState, useCallback } from 'react';
import { dataUrlToParts } from '../services/utils';
import { generateAdScene } from '../services/geminiService';
import Spinner from './Spinner';
import { ArrowDownTrayIcon, InformationCircleIcon, ArrowPathIcon, UndoIcon, RedoIcon } from './IconComponents';
import ImageModal from './ImageModal';
import PromptAssistant from './PromptAssistant';
import { PhotoShootResult } from '../App';

interface AdGeneratorProps {
  photoShootResult: PhotoShootResult | null;
  showToast: (message: string) => void;
}

const adGeneratorCategories = [
  { title: 'Scene Style', key: 'style', options: ['Modern City', 'Traditional Market', 'Lush Nature', 'Luxury Interior'] },
  { title: 'Vibe / Mood', key: 'vibe', options: ['Elegant & Luxurious', 'Joyful & Celebratory', 'Casual & Relaxed', 'Professional & Sharp'] },
  { title: 'Ethnicity', key: 'ethnicity', options: ['Black African', 'East African', 'West African', 'North African'] },
  { title: 'Body Archetype', key: 'bodyArchetype', options: ['Slender', 'Curvy', 'Athletic', 'Plus-size'] },
  { title: 'Location', key: 'location', options: ['Nairobi', 'Lagos', 'Cape Town'], allowCustom: true },
];

const MAX_HISTORY_SIZE = 10;

const AdGenerator: React.FC<AdGeneratorProps> = ({ photoShootResult, showToast }) => {
  const [prompt, setPrompt] = useState<string>("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [productDescription, setProductDescription] = useState<string>('dress');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const currentImage = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  const adGeneratorTemplate = useCallback((options: Record<string, string>) => {
    const combinedSelections = {
      ...photoShootResult?.selections,
      ...options,
    };
    
    const location = combinedSelections.location || 'a vibrant African city';
    const style = combinedSelections.style || 'Modern City';
    const vibe = combinedSelections.vibe || 'Elegant & Luxurious';
    const subjectDescription = productDescription || 'the featured product';

    const coreInstruction = `**OUTPUT MUST BE AN IMAGE.** You are an expert creative director and retoucher for a high-end advertising campaign. Your task is to take the subject from the input image and place them into a new, photorealistic, 8K scene.`;
    
    const actionAndSubject = `
**Action:** Re-contextualize the subject from the input image into a new environment.
- **Input Image:** Contains the model wearing the product. This is your primary asset.
- **Task:** Create a new scene as described below, featuring the *exact same person and attire* from the Input Image.
    `;

    const sceneDescription = `
**New Scene:** A professional advertising photograph.
- **Environment:** A ${style} setting in ${location}.
- **Vibe & Mood:** The scene should feel ${vibe}.
- **Lighting:** Cinematic, professional lighting that matches the new environment perfectly.
- **Product Context:** The model is wearing: ${subjectDescription}.
    `;

    const fidelityMandate = `
**Fidelity Mandate (CRITICAL):**
- It is critical that you maintain the exact appearance of the person and their attire from the Input Image.
- You MUST preserve the exact design, pattern, color, texture, details, cut, length, and style of the clothing.
- **DO NOT change the garment or the model's appearance.** Your only job is to place them seamlessly into the new scene.
    `;

    return [coreInstruction, actionAndSubject, sceneDescription, fidelityMandate].join('\n\n');
}, [productDescription, photoShootResult]);


  const handleSubmit = useCallback(async () => {
    if (!photoShootResult?.imageUrl) {
      setError("Missing the image from the Photo Shoot step.");
      return;
    }
    if (!productDescription) {
      setError("Please describe your product.");
      return;
    }
    if (!prompt) {
      setError("Please compose a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { base64, mimeType } = dataUrlToParts(photoShootResult.imageUrl);
      const resultBase64 = await generateAdScene(base64, mimeType, prompt);
      const resultUrl = `data:image/png;base64,${resultBase64}`;

      const newHistory = history.slice(0, historyIndex + 1);
      const updatedHistory = [...newHistory, resultUrl];

      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        updatedHistory.shift();
      }

      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);

    } catch (e) {
      setError("Failed to generate ad image. This can sometimes happen with very complex scenes. Try simplifying your vision.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, productDescription, photoShootResult, history, historyIndex]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started...');
  };
  
  const handleUndo = () => {
    if (canUndo) {
        setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
        setHistoryIndex(historyIndex + 1);
    }
  };

  if (!photoShootResult) {
    return (
      <div className="text-center bg-gray-800/50 p-8 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-amber-400">Start with a Photo Shoot</h2>
          <p className="mt-4 text-gray-300">
              Please go to the "Photo Studio" tab first to generate a base image of your product on a model.
          </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">Step 2: The Ad Campaign</h2>
        <p className="mt-2 text-gray-400">Place your model in a stunning, hyper-realistic ad scene.</p>
      </div>
      
      {/* Product to Feature (Original Image) */}
      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-300">Product to Feature</h3>
            {photoShootResult.imageUrl && (
              <button
                onClick={() => handleDownload(photoShootResult.imageUrl, 'jenga-biashara-product.png')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-3 rounded-lg transition duration-300 text-sm"
              >
                <ArrowDownTrayIcon />
                <span>Download</span>
              </button>
            )}
          </div>
          <div className="aspect-w-1 aspect-h-1 w-full bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            <img src={photoShootResult.imageUrl} alt="Product from photo shoot" className="object-contain h-full w-full cursor-pointer" onClick={() => openModal(photoShootResult.imageUrl)} />
          </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-700">
        <div>
          <label htmlFor="product-description" className="block text-sm font-medium text-gray-300 mb-2">1. Product Description</label>
          <input
            id="product-description"
            type="text"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="e.g., 'a vibrant kitenge print dress'"
            className="block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">2. Your Ad Vision</label>
          <PromptAssistant
            prompt={prompt}
            setPrompt={setPrompt}
            optionCategories={adGeneratorCategories}
            promptTemplate={adGeneratorTemplate}
            initialSelections={photoShootResult.selections}
            onSelectionsChange={setSelections}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-4">
        {error ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt || !productDescription}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : <><ArrowPathIcon /> Retry Generation</>}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt || !productDescription}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Generate Ad Image'}
          </button>
        )}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
         <div className="p-4 bg-gray-900/70 rounded-lg border border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="text-amber-400 pt-1">
              <InformationCircleIcon />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200">A Note on Responsible Creation</h4>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-gray-400">
                <li>Use these tools to create diverse, positive, and authentic representations. Avoid perpetuating harmful stereotypes.</li>
                <li>AI-generated models are not real people and should not be used to misrepresent or impersonate individuals.</li>
                <li>You are responsible for the final images you create and share.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Ad */}
      {(isLoading || history.length > 0) && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-300">Generated Ad</h3>
              <div className="flex items-center gap-2">
                  <button onClick={handleUndo} disabled={!canUndo} className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors">
                    <UndoIcon />
                  </button>
                  <button onClick={handleRedo} disabled={!canRedo} className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors">
                    <RedoIcon />
                  </button>
                </div>
            </div>
            {currentImage && (
              <button
                onClick={() => handleDownload(currentImage, 'jenga-biashara-ad.png')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-3 rounded-lg transition duration-300 text-sm"
              >
                <ArrowDownTrayIcon />
                <span>Download</span>
              </button>
            )}
          </div>
          <div className="aspect-w-1 aspect-h-1 w-full bg-gray-900 rounded-md overflow-hidden flex items-center justify-center flex-grow min-h-[200px]">
            {isLoading && <Spinner />}
            {!isLoading && currentImage && (
              <img src={currentImage} alt="AI generated ad" className="object-contain h-full w-full cursor-pointer" onClick={() => openModal(currentImage)} />
            )}
          </div>
        </div>
      )}

      <ImageModal isOpen={!!modalImageUrl} imageUrl={modalImageUrl} onClose={closeModal} />
    </div>
  );
};

export default AdGenerator;
