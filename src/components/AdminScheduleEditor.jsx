import React, { useState, useEffect } from 'react';
import { 
  fetchEmployees, 
  fetchTemplates,
  fetchEvents,
  fetchEventAssignments,
  fetchScheduleForWeek,
  createShift,
  updateShift,
  deleteShift,
  deleteEmployeeShifts
} from '../services/api';
import { 
  getMonday, 
  getWeekDateRange, 
  formatDateForDB,
  getDayCode
} from '../utils/dateUtils';
import { 
  groupShiftsByEmployee, 
  templateToShifts, 
  isEventShift 
} from '../utils/shiftUtils';

import StatusMessage from './shared/StatusMessage';
import AdminModal from './shared/AdminModal';
import WeekNavigator from './shared/WeekNavigator';
import ShiftCard from './shared/ShiftCard';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';

import '../styles/admin.css';
import '../styles/forms.css';
import '../styles/tables.css';
import '../styles/modals.css';

const AdminScheduleEditor = () => {
  // State management
  const [scheduleData, setScheduleData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Modal states
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [modalData, setModalData] = useState({
    employeeName: '',
    day: '',
    shift: '11-Close',
    event_type: 'tasting',
    event_id: null,
    id: null // Set if editing an existing shift
  });
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  
  // Navigate to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };
  
  // Initial data loading
  useEffect(() => {
    console.log("Initial load - fetching data");
    loadInitialData();
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    if (employees.length > 0) {
      console.log("Week changed or employees loaded - fetching schedule");
      loadScheduleData();
    }
  }, [currentWeekStart, employees]);
  
  // Load all initial data
  const loadInitialData = async () => {
    await Promise.all([
      loadEmployees(),
      loadTemplates(),
      loadEvents()
    ]);
  };
  
  // Load employees data
  const loadEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const { data, error } = await fetchEmployees();
      
      if (error) throw error;
      console.log("Employees data:", data);
      setEmployees(data || []);
      setAvailableEmployees(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
      return [];
    }
  };
  
  // Load templates data
  const loadTemplates = async () => {
    try {
      console.log("Fetching templates...");
      const { data, error } = await fetchTemplates();
      
      if (error) throw error;
      console.log("Templates data:", data);
      setTemplates(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates. Please try again.');
      return [];
    }
  };
  
  // Load events data
  const loadEvents = async () => {
    try {
      console.log("Fetching events...");
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      // Fetch events for the current week
      const { data, error } = await fetchEvents(startDate, endDate);
      
      if (error) throw error;
      
      console.log("Events data:", data);
      
      // Also fetch event assignments
      const { data: assignmentsData, error: assignmentsError } = await fetchEventAssignments();
      
      if (assignmentsError) throw assignmentsError;
      console.log("Event assignments:", assignmentsData);
      
      // Store event assignments with the events
      if (data && assignmentsData) {
        const eventsWithAssignments = data.map(event => {
          const eventAssignments = assignmentsData.filter(a => a.event_id === event.id);
          return { ...event, assignments: eventAssignments };
        });
        setEvents(eventsWithAssignments);
        return eventsWithAssignments;
      }
      
      setEvents(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
      return [];
    }
  };
  
  // Load schedule data
  const loadScheduleData = async () => {
    try {
      console.log("Fetching schedule...");
      setLoading(true);
      
      // Calculate date range for the week
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      console.log(`Fetching schedule from ${startDate} to ${endDate}`);
      
      // Fetch schedule for the current week using date range
      const { data, error } = await fetchScheduleForWeek(startDate, endDate);
      
      if (error) throw error;
      console.log("Raw schedule data:", data);
      
      // Initialize with all employees
      const scheduleByEmployee = {};
      const scheduledEmployees = new Set();
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      
      employees.forEach(emp => {
        scheduleByEmployee[emp.name] = {};
        
        // Initialize days
        days.forEach(day => {
          scheduleByEmployee[emp.name][day] = [];
        });
      });
      
      // Fill in shifts from data
      if (data && data.length > 0) {
        data.forEach(shift => {
          const empName = shift.employee_name;
          const day = shift.day;
          
          // Find matching employee (exact match or partial match)
          let matchedEmployee = null;
          
          // Try exact match first
          if (scheduleByEmployee[empName]) {
            matchedEmployee = empName;
            scheduledEmployees.add(empName);
          } else {
            // Try to find close match if no exact match
            for (const name of Object.keys(scheduleByEmployee)) {
              if (name.includes(empName) || empName.includes(name)) {
                matchedEmployee = name;
                scheduledEmployees.add(name);
                break;
              }
            }
          }
          
          // If we found a match, add the shift
          if (matchedEmployee && scheduleByEmployee[matchedEmployee][day]) {
            scheduleByEmployee[matchedEmployee][day].push(shift);
          }
        });
      }
      
      // Add event shifts to the schedule
      if (events && events.length > 0) {
        events.forEach(event => {
          if (event.assignments) {
            // Convert event date to day of week
            const eventDate = new Date(event.date);
            const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][eventDate.getDay()];
            
            // Find the employee names for the assigned employee IDs
            event.assignments.forEach(assignment => {
              const employee = employees.find(emp => emp.id === assignment.employee_id);
              if (employee && scheduleByEmployee[employee.name]) {
                // Create an event shift
                const eventShift = {
                  id: `event_${event.id}_${assignment.employee_id}`,
                  employee_name: employee.name,
                  day: dayOfWeek,
                  date: event.date,
                  shift: event.time || 'Event Time TBD',
                  event_type: event.off_prem ? 'offsite' : 'event',
                  event_name: event.title,
                  event_id: event.id,
                  event_info: event.info
                };
                
                // Add to the schedule
                scheduleByEmployee[employee.name][dayOfWeek].push(eventShift);
                scheduledEmployees.add(employee.name);
              }
            });
          }
        });
      }
      
      console.log("Grouped schedule data:", scheduleByEmployee);
      setScheduleData(scheduleByEmployee);
      
      // Update available employees list (employees not yet in the schedule)
      const remainingEmployees = employees.filter(emp => !scheduledEmployees.has(emp.name));
      setAvailableEmployees(remainingEmployees);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get date for a specific day of the week
  const getDateForDay = (day) => {
    const dayIndex = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].indexOf(day);
    if (dayIndex === -1) return null;
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };
  
  // Open modal to add a new shift
  const openAddShiftModal = (employeeName, day) => {
    const date = getDateForDay(day);
    const formattedDate = formatDateForDB(date);
    
    setModalData({
      employeeName,
      day,
      date: formattedDate,
      shift: '11-Close',
      event_type: 'tasting', // Default to Tasting Room
      event_name: null,
      event_id: null,
      id: null
    });
    
    setShowShiftModal(true);
  };
  
  // Open modal to edit an existing shift
  const openEditShiftModal = (shift) => {
    setModalData({
      employeeName: shift.employee_name,
      day: shift.day,
      date: shift.date,
      shift: shift.shift,
      event_type: shift.event_type,
      event_name: shift.event_name,
      event_id: shift.event_id,
      id: shift.id
    });
    
    setShowShiftModal(true);
  };
  
  // Handle input changes in the modal
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalData({
      ...modalData,
      [name]: value
    });
  };
  
  // Save shift (add new or update existing)
  const saveShift = async () => {
    try {
      setLoading(true);
      
      const shiftData = {
        employee_name: modalData.employeeName,
        day: modalData.day,
        date: modalData.date,
        shift: modalData.shift,
        event_type: modalData.event_type,
        event_name: modalData.event_name
      };
      
      let result;
      
      // Check if this is an event-related shift
      if (modalData.event_id) {
        // For event shifts, we don't save in schedules table - we update the event_assignments
        setSuccessMessage('Event assignments are managed in the Events page');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        setShowShiftModal(false);
        return;
      }
      
      // Regular shift
      if (modalData.id && !modalData.id.toString().startsWith('event_')) {
        // Update existing shift
        const { data, error } = await updateShift(modalData.id, shiftData);
        
        if (error) throw error;
        result = data;
        setSuccessMessage('Shift updated successfully');
      } else {
        // Add new shift - explicitly only allow adding Tasting Room shifts
        const newShiftData = {
          ...shiftData,
          event_type: 'tasting' // Force tasting room type for new shifts
        };
        
        const { data, error } = await createShift(newShiftData);
        
        if (error) throw error;
        result = data;
        setSuccessMessage('Shift added successfully');
      }
      
      console.log("Shift saved:", result);
      
      // Close modal and refresh schedule
      setShowShiftModal(false);
      loadScheduleData();
    } catch (error) {
      console.error('Error saving shift:', error);
      setError(`Failed to save shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a shift
  const handleDeleteShift = async (shiftId) => {
    // Check if this is an event shift
    if (shiftId.toString().startsWith('event_')) {
      setError('Event shifts can only be modified in the Events page');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await deleteShift(shiftId);
      
      if (error) throw error;
      
      setSuccessMessage('Shift deleted successfully');
      loadScheduleData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      setError('Failed to delete shift. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open modal to add an employee to the schedule
  const openAddEmployeeModal = () => {
    setShowAddEmployeeModal(true);
  };
  
  // Open template selection modal
  const openTemplateModal = () => {
    setSelectedTemplate(null);
    setShowTemplateModal(true);
  };
  
  // Handle template selection
  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };
  
  // Apply selected template to the current week
  const applyTemplate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template to apply');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the template details
      const template = templates.find(t => t.id === parseInt(selectedTemplate));
      if (!template || !template.template) {
        throw new Error('Template not found or invalid');
      }
      
      // Convert template to shifts for the current week
      const shiftsToAdd = templateToShifts(template.template, currentWeekStart, employees);
      
      // Batch insert all the new shifts
      if (shiftsToAdd.length > 0) {
        for (const shift of shiftsToAdd) {
          const { error } = await createShift(shift);
          if (error) throw error;
        }
        
        console.log(`Added ${shiftsToAdd.length} shifts from template`);
        setSuccessMessage(`Applied template "${template.name}" to the current week`);
        
        // Refresh the schedule
        loadScheduleData();
      } else {
        setError('No shifts to add from this template');
      }
      
      // Close the modal
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Error applying template:', error);
      setError(`Failed to apply template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add an employee to the schedule
  const addEmployeeToSchedule = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Add the employee to the schedule data if not already there
    if (!scheduleData[employee.name]) {
      const updatedScheduleData = { ...scheduleData };
      updatedScheduleData[employee.name] = {};
      
      // Initialize days - starting with Monday
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach(day => {
        updatedScheduleData[employee.name][day] = [];
      });
      
      setScheduleData(updatedScheduleData);
      
      // Update available employees
      const updatedAvailableEmployees = availableEmployees.filter(emp => emp.id !== employeeId);
      setAvailableEmployees(updatedAvailableEmployees);
    }
    
    setShowAddEmployeeModal(false);
  };
  
  // Remove an employee from the schedule
  const removeEmployeeFromSchedule = async (employeeName) => {
    if (!window.confirm(`Are you sure you want to remove ${employeeName} from the schedule? This will delete all their shifts for this week.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete all shifts for this employee in the current week
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      const { error } = await deleteEmployeeShifts(employeeName, startDate, endDate);
      
      if (error) throw error;
      
      // Update the schedule data
      const updatedScheduleData = { ...scheduleData };
      delete updatedScheduleData[employeeName];
      setScheduleData(updatedScheduleData);
      
      // Add employee back to available employees
      const employee = employees.find(emp => emp.name === employeeName);
      if (employee) {
        setAvailableEmployees([...availableEmployees, employee]);
      }
      
      setSuccessMessage(`${employeeName} removed from schedule`);
    } catch (error) {
      console.error('Error removing employee from schedule:', error);
      setError('Failed to remove employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Save all changes - not really needed now as changes are saved immediately
  const saveChanges = () => {
    setSuccessMessage('All changes have been saved');
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  // Get the scheduled employees (those who have shifts in the current schedule)
  const scheduledEmployeeNames = Object.keys(scheduleData);
  
  // Day headers - starting with Monday
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Weekly Schedule</h1>
      
      {error && (
        <StatusMessage
          message={error}
          type="error"
          onClear={() => setError(null)}
        />
      )}
      
      {successMessage && (
        <StatusMessage
          message={successMessage}
          type="success"
          onClear={() => setSuccessMessage(null)}
        />
      )}
      
      <WeekNavigator
        currentWeekStart={currentWeekStart}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        className="my-4"
      />
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b">Employee</th>
              {dayNames.map((day) => (
                <th key={day} className="py-2 px-4 border-b text-center">{day}</th>
              ))}
              <th className="py-2 px-4 border-b text-center">REMOVE</th>
            </tr>
          </thead>
          <tbody>
            {scheduledEmployeeNames.map((employeeName) => (
              <tr key={employeeName} className="border-b">
                <td className="py-3 px-4">{employeeName}</td>
                
                {dayNames.map((day) => {
                  const shifts = scheduleData[employeeName][day] || [];
                  
                  return (
                    <td 
                      key={day} 
                      className="py-2 px-2 align-top min-w-[100px] cursor-pointer"
                      onClick={() => shifts.length === 0 && openAddShiftModal(employeeName, day)}
                    >
                      {shifts.map((shift, index) => (
                        <ShiftCard 
                          key={index}
                          shift={shift}
                          onEdit={() => openEditShiftModal(shift)}
                          onDelete={handleDeleteShift}
                        />
                      ))}
                      
                      {shifts.length === 0 && (
                        <div className="h-10 w-full flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 rounded">
                          + Add Shift
                        </div>
                      )}
                    </td>
                  );
                })}
                
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => removeEmployeeFromSchedule(employeeName)}
                    className="text-black hover:text-red-600 font-bold"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex">
        <button 
          onClick={openAddEmployeeModal}
          className="mr-2 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          + Add Employee
        </button>
        
        <button 
          onClick={openTemplateModal}
          className="mr-2 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Apply Template
        </button>
        
        <button 
          onClick={saveChanges}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Save Changes
        </button>
      </div>
      
      {/* Add/Edit Shift Modal */}
      <AdminModal
        show={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={modalData.id ? 'Edit Shift' : 'Add Shift'}
        onSave={saveShift}
      >
        <FormInput
          label="Employee"
          value={modalData.employeeName}
          disabled={true}
        />
        
        <FormInput
          label="Day"
          value={modalData.day}
          disabled={true}
        />
        
        <FormInput
          label="Shift Time"
          name="shift"
          value={modalData.shift}
          onChange={handleModalInputChange}
          placeholder="e.g. 11-Close, 9:00-5:15 PM"
        />
        
        {!modalData.event_id && (
          <FormSelect
            label="Type"
            name="event_type"
            value={modalData.event_type}
            onChange={handleModalInputChange}
            options={[
              { value: 'tasting', label: 'Tasting Room' }
            ]}
            helpText="All manually added shifts are Tasting Room shifts"
            disabled={!modalData.id || modalData.id.toString().startsWith('event_')}
          />
        )}
        
        {modalData.event_id && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700">
              This is an event shift. Event assignments are managed in the Events page.
            </p>
          </div>
        )}
      </AdminModal>
      
      {/* Add Employee Modal */}
      <AdminModal
        show={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        title="Add Employee to Schedule"
        showFooter={false}
      >
        {availableEmployees.length === 0 ? (
          <p className="mb-4 text-gray-600">All employees are already on the schedule.</p>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Employee
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableEmployees.map(employee => (
                <div
                  key={employee.id}
                  onClick={() => addEmployeeToSchedule(employee.id)}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                >
                  {employee.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminModal>
      
      {/* Template Modal */}
      <AdminModal
        show={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Apply Schedule Template"
        onSave={applyTemplate}
        saveButtonText="Apply Template"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Template
          </label>
          
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates found. Create templates in the Default Schedules page.</p>
          ) : (
            <FormSelect
              name="template"
              value={selectedTemplate || ''}
              onChange={handleTemplateChange}
              options={templates.map(template => ({
                value: template.id,
                label: template.name
              }))}
              required={true}
            />
          )}
          
          <p className="mt-2 text-sm text-gray-500">
            Applying a template will add shifts to the current schedule without removing existing shifts.
          </p>
          
          {selectedTemplate && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-medium text-sm text-blue-700">
                Template: {templates.find(t => t.id === parseInt(selectedTemplate))?.name}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                This will add approximately {
                  Object.values(templates.find(t => t.id === parseInt(selectedTemplate))?.template || {})
                    .flat().length
                } shifts to the schedule.
              </p>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminScheduleEditor;