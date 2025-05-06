import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { getWeekDateRange, formatDateForDB } from '../utils/dateUtils';
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

const AdminScheduleEditor = () => {
  // Use custom hooks for core functionality
  const { 
    currentWeekStart, 
    goToPreviousWeek, 
    goToNextWeek, 
    goToCurrentWeek
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
  
  // Load schedule data
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
      
      // Initialize schedule structure
      const scheduleByEmployee = {};
      employees.forEach(emp => {
        scheduleByEmployee[emp.name] = {};
        dayNames.forEach(day => {
          scheduleByEmployee[emp.name][day] = [];
        });
      });
      
      const scheduledEmployees = new Set();
      
      // Process regular shifts
      if (data && data.length > 0) {
        data.forEach(shift => {
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
      }
      
      // Process events
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
              event_info: event.info
            });
            
            scheduledEmployees.add(employee.name);
          });
        });
      }
      
      setScheduleData(scheduleByEmployee);
      updateAvailableEmployees(scheduledEmployees);
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
        setSuccessMessage('Event assignments are managed in the Events page');
        setShowShiftModal(false);
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
        shift: modalData.shift
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
      loadScheduleData();
    } catch (error) {
      console.error('Error saving shift:', error);
      setError(`Failed to save shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a shift
  const deleteShift = async (shiftId) => {
    if (shiftId.toString().startsWith('event_')) {
      showError('Event shifts can only be modified in the Events page');
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
      showSuccess('Shift deleted successfully');
      loadScheduleData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      showError('Failed to delete shift');
    } finally {
      setLoading(false);
    }
  };
  
  // Add employee to schedule
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
    
    closeAddEmployeeModal();
  };
  
  // Remove employee from schedule
  const removeEmployeeFromSchedule = async (employeeName) => {
    if (!window.confirm(`Remove ${employeeName} from the schedule?`)) return;
    
    try {
      setLoading(true);
      const dateRange = getWeekDateRange(currentWeekStart);
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      await scheduleService.deleteEmployeeShifts(employeeName, startDate, endDate);
      
      const updatedScheduleData = { ...scheduleData };
      delete updatedScheduleData[employeeName];
      setScheduleData(updatedScheduleData);
      
      const employee = employees.find(emp => emp.name === employeeName);
      if (employee) {
        setAvailableEmployees([...availableEmployees, employee]);
      }
      
      showSuccess(`${employeeName} removed from schedule`);
    } catch (error) {
      console.error('Error removing employee:', error);
      showError('Failed to remove employee');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply template to current week
  const applyTemplate = async () => {
    if (!selectedTemplate) {
      showError('Please select a template to apply');
      return;
    }
    
    try {
      setLoading(true);
      const template = templates.find(t => t.id === parseInt(selectedTemplate));
      if (!template || !template.template) throw new Error('Template not found');
      
      await templateService.applyTemplateToSchedule(template, currentWeekStart, employees);
      
      showSuccess(`Applied template "${template.name}"`);
      closeTemplateModal();
      loadScheduleData();
    } catch (error) {
      console.error('Error applying template:', error);
      showError(`Failed to apply template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Save current schedule as template
  const saveAsTemplate = async () => {
    if (!templateData.name && !templateData.overwriteExisting) {
      showError('Please enter a name for the template');
      return;
    }
    
    if (templateData.overwriteExisting && !templateData.existingTemplateId) {
      showError('Please select a template to overwrite');
      return;
    }
    
    try {
      setLoading(true);
      const templateData = templateService.convertScheduleToTemplate(scheduleData, employees, dayNames);
      
      if (templateData.overwriteExisting) {
        const templateId = parseInt(templateData.existingTemplateId);
        const existingTemplate = templates.find(t => t.id === templateId);
        
        await templateService.updateTemplate(templateId, { template: templateData });
        showSuccess(`Updated template "${existingTemplate.name}"`);
      } else {
        await templateService.createTemplate({
          name: templateData.name,
          date: null,
          template: templateData
        });
        showSuccess(`Created template "${templateData.name}"`);
      }
      
      closeSaveAsTemplateModal();
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showError(`Failed to save template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get date for a specific day
  const getDateForDay = (day) => {
    const dayIndex = dayNames.indexOf(day);
    if (dayIndex === -1) return null;
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
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
          onClick={openAddEmployeeModal}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          + Add Employee
        </button>
        <button 
          onClick={openTemplateModal}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Apply Template
        </button>
        <button 
          onClick={openSaveAsTemplateModal}
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Save as Template
        </button>
      </div>
      
      {/* Shift Modal */}
      <AdminModal
        show={showShiftModal}
        onClose={closeShiftModal}
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
          value={`${modalData.day} (${modalData.date ? new Date(modalData.date).toLocaleDateString() : ''})`} 
          disabled={true} 
        />
        <FormInput
          label="Shift Time"
          name="shift"
          value={modalData.shift}
          onChange={handleShiftInputChange}
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
      
      {/* Add Employee Modal */}
      <AdminModal
        show={showAddEmployeeModal}
        onClose={closeAddEmployeeModal}
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
      
      {/* Apply Template Modal */}
      <AdminModal
        show={showTemplateModal}
        onClose={closeTemplateModal}
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
      
      {/* Save As Template Modal */}
      <SaveAsTemplateModal
        show={showSaveAsTemplateModal}
        onClose={closeSaveAsTemplateModal}
        saveAsTemplateData={templateData}
        onChange={handleTemplateInputChange}
        onSave={saveAsTemplate}
        templates={templates}
      />
    </div>
  );
};

export default AdminScheduleEditor;