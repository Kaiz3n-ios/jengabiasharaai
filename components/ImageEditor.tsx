
import React, { useState, useCallback, useEffect } from 'react';
import { fileToDataUrl, fileToBase64 } from '../services/utils';
import { editImageWithPrompt } from '../services/geminiService';
import Spinner from './Spinner';
import { ArrowDownTrayIcon, InformationCircleIcon, ArrowPathIcon, UndoIcon, RedoIcon, CameraIcon } from './IconComponents';
import ImageModal from './ImageModal';
import PromptAssistant from './PromptAssistant';
import { PhotoShootResult } from '../App';
import CameraCapture from './CameraCapture';

interface ImageEditorProps {
  onGenerationComplete: (result: PhotoShootResult) => void;
  showToast: (message: string) => void;
}

const imageEditorCategories = [
  { title: 'Model Type', key: 'model', options: ['Professional female model', 'Professional male model', 'Realistic mannequin'] },
  { title: 'Ethnicity', key: 'ethnicity', options: ['Black African', 'East African', 'West African', 'North African'] },
  { title: 'Body Archetype', key: 'bodyArchetype', options: ['Slender', 'Curvy', 'Athletic', 'Plus-size'] },
  { title: 'Background', key: 'background', options: ['Clean studio background', 'Outdoor nature scene', 'Urban cityscape', 'Beach setting'] },
  { title: 'Lighting', key: 'lighting', options: ['Bright studio lighting', 'Golden hour sunlight', 'Soft natural light'] },
];

const MAX_HISTORY_SIZE = 10;

const ImageEditor: React.FC<ImageEditorProps> = ({ onGenerationComplete, showToast }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [file, setFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelImagePreview, setModelImagePreview] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCameraSupported, setIsCameraSupported] = useState<boolean>(false);

  const currentImage = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsCameraSupported(true);
    }
  }, []);

  useEffect(() => {
      if (currentImage) {
          onGenerationComplete({ imageUrl: currentImage, selections });
      }
  }, [currentImage, selections, onGenerationComplete]);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  const imageEditorTemplate = useCallback((options: Record<string, string>) => {
    const coreInstruction = `**OUTPUT MUST BE AN IMAGE.** You are an expert fashion e-commerce photographer and retoucher. Your task is to create a single, ultra-realistic, photorealistic, 8K image.`;

    let actionAndSubject: string;

    if (modelFile) {
        actionAndSubject = `
**Action:** Composite the two input images.
- **Input Image 1 (Product):** Contains the clothing article.
- **Input Image 2 (Model):** Contains the person.
- **Task:** Place the product from Input Image 1 onto the person from Input Image 2. The fit must be perfect, tailored, and realistic, with accurate shadows and fabric draping.
        `;
    } else {
        const modelDescription = [
            `A ${options.ethnicity || 'Black African'}`,
            `${options.bodyArchetype || 'Slender'}`,
            `${options.model || 'professional female model'}`
        ].join(', ');

        actionAndSubject = `
**Action:** Generate a new image based on the input product image.
- **Input Image 1 (Product):** Contains the clothing article.
- **Task:** Generate a full-body image of a ${modelDescription} wearing the exact product from Input Image 1.
        `;
    }

    const sceneDescription = `
**Scene:** A professional photoshoot set against a ${options.background || 'Clean studio background'}.
**Lighting:** ${options.lighting || 'Bright studio lighting'}, creating a high-end commercial look.
    `;
    
    const fidelityMandate = `
**Fidelity Mandate (CRITICAL):**
- You MUST preserve the exact design, pattern, color, texture, and details of the clothing from the input image.
- You MUST preserve the exact cut, length, and style of the clothing. For example, if the input is a short dress, the output must be a short dress of the same length.
- **DO NOT alter the garment's design in any way.** Your task is to place it on a model, not redesign it.
    `;

    return [coreInstruction, actionAndSubject, sceneDescription, fidelityMandate].join('\n\n');
  }, [modelFile]);

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(null);
    setOriginalImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setIsProcessing(true);

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      setFile(selectedFile);
      setOriginalImage(dataUrl);
    } catch (err) {
      setError("Could not read the selected file. Please try another image.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };
  
  const handleModelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const selectedFile = event.target.files[0];
        setModelFile(selectedFile);
        setHasConsent(false); // Reset consent when new image is uploaded
        try {
            const dataUrl = await fileToDataUrl(selectedFile);
            setModelImagePreview(dataUrl);
        } catch (err) {
            setError("Could not read the model's photo.");
            console.error(err);
        }
    }
  };

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLElement>) => {
    const items = event.clipboardData.items;
    let imageFile: File | null = null;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (imageFile) {
      event.preventDefault();
      processFile(imageFile);
    }
  }, [processFile]);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please upload a product image first.");
      return;
    }
    if(modelFile && !hasConsent) {
      setError("You must confirm you have consent to use the model's photo.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productBase64 = await fileToBase64(file);
      let modelBase64: string | undefined;
      let modelMimeType: string | undefined;

      if(modelFile) {
        modelBase64 = await fileToBase64(modelFile);
        modelMimeType = modelFile.type;
      }
      
      const currentPrompt = imageEditorTemplate(selections);
      const resultBase64 = await editImageWithPrompt(productBase64, file.type, currentPrompt, modelBase64, modelMimeType);
      const resultUrl = `data:image/png;base64,${resultBase64}`;

      const newHistory = history.slice(0, historyIndex + 1);
      const updatedHistory = [...newHistory, resultUrl];
      
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        updatedHistory.shift();
      }

      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);

    } catch (e) {
      setError("Failed to generate image. This can sometimes happen with complex edits. Try simplifying your prompt or using a different background.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [file, modelFile, hasConsent, selections, history, historyIndex, imageEditorTemplate]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started...');
  };

  const handleCameraCapture = (capturedFile: File) => {
    processFile(capturedFile);
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

  const cameraButton = (
    <button
      onClick={() => setIsCameraOpen(true)}
      disabled={!isCameraSupported}
      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition duration-300 text-sm"
    >
      <CameraIcon />
      <span>Use Camera</span>
    </button>
  );

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">Step 1: The Photo Studio</h2>
        <p className="mt-2 text-gray-400">Upload your product photo to create a professional shoot.</p>
      </div>
      
      {/* Upload & Original Image */}
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-300">1. Your Product Photo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div 
            className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:border-amber-400 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*" />
            <label htmlFor="file-upload" className="cursor-pointer text-gray-400">
              <p>Drag & drop your image here</p>
              <p className="my-2">or</p>
              <span className="font-bold text-amber-400 hover:text-amber-500">Browse files</span>
              <p className="text-xs mt-2">You can also paste an image from your clipboard.</p>
            </label>
          </div>
          <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            {isProcessing && <Spinner />}
            {!isProcessing && originalImage && <img src={originalImage} alt="Original product" className="object-contain h-full w-full cursor-pointer" onClick={() => openModal(originalImage)} />}
            {!isProcessing && !originalImage && <p className="text-gray-500">Your photo will appear here</p>}
          </div>
        </div>
         <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">No photo? No problem.</p>
            <div title={!isCameraSupported ? "Your browser does not support camera access." : "Use Camera"}>
                {cameraButton}
            </div>
        </div>
      </div>
      
      {/* Optional: Upload Model's Photo */}
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300">2. Use Your Own Model (Optional)</h3>
          <p className="text-sm text-gray-400 -mt-2">Instead of an AI-generated model, you can provide a photo of a person to wear your product.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
             <div className="w-full">
                <input type="file" id="model-file-upload" className="hidden" onChange={handleModelFileChange} accept="image/*" />
                <label htmlFor="model-file-upload" className="cursor-pointer text-center block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                    Upload Model's Photo
                </label>
                <div className="mt-4">
                    <label htmlFor="model-consent" className="flex items-start gap-3 text-sm text-gray-400">
                        <input
                            type="checkbox"
                            id="model-consent"
                            checked={hasConsent}
                            onChange={(e) => setHasConsent(e.target.checked)}
                            disabled={!modelFile}
                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-800"
                        />
                        <span>I confirm I have the consent of the person in this photo to use their image for this purpose.</span>
                    </label>
                </div>
            </div>
            <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                {modelImagePreview ? (
                     <img src={modelImagePreview} alt="Model preview" className="object-contain h-full w-full cursor-pointer" onClick={() => openModal(modelImagePreview)} />
                ) : (
                    <p className="text-gray-500 p-4 text-center">Your model's photo will appear here</p>
                )}
            </div>
          </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-300">3. Your Vision</h3>
        <PromptAssistant
          prompt={prompt}
          setPrompt={setPrompt}
          optionCategories={imageEditorCategories}
          promptTemplate={imageEditorTemplate}
          disabledOptions={modelFile ? { model: "Using your uploaded model photo.", ethnicity: "Using your uploaded model photo.", bodyArchetype: "Using your uploaded model photo." } : {}}
          onSelectionsChange={setSelections}
        />
      </div>

      {/* Action Button */}
      <div className="space-y-4">
        {error ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : <><ArrowPathIcon /> Retry Generation</>}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Generate Photoshoot'}
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
                <li>When using your own model, you are responsible for obtaining their consent.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Photo */}
      {(isLoading || history.length > 0) && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-300">Generated Photo</h3>
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
                onClick={() => handleDownload(currentImage, 'jenga-biashara-product.png')}
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
              <img src={currentImage} alt="AI generated product" className="object-contain h-full w-full cursor-pointer" onClick={() => openModal(currentImage)} />
            )}
          </div>
        </div>
      )}
      
      <ImageModal isOpen={!!modalImageUrl} imageUrl={modalImageUrl} onClose={closeModal} />
      <CameraCapture isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
    </div>
  );
};

export default ImageEditor;
