// src/components/MobileTemplate.jsx
import React from 'react';

const MobileTemplate = () => {
  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      {/* Mobile-first header - starts as stacked, becomes row on medium screens */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-0">Component Title</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Primary Action</button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Secondary</button>
        </div>
      </div>
      
      {/* Content area - single column on mobile, multi-column on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card items */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-lg mb-2">Item {item}</h2>
            <p className="text-gray-600">This is a responsive card that adapts to different screen sizes.</p>
          </div>
        ))}
      </div>
      
      {/* Mobile navigation - visible only on small screens */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around md:hidden">
        <button className="p-2">
          <span className="block w-6 h-6 bg-gray-400 rounded-full"></span>
        </button>
        <button className="p-2">
          <span className="block w-6 h-6 bg-gray-400 rounded-full"></span>
        </button>
        <button className="p-2">
          <span className="block w-6 h-6 bg-gray-400 rounded-full"></span>
        </button>
      </div>
    </div>
  );
};

export default MobileTemplate;
