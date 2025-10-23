import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowPathIcon, CameraIcon } from './IconComponents';
import Spinner from './Spinner';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please check your browser permissions and try again.");
    } finally {
        setIsLoading(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);
  
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirmPhoto = async () => {
    if (capturedImage) {
      const blob = await fetch(capturedImage).then(res => res.blob());
      const file = new File([blob], "camera-shot.png", { type: "image/png" });
      onCapture(file);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative w-full h-full p-4 flex flex-col items-center justify-center"
        style={{ animation: 'scale-in 0.2s ease-out forwards' }}
      >
        <div className="w-full max-w-4xl max-h-[85vh] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
            {isLoading && <Spinner />}
            {error && <p className="text-red-400 p-4 text-center">{error}</p>}
            {!error && !capturedImage && (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            )}
            {capturedImage && (
              <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
            )}
        </div>
        
        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-8">
            {!capturedImage ? (
                <button
                    onClick={handleTakePhoto}
                    disabled={isLoading || !!error}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-400 disabled:opacity-50"
                    aria-label="Take Photo"
                >
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-900"></div>
                </button>
            ) : (
                <>
                    <button
                        onClick={startCamera}
                        className="flex items-center gap-2 bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                    >
                       <ArrowPathIcon /> Retake
                    </button>
                    <button
                        onClick={handleConfirmPhoto}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition duration-300"
                    >
                        Use this photo
                    </button>
                </>
            )}
        </div>
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Close camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;