
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 sm:px-6 md:px-8 bg-gray-900">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
          Jenga Biashara AI
        </h1>
        <p className="mt-2 text-lg sm:text-xl text-gray-300">
          Your Weaponized Media Studio for a Competitive Edge.
        </p>
      </div>
    </header>
  );
};

export default Header;