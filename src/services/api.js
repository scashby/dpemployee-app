import { supabase } from '../supabase/supabaseClient';

// Employee services
export const fetchEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { data: null, error };
  }
};

export const createEmployee = async (employee) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding employee:', error);
    return { data: null, error };
  }
};

export const updateEmployee = async (id, employee) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { data: null, error };
  }
};

export const deleteEmployee = async (id) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { error };
  }
};

// Event services
export const fetchEvents = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { data: null, error };
  }
};

export const fetchAllEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all events:', error);
    return { data: null, error };
  }
};

export const createEvent = async (event) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding event:', error);
    return { data: null, error };
  }
};

export const updateEvent = async (id, event) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(event)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating event:', error);
    return { data: null, error };
  }
};

export const deleteEvent = async (id) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { error };
  }
};

// Event assignments
export const fetchEventAssignments = async () => {
  try {
    const { data, error } = await supabase
      .from('event_assignments')
      .select('*');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching event assignments:', error);
    return { data: null, error };
  }
};

export const createEventAssignment = async (assignment) => {
  try {
    const { data, error } = await supabase
      .from('event_assignments')
      .insert([assignment])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding event assignment:', error);
    return { data: null, error };
  }
};

export const deleteEventAssignment = async (eventId, employeeId) => {
  try {
    const { error } = await supabase
      .from('event_assignments')
      .delete()
      .eq('event_id', eventId)
      .eq('employee_id', employeeId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting event assignment:', error);
    return { error };
  }
};

// Schedule services
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

export const createShift = async (shift) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert([shift])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding shift:', error);
    return { data: null, error };
  }
};

export const updateShift = async (id, shift) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .update(shift)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating shift:', error);
    return { data: null, error };
  }
};

export const deleteShift = async (id) => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting shift:', error);
    return { error };
  }
};

export const deleteEmployeeShifts = async (employeeName, startDate, endDate) => {
  try {
    const { data } = await supabase
      .from('schedules')
      .select('id')
      .eq('employee_name', employeeName)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (data && data.length > 0) {
      const shiftIds = data.map(s => s.id);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .in('id', shiftIds);
      
      if (error) throw error;
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting employee shifts:', error);
    return { error };
  }
};

// Template services
export const fetchTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Parse template JSON if needed
    const parsedData = data.map(item => {
      if (typeof item.template === 'string') {
        try {
          item.template = JSON.parse(item.template);
        } catch (e) {
          console.error('Error parsing template:', e);
          item.template = {};
        }
      }
      return item;
    });
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return { data: null, error };
  }
};

export const createTemplate = async (template) => {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .insert([template])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding template:', error);
    return { data: null, error };
  }
};

export const updateTemplate = async (id, template) => {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .update(template)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating template:', error);
    return { data: null, error };
  }
};

export const deleteTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { error };
  }
};