import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div 
      className="fixed bottom-24 sm:bottom-5 right-5 bg-green-600 text-white py-2 px-5 rounded-lg shadow-2xl z-50 text-sm font-semibold"
      style={{ animation: `fadeInOut ${duration / 1000}s ease-in-out` }}
    >
      {message}
      <style>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          10%, 90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
