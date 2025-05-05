import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminScheduleEditor = () => {
  const [schedule, setSchedule] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Shift types - simplified for this implementation
  const shiftTypes = ['Tasting Room', 'Offsite', 'Packaging', 'Off'];
  
  // Gets Monday of the current week
  function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }
  
  // Format date to YYYY-MM-DD for database
  function formatDateForDB(date) {
    return date.toISOString().split('T')[0];
  }
  
  // Get date for display (Mon DD)
  function formatDateForDisplay(date) {
    const options = { weekday: 'short', month: 'numeric', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Get dates for the current week
  function getWeekDates() {
    const dates = [];
    const currentDate = new Date(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }
  
  // Previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  // Next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  // Initial data loading
  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    fetchSchedule();
  }, [currentWeekStart]);
  
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('id, name, template');
      
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
      
      setTemplates(parsedData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      
      // Get dates for the week
      const weekDates = getWeekDates();
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);
      
      // Fetch existing schedule for the week
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Initialize an empty schedule grid
      const scheduleGrid = {};
      
      // Initialize for each employee
      employees.forEach(employee => {
        scheduleGrid[employee.id] = {};
        
        // Initialize each day of the week
        weekDates.forEach(date => {
          const dateStr = formatDateForDB(date);
          scheduleGrid[employee.id][dateStr] = {
            shift: 'Off',
            event_type: ''
          };
        });
      });
      
      // Fill in existing schedule data
      if (data) {
        data.forEach(item => {
          if (scheduleGrid[item.employee_id] && scheduleGrid[item.employee_id][item.date]) {
            scheduleGrid[item.employee_id][item.date] = {
              shift: item.shift || 'Off',
              event_type: item.event_type || '',
              id: item.id // Keep track of existing record ID
            };
          }
        });
      }
      
      setSchedule(scheduleGrid);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShiftChange = (employeeId, date, field, value) => {
    setSchedule(prevSchedule => {
      const updatedSchedule = { ...prevSchedule };
      updatedSchedule[employeeId] = { ...updatedSchedule[employeeId] };
      updatedSchedule[employeeId][date] = { 
        ...updatedSchedule[employeeId][date],
        [field]: value 
      };
      return updatedSchedule;
    });
  };
  
  const saveScheduleChanges = async () => {
    try {
      setLoading(true);
      
      // Collect all schedule items to update/insert
      const scheduleItems = [];
      const weekDates = getWeekDates().map(date => formatDateForDB(date));
      
      // Process each employee's schedule for the week
      Object.keys(schedule).forEach(employeeId => {
        weekDates.forEach(date => {
          const scheduleItem = schedule[employeeId][date];
          
          // Skip if there's nothing to schedule (Off shift with no event type)
          if (scheduleItem.shift === 'Off' && !scheduleItem.event_type) {
            // If there's an existing record, mark it for deletion
            if (scheduleItem.id) {
              scheduleItems.push({
                id: scheduleItem.id,
                toDelete: true
              });
            }
            return;
          }
          
          // Prepare item for upsert
          scheduleItems.push({
            id: scheduleItem.id, // Will be undefined for new records
            employee_id: employeeId,
            date: date,
            shift: scheduleItem.shift,
            event_type: scheduleItem.event_type
          });
        });
      });
      
      // Separate items to delete
      const itemsToDelete = scheduleItems
        .filter(item => item.toDelete)
        .map(item => item.id);
      
      // Items to insert/update
      const itemsToUpsert = scheduleItems.filter(item => !item.toDelete);
      
      // Delete items marked for deletion
      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .in('id', itemsToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // Upsert (update or insert) remaining items
      if (itemsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('schedules')
          .upsert(itemsToUpsert);
        
        if (upsertError) throw upsertError;
      }
      
      setSuccessMessage('Schedule saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the schedule to get the latest data
      await fetchSchedule();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const applyTemplate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template to apply');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      // Find the selected template
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create a deep copy of the current schedule
      const updatedSchedule = JSON.parse(JSON.stringify(schedule));
      
      // Get dates for the current week
      const weekDates = getWeekDates();
      
      // Map days of the week to dates
      const dayToDateMap = {};
      weekDates.forEach((date, index) => {
        dayToDateMap[daysOfWeek[index]] = formatDateForDB(date);
      });
      
      // Apply template to the schedule
      daysOfWeek.forEach(day => {
        const date = dayToDateMap[day];
        const shifts = template.template[day] || [];
        
        // Apply shifts from the template
        shifts.forEach(shiftItem => {
          const { employeeId, shift } = shiftItem;
          if (updatedSchedule[employeeId] && updatedSchedule[employeeId][date]) {
            updatedSchedule[employeeId][date].shift = shift;
            
            // Get a basic event type based on the shift (simplified example)
            let eventType = '';
            if (shift === 'Tasting Room') {
              eventType = 'in-house';
            } else if (shift === 'Offsite') {
              eventType = 'off-prem';
            }
            
            updatedSchedule[employeeId][date].event_type = eventType;
          }
        });
      });
      
      setSchedule(updatedSchedule);
      setSuccessMessage('Template applied! Remember to save your changes.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error applying template:', error);
      setError('Failed to apply template. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  // Get dates for the current week
  const weekDates = getWeekDates();
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Schedule Editor</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousWeek}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
          >
            ← Previous
          </button>
          <h3 className="text-lg font-semibold">
            {formatDateForDisplay(weekDates[0])} to {formatDateForDisplay(weekDates[6])}
          </h3>
          <button
            onClick={goToNextWeek}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
          >
            Next →
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={applyTemplate}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={!selectedTemplate}
          >
            Apply Template
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white rounded border shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border text-left font-medium">Employee</th>
              {weekDates.map((date, index) => (
                <th key={index} className="py-2 px-4 border text-center font-medium">
                  {formatDateForDisplay(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td className="py-2 px-4 border font-medium">{employee.name}</td>
                {weekDates.map((date, index) => {
                  const dateStr = formatDateForDB(date);
                  const cellData = schedule[employee.id]?.[dateStr] || { shift: 'Off', event_type: '' };
                  
                  return (
                    <td key={index} className="py-2 px-4 border">
                      <div className="flex flex-col space-y-2">
                        <select
                          value={cellData.shift || 'Off'}
                          onChange={(e) => handleShiftChange(employee.id, dateStr, 'shift', e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="Off">Off</option>
                          {shiftTypes.filter(s => s !== 'Off').map(shift => (
                            <option key={shift} value={shift}>
                              {shift}
                            </option>
                          ))}
                        </select>
                        
                        {cellData.shift !== 'Off' && (
                          <select
                            value={cellData.event_type || ''}
                            onChange={(e) => handleShiftChange(employee.id, dateStr, 'event_type', e.target.value)}
                            className="w-full p-1 border rounded"
                          >
                            <option value="">Select Event Type</option>
                            <option value="in-house">In-House</option>
                            <option value="off-prem">Off-Premise</option>
                          </select>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <button
          onClick={saveScheduleChanges}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;