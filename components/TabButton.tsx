import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon, disabled = false }) => {
  const baseClasses = "flex items-center gap-2 px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
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
      <span className="hidden sm:inline">{label}</span>
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