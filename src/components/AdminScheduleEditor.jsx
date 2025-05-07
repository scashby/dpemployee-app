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
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Track which employees have shifts
      const employeesWithShifts = new Set();
      
      // Initialize schedule structure with the CURRENT scheduleData
      // This preserves manually added employees
      const scheduleByEmployee = {};
      
      // First, add any employees that were already in the schedule
      // This ensures manually added employees remain
      Object.keys(scheduleData).forEach(empName => {
        scheduleByEmployee[empName] = {};
        dayNames.forEach(day => {
          scheduleByEmployee[empName][day] = [];
        });
        employeesWithShifts.add(empName);
      });
      
      // Then process regular shifts
      if (data && data.length > 0) {
        data.forEach(shift => {
          const empName = shift.employee_name;
          const day = shift.day;
          
          if (!scheduleByEmployee[empName]) {
            scheduleByEmployee[empName] = {};
            dayNames.forEach(d => {
              scheduleByEmployee[empName][d] = [];
            });
            employeesWithShifts.add(empName);
          }
          
          scheduleByEmployee[empName][day].push(shift);
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
            if (!employee) return;
            
            // Add employee to schedule if not already there
            if (!scheduleByEmployee[employee.name]) {
              scheduleByEmployee[employee.name] = {};
              dayNames.forEach(day => {
                scheduleByEmployee[employee.name][day] = [];
              });
              employeesWithShifts.add(employee.name);
            }
            
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
          // Get values directly from the DOM when Save is clicked
          const employeeValue = document.getElementById('employeeSelect').value;
          const dateValue = document.getElementById('dateInput').value;
          const shiftValue = document.getElementById('shiftTimeInput').value;
          
          if (employeeValue && dateValue && shiftValue) {
            const employee = employees.find(emp => emp.id === employeeValue);
            const selectedDate = new Date(dateValue);
            
            // Calculate the day code (MON, TUE, etc.) from the selected date
            const dayIndex = (selectedDate.getDay() + 6) % 7; // Convert from Sunday=0 to Monday=0
            const selectedDay = dayNames[dayIndex];
            
            // Format date for database
            const formattedDate = formatDateForDB(selectedDate);
            
            // Create shift data object
            const shiftData = {
              employee_name: employee.name,
              day: selectedDay,
              date: formattedDate,
              shift: shiftValue,
              week_start: formatDateForDB(currentWeekStart),
              event_type: 'tasting',
              event_name: 'Tasting Room'
            };
            
            // Insert the shift into the database
            supabase.from('schedules')
              .insert([shiftData])
              .then(() => {
                showSuccess(`${employee.name} added to schedule with shift on ${selectedDay}`);
                closeAddEmployeeModal();
                loadScheduleData(); // Refresh the schedule
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
        <div className="form-group">
          <label className="form-label" htmlFor="employeeSelect">Select Employee</label>
          <select 
            id="employeeSelect" 
            className="form-select"
          >
            <option value="">Select...</option>
            {availableEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="dateInput">Select Date</label>
          <input 
            type="date" 
            id="dateInput" 
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="shiftTimeInput">Shift Time</label>
          <input 
            type="text" 
            id="shiftTimeInput" 
            className="form-input" 
            placeholder="e.g. 11am to Close"
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