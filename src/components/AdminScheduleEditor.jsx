import React, { useState, useEffect } from 'react'; 
import { supabase } from '../supabase/supabaseClient';
import { getWeekDateRange, formatDateForDB } from '../utils/dateUtils';
import useWeekNavigation from '../hooks/useWeekNavigation';
import useMessages from '../hooks/useMessages';
import useModalState from '../hooks/useModalState';
import * as scheduleService from '../services/scheduleService'; // declared but never read
import * as templateService from '../services/templateService'; // declared but never read
import StatusMessage from './shared/StatusMessage';
import WeekNavigator from './shared/WeekNavigator';
import ScheduleTable from './shared/ScheduleTable';
import AdminModal from './shared/AdminModal'; 
import FormInput from './shared/FormInput'; 
import FormSelect from './shared/FormSelect'; 
import SaveAsTemplateModal from './shared/SaveAsTemplateModal'; 
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  // Use custom hooks for core functionality
  const { 
    currentWeekStart, 
    goToPreviousWeek,
    goToNextWeek, 
    goToCurrentWeek,
    getDateForDay
  } = useWeekNavigation();
  
  const { 
    error, 
    successMessage, 
    showError, 
    showSuccess,
    clearMessages 
  } = useMessages();
  
  const {
    modalData,
    templateData, 
    showShiftModal, 
    showAddEmployeeModal, 
    showTemplateModal, 
    showSaveAsTemplateModal, 
    selectedTemplate, 
    openAddShiftModal,
    openEditShiftModal,
    closeShiftModal, 
    openAddEmployeeModal, // declared but never read
    closeAddEmployeeModal, 
    openTemplateModal, // declared but never read
    closeTemplateModal, 
    setSelectedTemplate, 
    openSaveAsTemplateModal, // declared but never read
    closeSaveAsTemplateModal, 
    handleShiftInputChange, // declared but never read
    handleTemplateInputChange 
  } = useModalState();

  // Local state
  const [scheduleData, setScheduleData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]); 
  const [templates, setTemplates] = useState([]); 
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Day headers - starting with Monday
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Fetch schedule when week changes
  useEffect(() => {
    if (employees.length > 0) {
      loadScheduleData();
    }
  }, [currentWeekStart, employees]);
  
  // Load all initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchTemplates(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
      setAvailableEmployees(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      showError('Failed to load employees');
      return [];
    }
  };
  
  // Fetch templates data
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*');
      
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
      showError('Failed to load templates. Please try again.');
    }
  };
  
  // Fetch events data
  const fetchEvents = async () => {
    try {
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      const [eventsResponse, assignmentsResponse] = await Promise.all([
        supabase.from('events')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date'),
        supabase.from('event_assignments').select('*')
      ]);
      
      if (eventsResponse.error) throw eventsResponse.error;
      if (assignmentsResponse.error) throw assignmentsResponse.error;
      
      const eventsWithAssignments = eventsResponse.data?.map(event => ({
        ...event,
        assignments: assignmentsResponse.data?.filter(a => a.event_id === event.id) || []
      })) || [];
      
      setEvents(eventsWithAssignments);
      return eventsWithAssignments;
    } catch (error) {
      console.error('Error fetching events:', error);
      showError('Failed to load events');
      return [];
    }
  };
  
  // Update the loadScheduleData function to properly preserve manually added employees
  // Update the loadScheduleData function
  // Modify the loadScheduleData function
  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      // Fetch schedule data from database
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Track which employees have shifts in THIS week only
      const employeesWithShifts = new Set();
      
      // Process regular shifts to identify employees with shifts this week
      if (data && data.length > 0) {
        data.forEach(shift => {
          const empName = shift.employee_name;
          employeesWithShifts.add(empName);
        });
      }
      
      // Process events to identify employees with event shifts this week
      if (events && events.length > 0) {
        events.forEach(event => {
          if (!event.assignments) return;
          
          event.assignments.forEach(assignment => {
            const employee = employees.find(emp => emp.id === assignment.employee_id);
            if (employee) {
              employeesWithShifts.add(employee.name);
            }
          });
        });
      }
      
      // Initialize schedule structure ONLY for employees with shifts THIS week
      const scheduleByEmployee = {};
      
      // Only include employees that have shifts in this week's date range
      [...employeesWithShifts].forEach(empName => {
        const matchingEmployee = employees.find(emp => 
          emp.name === empName || emp.name.includes(empName) || empName.includes(emp.name)
        );
        
        if (matchingEmployee) {
          scheduleByEmployee[matchingEmployee.name] = {};
          dayNames.forEach(day => {
            scheduleByEmployee[matchingEmployee.name][day] = [];
          });
        }
      });
      
      // Now process shifts for these employees
      if (data && data.length > 0) {
        data.forEach(shift => {
          const empName = shift.employee_name;
          const day = shift.day;
          
          // Find matching employee
          for (const name of Object.keys(scheduleByEmployee)) {
            if (name === empName || name.includes(empName) || empName.includes(name)) {
              scheduleByEmployee[name][day].push(shift);
              break;
            }
          }
        });
      }
      
      // Process events for these employees
      if (events && events.length > 0) {
        events.forEach(event => {
          if (!event.assignments) return;
          
          const eventDate = new Date(event.date);
          const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][eventDate.getDay()];
          
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
              event_info: event.info,
              event_type: event.off_prem ? 'offsite' : 'event'
            });
          });
        });
      }
      
      setScheduleData(scheduleByEmployee);
      updateAvailableEmployees(employeesWithShifts);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      showError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update available employees list
  const updateAvailableEmployees = (scheduledEmployees) => {
    const remainingEmployees = employees.filter(emp => !scheduledEmployees.has(emp.name));
    setAvailableEmployees(remainingEmployees);
  };
  
  // Handle saving a shift
  const saveShift = async () => { 
    try {
      setLoading(true);
      
      // Check if this is an event shift
      if (modalData.event_id) {
        showSuccess('Event assignments are managed in the Events page');
        closeShiftModal();
        return;
      }
      
      // Ensure date is valid
      let shiftDate = modalData.date;
      if (!shiftDate || shiftDate === '') {
        const dayDate = getDateForDay(modalData.day);
        if (dayDate) {
          shiftDate = formatDateForDB(dayDate);
        } else {
          throw new Error('Invalid day selected');
        }
      }
      
      const shiftData = {
        employee_name: modalData.employeeName,
        day: modalData.day,
        date: shiftDate,
        shift: modalData.shift,
        week_start: formatDateForDB(currentWeekStart),
        event_type: 'tasting',  // Add this to specify the type for styling
        event_name: 'Tasting Room' // Add this for the title display
      };
      
      // Update or create shift
      if (modalData.id && !modalData.id.toString().startsWith('event_')) {
        const { error } = await supabase
          .from('schedules')
          .update(shiftData)
          .eq('id', modalData.id);
          
        if (error) throw error;
        showSuccess('Shift updated successfully');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([shiftData]);
          
        if (error) throw error;
        showSuccess('Shift added successfully');
      }
      
      closeShiftModal();
      loadScheduleData();
    } catch (error) {
      console.error('Error saving shift:', error);
      showError(`Failed to save shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Get date for a specific day
  // Removed getDateForDay function already provided by useWeekNavigation
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  const deleteShift = async (id) => {
    try {
      // Use scheduleService instead of direct supabase calls
      const result = await scheduleService.deleteShift(id);
      
      if (result.error) {
        throw result.error;
      }
      
      showSuccess(result.message || 'Shift deleted successfully');
      loadScheduleData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      showError('Failed to delete shift.');
    }
  };
  
  const removeEmployee = async (employeeName) => {
    try {
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      const { data } = await supabase
        .from('schedules')
        .select('id')
        .eq('employee_name', employeeName)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (data && data.length > 0) {
        const shiftIds = data.map(s => s.id);
        await supabase.from('schedules').delete().in('id', shiftIds);
      }
      
      // Update local state by creating a new object without the removed employee
      const updatedScheduleData = { ...scheduleData };
      delete updatedScheduleData[employeeName];
      setScheduleData(updatedScheduleData);
      
      // Add to available employees list
      const employee = employees.find(emp => emp.name === employeeName);
      if (employee) {
        setAvailableEmployees([...availableEmployees, employee]);
      }
      
      showSuccess(`${employeeName} removed from schedule`);
    } catch (error) {
      console.error('Error removing employee:', error);
      showError('Failed to remove employee from schedule.');
    }
  };
  // Helper to save employee shift to database
  const saveEmployeeShift = async (employeeName, day, date, shiftTime) => {
    try {
      const shiftData = {
        employee_name: employeeName,
        day: day,
        date: date,
        shift: shiftTime,
        week_start: formatDateForDB(currentWeekStart),
        event_type: 'tasting',
        event_name: 'Tasting Room'
      };
      
      const { error } = await supabase
        .from('schedules')
        .insert([shiftData]);
        
      if (error) throw error;
      
      // Reload schedule data to reflect the new shift
      loadScheduleData();
    } catch (error) {
      console.error('Error saving shift:', error);
      showError(`Failed to save shift: ${error.message}`);
    }
  };
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Weekly Schedule</h1>
      
      <StatusMessage 
        message={error} 
        type="error" 
        onClear={() => clearMessages()} 
        duration={5000} 
      />
      
      <StatusMessage 
        message={successMessage} 
        type="success" 
        onClear={() => clearMessages()} 
        duration={5000} 
      />
      
      <WeekNavigator
        currentWeekStart={currentWeekStart}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        className="my-4"
      />
      
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={openTemplateModal} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Apply Template
        </button>
        <button 
          onClick={openSaveAsTemplateModal} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Save as Template
        </button>
        <button 
          onClick={openAddEmployeeModal} 
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Add Employee
        </button>
      </div>

      <ScheduleTable
        scheduleData={scheduleData}
        employees={employees}
        dayNames={dayNames}
        getDateForDay={getDateForDay}
        onAddShift={openAddShiftModal}
        onEditShift={openEditShiftModal}
        onDeleteShift={deleteShift}
        onRemoveEmployee={removeEmployee}
      />
      
      <AdminModal
        show={showShiftModal}
        onClose={closeShiftModal}
        title={modalData.id ? "Edit Shift" : "Add Shift"}
        onSave={saveShift}
      >
        <FormInput
          label="Employee"
          value={modalData.employeeName || ''}
          disabled
        />
        <FormInput
          label="Day"
          value={modalData.day || ''}
          disabled
        />
        <FormInput
        label="Shift Time"
        name="shift"
        value={modalData.shift || ''}
        onChange={handleShiftInputChange}
        placeholder="11am to Close"
        />
      </AdminModal>

      <AdminModal
        show={showAddEmployeeModal}
        onClose={closeAddEmployeeModal}
        title="Add Employee to Schedule"
        onSave={() => {
          const employeeValue = document.getElementById('employeeSelect').value;
          const dateValue = document.getElementById('dateInput').value;
          const shiftValue = document.getElementById('shiftTimeInput').value;
          
          if (employeeValue && dateValue && shiftValue) {
            const employee = employees.find(emp => emp.id === employeeValue);
            const selectedDate = new Date(dateValue);
            
            const dayIndex = (selectedDate.getDay() + 6) % 7;
            const selectedDay = dayNames[dayIndex];
            
            const formattedDate = formatDateForDB(selectedDate);
            
            const shiftData = {
              employee_name: employee.name,
              day: selectedDay,
              date: formattedDate,
              shift: shiftValue,
              week_start: formatDateForDB(currentWeekStart),
              event_type: 'tasting',
              event_name: 'Tasting Room'
            };
            
            supabase.from('schedules')
              .insert([shiftData])
              .then(() => {
                showSuccess(`${employee.name} added to schedule with shift on ${selectedDay}`);
                closeAddEmployeeModal();
                loadScheduleData();
              })
              .catch(error => {
                console.error('Error saving shift:', error);
                showError(`Failed to save shift: ${error.message}`);
              });
          } else {
            showError('Please fill in all fields');
          }
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            Select Employee
          </label>
          <select 
            id="employeeSelect" 
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.25rem',
              backgroundColor: '#fff',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="">Select...</option>
            {availableEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            Select Date
          </label>
          <input 
            type="date" 
            id="dateInput" 
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.25rem',
              backgroundColor: '#fff'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            Shift Time
          </label>
          <input 
            type="text" 
            id="shiftTimeInput" 
            placeholder="e.g. 11am to Close" 
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.25rem',
              backgroundColor: '#fff'
            }}
          />
        </div>
      </AdminModal>

      <AdminModal
        show={showTemplateModal}
        onClose={closeTemplateModal}
        title="Apply Template"
        onSave={() => {
            if (selectedTemplate) {
              const template = templates.find(t => t.id == selectedTemplate);
              if (template) {
                // Use templateService instead of just showing success
                templateService.applyTemplateToSchedule(template, currentWeekStart, employees)
                  .then(result => {
                    if (result.success) {
                      showSuccess(result.message);
                      closeTemplateModal();
                      loadScheduleData();
                    } else {
                      showError('Failed to apply template');
                    }
                  })
                  .catch(error => {
                    showError(`Error: ${error.message}`);
                  });
              }
            } else {
              showError('Please select a template');
            }
          }}
      >
        <FormSelect
          label="Select Template"
          value={selectedTemplate || ''}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          options={templates.map(t => ({
            value: t.id,
            label: t.name
          }))}
        />
      </AdminModal>

      <SaveAsTemplateModal
        show={showSaveAsTemplateModal}
        onClose={closeSaveAsTemplateModal}
        saveAsTemplateData={templateData}
        onChange={handleTemplateInputChange}
        onSave={() => {
            if (templateData.overwriteExisting && templateData.existingTemplateId) {
              const templateStructure = templateService.convertScheduleToTemplate(scheduleData, employees);
              templateService.updateExistingTemplate(templateStructure, templateData.existingTemplateId)
                .then(result => {
                  if (result.success) {
                    showSuccess(result.message);
                    closeSaveAsTemplateModal();
                    fetchTemplates();
                  } else {
                    showError('Failed to update template');
                  }
                });
            } else if (templateData.name) {
              const templateStructure = templateService.convertScheduleToTemplate(scheduleData, employees);
              templateService.saveAsNewTemplate(templateStructure, templateData.name)
                .then(result => {
                  if (result.success) {
                    showSuccess(result.message);
                    closeSaveAsTemplateModal();
                    fetchTemplates();
                  } else {
                    showError('Failed to save template');
                  }
                });
            } else {
              showError('Template name is required');
            }
          }}
        templates={templates}
      />
    </div>
  );
}

export default AdminScheduleEditor;