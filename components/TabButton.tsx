import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon, disabled = false }) => {
  const baseClasses = "flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-2 px-2 py-1 sm:py-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 w-[88px] sm:w-auto";
  const activeClasses = "bg-amber-500 text-gray-900 shadow-lg";
  const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (disabled) {
    return (
      <div title="Complete the Photo Studio step first">
        {button}
      </div>
    );
  }

  return button;
};

export default TabButton;