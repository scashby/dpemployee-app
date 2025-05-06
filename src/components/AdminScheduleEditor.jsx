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
      
      // Fetch events for this week to show event-related shifts
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, time, off_prem')
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (eventsError) throw eventsError;
      
      // Fetch employee assignments for these events
      let eventAssignments = {};
      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(event => event.id);
        
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('event_assignments')
          .select('*')
          .in('event_id', eventIds);
          
        if (assignmentsError) throw assignmentsError;
        
        // Group assignments by event
        if (assignmentsData) {
          assignmentsData.forEach(assignment => {
            if (!eventAssignments[assignment.event_id]) {
              eventAssignments[assignment.event_id] = [];
            }
            eventAssignments[assignment.event_id].push(assignment.employee_id);
          });
        }
      }
      
      // Create a mapping of event details by date
      const eventsByDate = {};
      if (eventsData) {
        eventsData.forEach(event => {
          if (!eventsByDate[event.date]) {
            eventsByDate[event.date] = [];
          }
          eventsByDate[event.date].push({
            ...event,
            assignedEmployees: eventAssignments[event.id] || []
          });
        });
      }
      
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
            event_type: '',
            event_id: null
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
              event_id: item.event_id || null,
              id: item.id // Keep track of existing record ID
            };
          }
        });
      }
      
      // Fill in event assignments data
      // For each date in the week
      Object.keys(eventsByDate).forEach(dateStr => {
        // For each event on that date
        eventsByDate[dateStr].forEach(event => {
          // For each employee assigned to the event
          event.assignedEmployees.forEach(employeeId => {
            // If this employee is in our grid
            if (scheduleGrid[employeeId] && scheduleGrid[employeeId][dateStr]) {
              // If there's no existing schedule entry or it's an "Off" shift, set it based on the event
              const currentEntry = scheduleGrid[employeeId][dateStr];
              if (currentEntry.shift === 'Off' || !currentEntry.id) {
                scheduleGrid[employeeId][dateStr] = {
                  ...currentEntry,
                  shift: event.off_prem ? 'Offsite' : 'Tasting Room',
                  event_type: event.off_prem ? 'off-prem' : 'in-house',
                  event_id: event.id,
                  // Note: Leave id as is if there was one, otherwise it will be undefined
                  // indicating we need to create a new record
                };
              }
            }
          });
        });
      });
      
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
      const eventAssignmentsToManage = {};  // Track event assignments that need to be added/removed
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
            
            // If this was previously tied to an event, remove the assignment
            if (scheduleItem.event_id) {
              if (!eventAssignmentsToManage[scheduleItem.event_id]) {
                eventAssignmentsToManage[scheduleItem.event_id] = {
                  toAdd: [],
                  toRemove: []
                };
              }
              eventAssignmentsToManage[scheduleItem.event_id].toRemove.push(employeeId);
            }
            
            return;
          }
          
          // Prepare item for upsert
          scheduleItems.push({
            id: scheduleItem.id, // Will be undefined for new records
            employee_id: employeeId,
            date: date,
            shift: scheduleItem.shift,
            event_type: scheduleItem.event_type,
            event_id: scheduleItem.event_id
          });
          
          // If this is tied to an event, track the assignment
          if (scheduleItem.event_id) {
            if (!eventAssignmentsToManage[scheduleItem.event_id]) {
              eventAssignmentsToManage[scheduleItem.event_id] = {
                toAdd: [],
                toRemove: []
              };
            }
            
            // Add this employee to the event if not already assigned
            eventAssignmentsToManage[scheduleItem.event_id].toAdd.push(employeeId);
          }
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
      
      // Now handle event assignments
      for (const eventId in eventAssignmentsToManage) {
        const { toAdd, toRemove } = eventAssignmentsToManage[eventId];
        
        // Get existing assignments for this event
        const { data: existingAssignments, error: fetchError } = await supabase
          .from('event_assignments')
          .select('employee_id')
          .eq('event_id', eventId);
        
        if (fetchError) throw fetchError;
        
        // Find employees that need to be added
        // Filter out any that already exist in the assignments
        const existingEmployeeIds = existingAssignments.map(a => a.employee_id);
        const employeesToAdd = [...new Set(toAdd)].filter(id => !existingEmployeeIds.includes(id));
        
        // Add new assignments
        if (employeesToAdd.length > 0) {
          const assignmentsToAdd = employeesToAdd.map(empId => ({
            event_id: eventId,
            employee_id: empId
          }));
          
          const { error: insertError } = await supabase
            .from('event_assignments')
            .insert(assignmentsToAdd);
          
          if (insertError) throw insertError;
        }
        
        // Remove assignments
        if (toRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('event_assignments')
            .delete()
            .eq('event_id', eventId)
            .in('employee_id', [...new Set(toRemove)]);
          
          if (deleteError) throw deleteError;
        }
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
    return <div className="admin-section">Loading schedule data...</div>;
  }
  
  // Get dates for the current week
  const weekDates = getWeekDates();
  
  return (
    <div className="admin-section">
      <h2 className="admin-title">Schedule Editor</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}
      
      <div className="week-nav">
        <div className="week-controls">
          <button
            onClick={goToPreviousWeek}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          <h3 className="week-dates">
            {formatDateForDisplay(weekDates[0])} to {formatDateForDisplay(weekDates[6])}
          </h3>
          <button
            onClick={goToNextWeek}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
        
        <div className="template-controls">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="form-select"
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
            className="btn btn-primary"
            disabled={!selectedTemplate}
          >
            Apply Template
          </button>
        </div>
      </div>
      
      <div className="schedule-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee</th>
              {weekDates.map((date, index) => (
                <th key={index} style={{textAlign: 'center'}}>
                  {formatDateForDisplay(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td className="employee-name">{employee.name}</td>
                {weekDates.map((date, index) => {
                  const dateStr = formatDateForDB(date);
                  const cellData = schedule[employee.id]?.[dateStr] || { shift: 'Off', event_type: '' };
                  
                  // Check if this cell is associated with an event
                  const isEventCell = cellData.event_id !== null && cellData.event_id !== undefined;
                  
                  return (
                    <td key={index} className={isEventCell ? 'event-cell' : ''}>
                      <div className="shift-editor">
                        {isEventCell && (
                          <div className="event-indicator">
                            Event Assignment
                          </div>
                        )}
                        
                        <select
                          value={cellData.shift || 'Off'}
                          onChange={(e) => handleShiftChange(employee.id, dateStr, 'shift', e.target.value)}
                          className={`table-input ${isEventCell ? 'event-border' : ''}`}
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
                            className={`table-input ${isEventCell ? 'event-border' : ''}`}
                          >
                            <option value="">Select Event Type</option>
                            <option value="in-house">In-House</option>
                            <option value="off-prem">Off-Premise</option>
                          </select>
                        )}
                        
                        {isEventCell && (
                          <div className="event-note">
                            Updates event assignments
                          </div>
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
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;