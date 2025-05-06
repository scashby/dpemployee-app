// Gets Monday of the given week
export const getMonday = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
};

// Format date for display (M/D)
export const formatDateForDisplay = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// Format date for database (YYYY-MM-DD)
export const formatDateForDB = (date) => {
  return date.toISOString().split('T')[0];
};

// Get week date range (Monday to Sunday)
export const getWeekDateRange = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    start: startDate,
    end: endDate
  };
};

// Day name/code conversions
export const dayCodeMap = {
  'Monday': 'MON',
  'Tuesday': 'TUE',
  'Wednesday': 'WED',
  'Thursday': 'THU',
  'Friday': 'FRI',
  'Saturday': 'SAT',
  'Sunday': 'SUN'
};

export const dayCodeMapReverse = {
  'MON': 'Monday',
  'TUE': 'Tuesday',
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday',
  'SUN': 'Sunday'
};

export const getDayCode = (dayName) => {
  return dayCodeMap[dayName] || dayName;
};

export const getDayName = (dayCode) => {
  return dayCodeMapReverse[dayCode] || dayCode;
};

// Check if a date is within a given range
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
};

// Calculate the day of week index (0 = Monday, 6 = Sunday)
export const getDayOfWeekIndex = (date) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 ? 6 : day - 1; // Convert to 0 = Monday, 6 = Sunday
};

// Get date for a specific day of the week in relation to a week start date
export const getDateForDay = (weekStartDate, dayCode) => {
  const dayIndex = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].indexOf(dayCode);
  if (dayIndex === -1) return null;
  
  const date = new Date(weekStartDate);
  date.setDate(date.getDate() + dayIndex);
  return date;
};

// Format date in a friendly format (Month Day, Year)
export const formatFriendlyDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};