import { supabase } from '../supabase/supabaseClient';
import { formatDateForDB } from '../utils/dateUtils';

/**
 * Service for handling schedule-related operations
 * Contains functions for CRUD operations on shifts and templates
 */

// Fetch schedule for a specific week
export const fetchScheduleForWeek = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return { data: null, error };
  }
};

// Save or update a shift
export const saveShift = async (shiftData, id = null) => {
  try {
    // Check if this is an event shift
    if (shiftData.event_id) {
      return { 
        data: null, 
        message: 'Event assignments are managed in the Events page',
        error: null
      };
    }
    
    let result;
    
    // Regular shift - update or create
    if (id && !id.toString().startsWith('event_')) {
      // Update existing shift
      const { data, error } = await supabase
        .from('schedules')
        .update(shiftData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      result = data;
      return { data: result, message: 'Shift updated successfully', error: null };
    } else {
      // Add new shift
      const { data, error } = await supabase
        .from('schedules')
        .insert([shiftData])
        .select();
      
      if (error) throw error;
      result = data;
      return { data: result, message: 'Shift added successfully', error: null };
    }
  } catch (error) {
    console.error('Error saving shift:', error);
    return { data: null, message: null, error };
  }
};

// Delete a shift
export const deleteShift = async (shiftId) => {
  try {
    // Check if this is an event shift
    if (shiftId.toString().startsWith('event_')) {
      return { 
        error: { message: 'Event shifts can only be modified in the Events page' }
      };
    }
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', shiftId);
    
    if (error) throw error;
    return { error: null, message: 'Shift deleted successfully' };
  } catch (error) {
    console.error('Error deleting shift:', error);
    return { error };
  }
};

// Remove all shifts for an employee in a specific week
export const removeEmployeeFromSchedule = async (employeeName, startDate, endDate) => {
  try {
    // Get all shifts for this employee in the week
    const { data, error: fetchError } = await supabase
      .from('schedules')
      .select('id')
      .eq('employee_name', employeeName)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (fetchError) throw fetchError;
    
    // Delete all shifts for this employee
    if (data && data.length > 0) {
      const shiftIds = data.map(s => s.id);
      
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .in('id', shiftIds);
      
      if (deleteError) throw deleteError;
    }
    
    return { error: null, message: `${employeeName} removed from schedule` };
  } catch (error) {
    console.error('Error removing employee from schedule:', error);
    return { error };
  }
};

// Initialize an empty schedule structure
export const initializeScheduleStructure = (employees, dayNames) => {
  const scheduleByEmployee = {};
  
  employees.forEach(emp => {
    scheduleByEmployee[emp.name] = {};
    dayNames.forEach(day => {
      scheduleByEmployee[emp.name][day] = [];
    });
  });
  
  return scheduleByEmployee;
};

// Process shifts into schedule structure
export const processShifts = (shifts, scheduleByEmployee, scheduledEmployees = new Set()) => {
  shifts.forEach(shift => {
    const empName = shift.employee_name;
    const day = shift.day;
    
    // Find matching employee
    for (const name of Object.keys(scheduleByEmployee)) {
      if (name === empName || name.includes(empName) || empName.includes(name)) {
        scheduleByEmployee[name][day].push(shift);
        scheduledEmployees.add(name);
        break;
      }
    }
  });
  console.log("Result from processShifts:", result);
  return { scheduleByEmployee, scheduledEmployees };
};

// Process events into schedule structure
export const processEvents = (events, employees, scheduleByEmployee, scheduledEmployees = new Set()) => {
  events.forEach(event => {
    if (!event.assignments) return;
    
    const eventDate = new Date(event.date);
    // Create a mapping that correctly aligns JS day index (0=Sunday) with our dayNames array (starts with Monday)
    const dayMapping = {
      0: 'SUN', // Sunday (JS index 0) → SUN (last in our array)
      1: 'MON', // Monday (JS index 1) → MON (first in our array)
      2: 'TUE',
      3: 'WED',
      4: 'THU',
      5: 'FRI',
      6: 'SAT'
    };
    const dayOfWeek = dayMapping[eventDate.getDay()];    
    event.assignments.forEach(assignment => {
      const employee = employees.find(emp => emp.id === assignment.employee_id);
      if (!employee || !scheduleByEmployee[employee.name]) return;
      
      scheduleByEmployee[employee.name][dayOfWeek].push({
        id: `event_${event.id}_${assignment.employee_id}`,
        employee_name: employee.name,
        day: dayOfWeek,
        date: event.date,
        shift: event.time || 'Event Time TBD',
        event_name: event.title,
        event_id: event.id,
        event_info: event.info
      });
      
      scheduledEmployees.add(employee.name);
    });
  });
  
  return { scheduleByEmployee, scheduledEmployees };
};