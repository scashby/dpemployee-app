import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { getMonday, formatDateForDB, getWeekDateRange } from '../utils/dateUtils';
import StatusMessage from './shared/StatusMessage';
import AdminModal from './shared/AdminModal';
import WeekNavigator from './shared/WeekNavigator';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';
import ScheduleTable from './shared/ScheduleTable';
import SaveAsTemplateModal from './shared/SaveAsTemplateModal';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  // Core state
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
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saveAsTemplateData, setSaveAsTemplateData] = useState({
    name: '',
    overwriteExisting: false,
    existingTemplateId: ''
  });
  
  // Shift modal data
  const [modalData, setModalData] = useState({
    employeeName: '',
    day: '',
    shift: '11-Close',
    event_id: null,
    event_name: null,
    id: null
  });
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  
  // Day headers - starting with Monday
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Initial data loading
  useEffect(() => {
    Promise.all([fetchEmployees(), fetchTemplates(), fetchEvents()]);
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    if (employees.length > 0) fetchSchedule();
  }, [currentWeekStart, employees]);
  
  // Get date for a specific day of the week
  const getDateForDay = (day) => {
    const dayIndex = dayNames.indexOf(day);
    if (dayIndex === -1) return null;
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  // Fetch functions
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
      setAvailableEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
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
      
      setTemplates(parsedData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates.');
    }
  };
  
  const fetchEvents = async () => {
    try {
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      // Fetch events and event assignments
      const [eventsResponse, assignmentsResponse] = await Promise.all([
        supabase.from('events').select('*').gte('date', startDate).lte('date', endDate).order('date'),
        supabase.from('event_assignments').select('*')
      ]);
      
      if (eventsResponse.error) throw eventsResponse.error;
      if (assignmentsResponse.error) throw assignmentsResponse.error;
      
      // Add assignments to events
      if (eventsResponse.data && assignmentsResponse.data) {
        const eventsWithAssignments = eventsResponse.data.map(event => ({
          ...event,
          assignments: assignmentsResponse.data.filter(a => a.event_id === event.id)
        }));
        setEvents(eventsWithAssignments);
      } else {
        setEvents(eventsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events.');
    }
  };
  
  const fetchSchedule = async () => {
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
      
      // Initialize schedule structure
      const scheduleByEmployee = initializeScheduleStructure();
      const scheduledEmployees = new Set();
      
      // Process regular shifts and events
      if (data && data.length > 0) {
        processShifts(data, scheduleByEmployee, scheduledEmployees);
      }
      
      if (events && events.length > 0) {
        processEvents(events, scheduleByEmployee, scheduledEmployees);
      }
      
      setScheduleData(scheduleByEmployee);
      updateAvailableEmployees(scheduledEmployees);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions
  const initializeScheduleStructure = () => {
    const scheduleByEmployee = {};
    employees.forEach(emp => {
      scheduleByEmployee[emp.name] = {};
      dayNames.forEach(day => {
        scheduleByEmployee[emp.name][day] = [];
      });
    });
    return scheduleByEmployee;
  };
  
  const processShifts = (shifts, scheduleByEmployee, scheduledEmployees) => {
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
  };
  
  const processEvents = (events, scheduleByEmployee, scheduledEmployees) => {
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
          event_info: event.info
        });
        
        scheduledEmployees.add(employee.name);
      });
    });
  };
  
  const updateAvailableEmployees = (scheduledEmployees) => {
    const remainingEmployees = employees.filter(emp => !scheduledEmployees.has(emp.name));
    setAvailableEmployees(remainingEmployees);
  };
  
  // Modal handlers
  const openAddShiftModal = (employeeName, day) => {
    const date = getDateForDay(day);
    setModalData({
      employeeName,
      day,
      date: formatDateForDB(date),
      shift: '11-Close',
      event_id: null,
      event_name: null,
      id: null
    });
    setShowShiftModal(true);
  };
  
  const openEditShiftModal = (shift) => {
    setModalData({
      employeeName: shift.employee_name,
      day: shift.day,
      date: shift.date,
      shift: shift.shift,
      event_name: shift.event_name,
      event_id: shift.event_id,
      id: shift.id
    });
    setShowShiftModal(true);
  };
  
  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (showSaveAsTemplateModal) {
      setSaveAsTemplateData({...saveAsTemplateData, [name]: newValue});
    } else {
      setModalData({...modalData, [name]: value});
    }
  };
  
  // Action handlers
  const saveShift = async () => {
    try {
      setLoading(true);
      
      // Check if this is an event shift
      if (modalData.event_id) {
        setSuccessMessage('Event assignments are managed in the Events page');
        setShowShiftModal(false);
        return;
      }
      
      const shiftData = {
        employee_name: modalData.employeeName,
        day: modalData.day,
        date: modalData.date,
        shift: modalData.shift,
        event_name: modalData.event_name
      };
      
      // Update or create shift
      if (modalData.id && !modalData.id.toString().startsWith('event_')) {
        const { error } = await supabase
          .from('schedules')
          .update(shiftData)
          .eq('id', modalData.id);
          
        if (error) throw error;
        setSuccessMessage('Shift updated successfully');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([shiftData]);
          
        if (error) throw error;
        setSuccessMessage('Shift added successfully');
      }
      
      setShowShiftModal(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error saving shift:', error);
      setError(`Failed to save shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteShift = async (shiftId) => {
    if (shiftId.toString().startsWith('event_')) {
      setError('Event shifts can only be modified in the Events page');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', shiftId);
      
      if (error) throw error;
      setSuccessMessage('Shift deleted successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Error deleting shift:', error);
      setError('Failed to delete shift.');
    } finally {
      setLoading(false);
    }
  };
  
  const addEmployeeToSchedule = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    if (!scheduleData[employee.name]) {
      const updatedScheduleData = { ...scheduleData };
      updatedScheduleData[employee.name] = {};
      dayNames.forEach(day => {
        updatedScheduleData[employee.name][day] = [];
      });
      
      setScheduleData(updatedScheduleData);
      setAvailableEmployees(availableEmployees.filter(emp => emp.id !== employeeId));
    }
    
    setShowAddEmployeeModal(false);
  };
  
  const removeEmployeeFromSchedule = async (employeeName) => {
    if (!window.confirm(`Remove ${employeeName} from the schedule?`)) return;
    
    try {
      setLoading(true);
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
        const { error } = await supabase
          .from('schedules')
          .delete()
          .in('id', data.map(s => s.id));
        
        if (error) throw error;
      }
      
      const updatedScheduleData = { ...scheduleData };
      delete updatedScheduleData[employeeName];
      setScheduleData(updatedScheduleData);
      
      const employee = employees.find(emp => emp.name === employeeName);
      if (employee) {
        setAvailableEmployees([...availableEmployees, employee]);
      }
      
      setSuccessMessage(`${employeeName} removed from schedule`);
    } catch (error) {
      console.error('Error removing employee:', error);
      setError('Failed to remove employee.');
    } finally {
      setLoading(false);
    }
  };
  
  const applyTemplate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template to apply');
      return;
    }
    
    try {
      setLoading(true);
      const template = templates.find(t => t.id === parseInt(selectedTemplate));
      if (!template || !template.template) throw new Error('Template not found');
      
      await applyTemplateToSchedule(template);
      
      setSuccessMessage(`Applied template "${template.name}"`);
      setShowTemplateModal(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error applying template:', error);
      setError(`Failed to apply template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const applyTemplateToSchedule = async (template) => {
    const dateRange = getWeekDateRange(currentWeekStart);
    const dayMap = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };
    
    const shiftsToAdd = [];
    
    // Process each day in template
    for (const [day, shifts] of Object.entries(template.template)) {
      const dayIndex = dayMap[day];
      if (dayIndex === undefined) continue;
      
      const dayDate = new Date(dateRange.start);
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
    } else {
      throw new Error('No shifts to add from this template');
    }
  };
  
  const saveAsTemplate = async () => {
    if (!saveAsTemplateData.name && !saveAsTemplateData.overwriteExisting) {
      setError('Please enter a name for the template');
      return;
    }
    
    if (saveAsTemplateData.overwriteExisting && !saveAsTemplateData.existingTemplateId) {
      setError('Please select a template to overwrite');
      return;
    }
    
    try {
      setLoading(true);
      const templateData = convertScheduleToTemplate();
      
      if (saveAsTemplateData.overwriteExisting) {
        const templateId = parseInt(saveAsTemplateData.existingTemplateId);
        const existingTemplate = templates.find(t => t.id === templateId);
        
        const { error } = await supabase
          .from('holidays')
          .update({ template: templateData })
          .eq('id', templateId);
        
        if (error) throw error;
        setSuccessMessage(`Updated template "${existingTemplate.name}"`);
      } else {
        const { error } = await supabase
          .from('holidays')
          .insert([{
            name: saveAsTemplateData.name,
            date: null,
            template: templateData
          }]);
        
        if (error) throw error;
        setSuccessMessage(`Created template "${saveAsTemplateData.name}"`);
      }
      
      setShowSaveAsTemplateModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setError(`Failed to save template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const convertScheduleToTemplate = () => {
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
    
    return templateData;
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Weekly Schedule</h1>
      
      <StatusMessage message={error} type="error" onClear={() => setError(null)} duration={5000} />
      <StatusMessage message={successMessage} type="success" onClear={() => setSuccessMessage(null)} duration={5000} />
      
      <WeekNavigator
        currentWeekStart={currentWeekStart}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={() => setCurrentWeekStart(getMonday(new Date()))}
        className="my-4"
      />
      
      <ScheduleTable
        scheduleData={scheduleData}
        employees={employees}
        dayNames={dayNames}
        getDateForDay={getDateForDay}
        onAddShift={openAddShiftModal}
        onEditShift={openEditShiftModal}
        onDeleteShift={deleteShift}
        onRemoveEmployee={removeEmployeeFromSchedule}
      />
      
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          onClick={() => setShowAddEmployeeModal(true)}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          + Add Employee
        </button>
        <button 
          onClick={() => setShowTemplateModal(true)}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Apply Template
        </button>
        <button 
          onClick={() => setShowSaveAsTemplateModal(true)}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Save as Template
        </button>
      </div>
      
      {/* Modals */}
      <AdminModal
        show={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={modalData.id ? 'Edit Shift' : 'Add Shift'}
        onSave={saveShift}
      >
        <FormInput label="Employee" value={modalData.employeeName} disabled={true} />
        <FormInput 
          label="Day" 
          value={`${modalData.day} (${modalData.date ? new Date(modalData.date).toLocaleDateString() : ''})`} 
          disabled={true} 
        />
        <FormInput
          label="Shift Time"
          name="shift"
          value={modalData.shift}
          onChange={handleModalInputChange}
          placeholder="e.g. 11-Close, 9:00-5:15 PM"
        />
        {modalData.event_id && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700">
              This is an event shift. Event assignments are managed in the Events page.
            </p>
          </div>
        )}
      </AdminModal>
      
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
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
      
      <AdminModal
        show={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Apply Schedule Template"
        onSave={applyTemplate}
        saveButtonText="Apply Template"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates found. Create templates in the Default Schedules page.</p>
          ) : (
            <FormSelect
              name="template"
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              options={templates.map(t => ({ value: t.id, label: t.name }))}
              required={true}
            />
          )}
          <p className="mt-2 text-sm text-gray-500">
            Applying a template will add shifts without removing existing ones.
          </p>
        </div>
      </AdminModal>
      
      <SaveAsTemplateModal
        show={showSaveAsTemplateModal}
        onClose={() => setShowSaveAsTemplateModal(false)}
        saveAsTemplateData={saveAsTemplateData}
        onChange={handleModalInputChange}
        onSave={saveAsTemplate}
        templates={templates}
      />
    </div>
  );
};

export default AdminScheduleEditor;