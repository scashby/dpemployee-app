/**
 * Utility functions for handling shifts and schedules
 */

// Helper to get CSS class for different shift types
export const getShiftClass = (eventType) => {
  switch (eventType) {
    case 'tasting':
      return 'bg-emerald-500 text-white';
    case 'offsite':
      return 'bg-blue-500 text-white';
    case 'packaging':
      return 'bg-gray-500 text-white';
    case 'event':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-300';
  }
};

// Format a shift for display
export const formatShiftDisplay = (shift) => {
  if (shift.event_name) {
    return {
      title: shift.event_name,
      subtitle: shift.shift || 'Time TBD'
    };
  }
  
  const typeDisplay = {
    'tasting': 'Tasting Room',
    'offsite': 'Offsite',
    'packaging': 'Packaging',
    'event': 'Event'
  };
  
  return {
    title: typeDisplay[shift.event_type] || shift.event_type,
    subtitle: shift.shift
  };
};

// Parse a template to shifts
export const templateToShifts = (template, weekStartDate, employees) => {
  const shifts = [];
  const dayMap = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };
  
  // Process each day in the template
  Object.entries(template).forEach(([day, dayShifts]) => {
    // Calculate the date for this day in the current week
    const dayIndex = dayMap[day];
    if (dayIndex === undefined) return;
    
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const formattedDate = dayDate.toISOString().split('T')[0];
    const dayCode = day.substring(0, 3).toUpperCase();
    
    // Process each shift assignment
    dayShifts.forEach(assignment => {
      // Find the employee by ID
      const employee = employees.find(emp => emp.id === assignment.employeeId);
      if (!employee) return;
      
      // Create a new shift record
      shifts.push({
        employee_name: employee.name,
        day: dayCode,
        date: formattedDate,
        shift: '11-Close', // Default shift time
        event_type: assignment.shift.toLowerCase(), // Use the shift type from template
        event_name: null
      });
    });
  });
  
  return shifts;
};

// Group shifts by employee
export const groupShiftsByEmployee = (shifts, employees) => {
  const scheduleByEmployee = {};
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Initialize the structure
  employees.forEach(emp => {
    scheduleByEmployee[emp.name] = {};
    
    // Initialize days
    days.forEach(day => {
      scheduleByEmployee[emp.name][day] = [];
    });
  });
  
  // Fill in shifts
  shifts.forEach(shift => {
    const empName = shift.employee_name;
    const day = shift.day;
    
    // Find matching employee (exact match or partial match)
    let matchedEmployee = null;
    
    // Try exact match first
    if (scheduleByEmployee[empName]) {
      matchedEmployee = empName;
    } else {
      // Try to find close match if no exact match
      for (const name of Object.keys(scheduleByEmployee)) {
        if (name.includes(empName) || empName.includes(name)) {
          matchedEmployee = name;
          break;
        }
      }
    }
    
    // If we found a match, add the shift
    if (matchedEmployee && scheduleByEmployee[matchedEmployee][day]) {
      scheduleByEmployee[matchedEmployee][day].push(shift);
    }
  });
  
  return scheduleByEmployee;
};

// Check if an employee is scheduled on a specific day
export const isEmployeeScheduled = (scheduleData, employeeName, day) => {
  return (
    scheduleData[employeeName] && 
    scheduleData[employeeName][day] && 
    scheduleData[employeeName][day].length > 0
  );
};

// Check if a shift is an event
export const isEventShift = (shift) => {
  return Boolean(shift.event_id) || shift.event_type === 'event' || Boolean(shift.event_name);
};