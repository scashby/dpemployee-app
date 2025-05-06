import { useState } from 'react';
import { getMonday } from '../utils/dateUtils';

/**
 * Hook for managing week navigation in schedule components
 * Provides functions for moving between weeks and getting dates
 * 
 * @param {Date} initialDate - Starting date (defaults to current date)
 * @returns {Object} Navigation state and functions
 */
export const useWeekNavigation = (initialDate = new Date()) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(initialDate));
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  // Navigate to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };
  
  // Get date for a specific day of the week
  const getDateForDay = (day) => {
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayIndex = dayNames.indexOf(day);
    if (dayIndex === -1) return null;
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };
  
  return {
    currentWeekStart,
    setCurrentWeekStart,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    getDateForDay
  };
};

export default useWeekNavigation;