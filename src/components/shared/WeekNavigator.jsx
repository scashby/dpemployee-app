import React from 'react';
import { formatDateForDisplay } from '../../utils/dateUtils';

/**
 * A reusable component for navigating between weeks
 * 
 * @param {Date} currentWeekStart - Start date of the current week
 * @param {function} onPreviousWeek - Function to navigate to previous week
 * @param {function} onNextWeek - Function to navigate to next week
 * @param {function} onCurrentWeek - Function to navigate to current week
 * @param {string} className - Additional CSS classes
 */
const WeekNavigator = ({
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek = null,
  className = ''
}) => {
  // Calculate end date of the current week (Sunday)
  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(currentWeekStart.getDate() + 6);
  
  // Format date range for display
  const displayRange = `${formatDateForDisplay(currentWeekStart)} - ${formatDateForDisplay(weekEndDate)}`;
  
  // Check if current week is the current calendar week
  const isCurrentWeek = () => {
    const today = new Date();
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    return currentMonday.toDateString() === currentWeekStart.toDateString();
  };
  
  return (
    <div className={`flex items-center mb-4 ${className}`}>
      <button 
        onClick={onPreviousWeek}
        className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        aria-label="Previous week"
      >
        ←Previous
      </button>
      
      <span className="mx-4 text-lg font-medium">{displayRange}</span>
      
      <button 
        onClick={onNextWeek}
        className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        aria-label="Next week"
      >
        Next→
      </button>
      
      {onCurrentWeek && !isCurrentWeek() && (
        <button
          onClick={onCurrentWeek}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100 ml-4"
          aria-label="Current week"
        >
          Current Week
        </button>
      )}
    </div>
  );
};

export default WeekNavigator;