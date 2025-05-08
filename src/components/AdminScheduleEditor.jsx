import React, { useState, useEffect } from 'react'; 
import { supabase } from '../supabase/supabaseClient';
import { getWeekDateRange, formatDateForDB, getDayOfWeekIndex } from '../utils/dateUtils';
import useWeekNavigation from '../hooks/useWeekNavigation';
import useMessages from '../hooks/useMessages';
import useModalState from '../hooks/useModalState';
import * as scheduleService from '../services/scheduleService';
import * as templateService from '../services/templateService';
import StatusMessage from './shared/StatusMessage';
import WeekNavigator from './shared/WeekNavigator';
import ScheduleTable from './shared/ScheduleTable';
import AdminModal from './shared/AdminModal'; 
import FormInput from './shared/FormInput'; 
import FormSelect from './shared/FormSelect'; 
import SaveAsTemplateModal from './shared/SaveAsTemplateModal'; 
import '../styles/admin.css';
import '../styles/devils-purse.css';

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
    openAddEmployeeModal,
    closeAddEmployeeModal, 
    openTemplateModal,
    closeTemplateModal, 
    setSelectedTemplate, 
    openSaveAsTemplateModal,
    closeSaveAsTemplateModal, 
    handleShiftInputChange,
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

    // Ensure schedule is loaded after component mounts
    useEffect(() => {
      if (!loading && Object.keys(scheduleData).length === 0 && employees.length > 0) {
        loadScheduleData();
      }
    }, [loading, scheduleData, employees]);
  
  // Load all initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [employeesData, templatesData, eventsData] = await Promise.all([
        fetchEmployees(),
        fetchTemplates(),
        fetchEvents()
      ]);
  
      // Use eventsData directly instead of relying on state update
      setEvents(eventsData);
      await loadScheduleData(eventsData);
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
  
  const fetchEvents = async () => {
    try {
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      console.log('Date range:', startDate, endDate);
      
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
      
      console.log('Events found:', eventsResponse.data);
      
      const events = eventsResponse.data?.map(event => ({
        ...event,
        assignments: assignmentsResponse.data?.filter(a => a.event_id === event.id) || []
      })) || [];
      
      setEvents(events);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      showError('Failed to load events');
      return [];
    }
  };

  // Update the loadScheduleData function
  const loadScheduleData = async (eventsToProcess = events) => {
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
      
      // Process event assignments to identify employees with event shifts this week
      if (eventsToProcess && eventsToProcess.length > 0) {
        eventsToProcess.forEach(event => {
          if (!event.assignments) return;
          
          // Check if event date is within the current week
          const eventDate = new Date(event.date);
          // Add time to both dates to ensure proper comparison
          eventDate.setHours(12, 0, 0, 0);
          const weekStart = new Date(currentWeekStart);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          // Skip events not in current week
          if (eventDate < weekStart || eventDate > weekEnd) return;
          
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
      if (eventsToProcess && eventsToProcess.length > 0) {
        eventsToProcess.forEach(event => {
          if (!event.assignments) return;
          
          // Check if event date is within the current week
          const eventDate = new Date(event.date);
          // Add time to both dates to ensure proper comparison
          eventDate.setHours(12, 0, 0, 0);
          const weekStart = new Date(currentWeekStart);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          // Skip events not in current week
          if (eventDate < weekStart || eventDate > weekEnd) return;

          // Use the getDay directly to determine the day index
          // JavaScript getDay(): 0=Sunday, 1=Monday, etc.
          // Our dayNames array: MON, TUE, WED, THU, FRI, SAT, SUN
          // So we need a custom mapping
          const jsDay = eventDate.getDay(); // 0=Sunday, 6=Saturday
          const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday, 6=Sunday
          const dayOfWeek = dayNames[dayIndex];         
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
      
      console.log('Processed schedule data:', JSON.stringify(scheduleByEmployee, null, 2));
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
  };
  
  if (loading && employees.length === 0) {
    return <div className="dp-loading">Loading schedule data...</div>;
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
  
  return (
    <div className="dp-schedule-container">
      <h1 className="dp-schedule-title">Edit Weekly Schedule</h1>
      
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
        className="dp-week-navigator"
      />
      
      <div className="dp-button-group">
        <button 
          onClick={openTemplateModal} 
          className="dp-button dp-button-primary"
        >
          Apply Template
        </button>
        <button 
          onClick={openSaveAsTemplateModal} 
          className="dp-button dp-button-success"
        >
          Save as Template
        </button>
        <button 
          onClick={openAddEmployeeModal} 
          className="dp-button dp-button-secondary"
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
        <div className="dp-form-group">
          <label className="dp-form-label">
            Select Employee
          </label>
          <select 
            id="employeeSelect" 
            className="dp-form-select"
          >
            <option value="">Select...</option>
            {availableEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div className="dp-form-group">
          <label className="dp-form-label">
          Select Date
          </label>
          <input 
            type="date" 
            id="dateInput" 
            className="dp-form-input"
          />
        </div>
        
        <div className="dp-form-group">
          <label className="dp-form-label">
            Shift Time
          </label>
          <input 
            type="text" 
            id="shiftTimeInput" 
            placeholder="e.g. 11am to Close" 
            className="dp-form-input"
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