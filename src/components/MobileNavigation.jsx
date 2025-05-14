import React from 'react';

const MobileNavigation = ({ onNavigate, currentView }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dpblue text-dpoffwhite shadow-lg z-50">
      <div className="flex justify-around items-center h-14">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full p-1 ${
            currentView === 'dashboard' ? 'text-dpgold' : 'text-dpoffwhite'
          }`}
        >
          <svg className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Home</span>
        </button>
        
        <button 
          onClick={() => onNavigate('schedule')}
          className={`flex flex-col items-center justify-center w-full h-full p-1 ${
            currentView === 'schedule' ? 'text-dpgold' : 'text-dpoffwhite'
          }`}
        >
          <svg className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Schedule</span>
        </button>
        
        <button 
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center justify-center w-full h-full p-1 ${
            currentView === 'admin' ? 'text-dpgold' : 'text-dpoffwhite'
          }`}
        >
          <svg className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs">Admin</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation;