import React, { useState, useCallback, useEffect } from 'react';
import { fileToBase64 } from '../services/utils';
import { generateVideoAd } from '../services/geminiService';
import Spinner from './Spinner';
import ImageModal from './ImageModal';
import { PhotoShootResult } from '../App';

interface VideoGeneratorProps {
  photoShootResult: PhotoShootResult | null;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ photoShootResult }) => {
  const [prompt, setPrompt] = useState<string>("A 5-second video of the model smiling and spinning in the featured product.");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  const loadingMessages = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Rendering your vision, frame by frame...",
    "This can take a few minutes, good things come to those who wait!",
    "Finalizing the cut, adding the polish..."
  ];
  
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setIsKeySelected(true);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    // Automatically use the image from the photo shoot as the starting point
    if (photoShootResult?.imageUrl) {
      setImagePreview(photoShootResult.imageUrl);
      // No need to convert to File object as we can use the base64 data URL directly
    }
  }, [photoShootResult]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 4000);

    try {
      let base64Image: string | undefined;
      let mimeType: string | undefined;

      if (file) { // User uploaded a new file
        base64Image = await fileToBase64(file);
        mimeType = file.type;
      } else if (imagePreview?.startsWith('data:')) { // Using the data URL from photo shoot
        const parts = imagePreview.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch && mimeMatch[1]) {
            mimeType = mimeMatch[1];
            base64Image = parts[1];
        }
      }

      const videoUrl = await generateVideoAd(prompt, base64Image, mimeType);
      setGeneratedVideo(videoUrl);
    } catch (e: any) {
        if (e.message?.includes("Requested entity was not found.")) {
            setError("API Key not found. Please select your key again.");
            setIsKeySelected(false);
        } else if (e.message?.includes("timed out")) {
            setError(e.message);
        }
        else {
            setError("Failed to generate video. Please try again.");
            console.error(e);
        }
    } finally {
      setIsLoading(false);
      clearInterval(interval);
      setLoadingMessage('');
    }
  }, [prompt, file, imagePreview, loadingMessages]);

  if (!isKeySelected) {
      return (
          <div className="text-center bg-gray-800/50 p-8 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-amber-400">API Key Required for Video Generation</h2>
              <p className="mt-4 text-gray-300">
                  Video generation with Veo is a powerful feature that requires you to select your own API key.
                  This ensures you are aware of potential billing.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                  For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">billing documentation</a>.
              </p>
              <button onClick={handleSelectKey} className="mt-6 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition duration-300">
                  Select API Key
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">Step 3: The Commercial</h2>
        <p className="mt-2 text-gray-400">Bring your product to life with a short, dynamic video ad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-gray-800/50 p-6 rounded-lg space-y-4 border border-gray-700">
          <div>
            <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300">Video Prompt</label>
            <textarea
              id="video-prompt"
              rows={4}
              className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-200"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="video-file-upload" className="block text-sm font-medium text-gray-300 mb-2">Start with an image</label>
            {imagePreview && (
                <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Using the image from your Photo Shoot. You can replace it below.</p>
                    <img src={imagePreview} alt="Preview" className="rounded-lg max-h-32 cursor-pointer" onClick={() => openModal(imagePreview)} />
                </div>
            )}
            <input id="video-file-upload" type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500"/>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Generate Video'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Video Display */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Generated Video</h3>
          <div className="aspect-w-16 aspect-h-9 w-full bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            {isLoading && <div className="text-center p-4"><Spinner /><p className="mt-4 text-gray-300">{loadingMessage}</p></div>}
            {!isLoading && generatedVideo && (
              <video src={generatedVideo} controls autoPlay loop className="w-full h-full" />
            )}
            {!isLoading && !generatedVideo && <p className="text-gray-500">Your video will appear here</p>}
          </div>
        </div>
      </div>
      <ImageModal isOpen={!!modalImageUrl} imageUrl={modalImageUrl} onClose={closeModal} />
    </div>
  );
};

export default VideoGenerator;