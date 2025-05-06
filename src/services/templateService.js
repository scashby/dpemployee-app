import { supabase } from '../supabase/supabaseClient';
import { formatDateForDB } from '../utils/dateUtils';

/**
 * Service for handling template-related operations
 * Contains functions for CRUD operations on templates
 */

// Fetch all templates
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

// Apply a template to the current week
export const applyTemplateToSchedule = async (template, weekStartDate, employees) => {
  try {
    const dayMap = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };
    
    const shiftsToAdd = [];
    
    // Process each day in template
    for (const [day, shifts] of Object.entries(template.template)) {
      const dayIndex = dayMap[day];
      if (dayIndex === undefined) continue;
      
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(dayDate.getDate() + dayIndex);
      const formattedDate = formatDateForDB(dayDate);
      const dayCode = day.substring(0, 3).toUpperCase();
      
      // Process shifts
      for (const assignment of shifts) {
        const employee = employees.find(emp => emp.id === assignment.employeeId);
        if (!employee) continue;
        
        shiftsToAdd.push({
          employee_name: employee.name,
          day: dayCode,
          date: formattedDate,
          shift: '11-Close'
        });
      }
    }
    
    // Batch insert all shifts
    if (shiftsToAdd.length > 0) {
      const { error } = await supabase.from('schedules').insert(shiftsToAdd);
      if (error) throw error;
      
      return { 
        success: true, 
        message: `Applied template "${template.name}"`,
        shiftsAdded: shiftsToAdd.length,
        error: null
      };
    } else {
      throw new Error('No shifts to add from this template');
    }
  } catch (error) {
    console.error('Error applying template:', error);
    return { success: false, message: null, shiftsAdded: 0, error };
  }
};

// Convert current schedule to template format
export const convertScheduleToTemplate = (scheduleData, employees) => {
  const templateData = {};
  const dayCodeToName = {
    'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 
    'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
  };
  
  // Convert schedule to template format
  Object.entries(scheduleData).forEach(([employeeName, days]) => {
    const employee = employees.find(emp => emp.name === employeeName);
    if (!employee) return;
    
    Object.entries(days).forEach(([dayCode, shifts]) => {
      const dayName = dayCodeToName[dayCode];
      if (!dayName) return;
      
      if (!templateData[dayName]) templateData[dayName] = [];
      
      shifts.forEach(shift => {
        // Skip event shifts
        if (shift.event_id || shift.id?.toString().startsWith('event_')) return;
        
        templateData[dayName].push({
          employeeId: employee.id,
          shift: 'Tasting Room'
        });
      });
    });
  });
  if (Object.keys(templateData).length === 0) {
    // No valid template data created - add default structure
    templateData = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
      'Sunday': []
    };
  }
  return templateData;
};

// Save schedule as a new template
export const saveAsNewTemplate = async (templateData, templateName) => {
  try {
    console.log('Saving template:', {
      name: templateName,
      date: null,
      template: templateData
    });
    const { data, error } = await supabase
      .from('holidays')
      .insert([{
        name: templateName,
        date: null, // No date for regular templates
        template: JSON.stringify(templateData)
      }])
      .select();
    
    if (error) throw error;
    return { 
      success: true, 
      message: `Created template "${templateName}"`,
      data,
      error: null
    };
  } catch (error) {
    console.error('Error creating template:', error);
    return { success: false, message: null, data: null, error };
  }
};

// Update an existing template
export const updateExistingTemplate = async (templateData, templateId) => {
  try {
    const { data: existingTemplate } = await supabase
      .from('holidays')
      .select('name')
      .eq('id', templateId)
      .single();
    
    if (!existingTemplate) {
      throw new Error('Template not found');
    }
    
    const { error } = await supabase
      .from('holidays')
      .update({
        template: JSON.stringify(templateData)
      })
      .eq('id', templateId);
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: `Updated template "${existingTemplate.name}"`,
      error: null
    };
  } catch (error) {
    console.error('Error updating template:', error);
    return { success: false, message: null, error };
  }
};