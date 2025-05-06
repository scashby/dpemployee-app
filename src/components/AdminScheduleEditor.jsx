import React, { useState, useEffect } from 'react'; // React is declared but never read
import { supabase } from '../supabase/supabaseClient';
import { getWeekDateRange, formatDateForDB } from '../utils/dateUtils';
import useWeekNavigation from '../hooks/useWeekNavigation';
import useMessages from '../hooks/useMessages';
import useModalState from '../hooks/useModalState';
import * as scheduleService from '../services/scheduleService'; //this and the following imports are declared but never read
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
    goToPreviousWeek, //this and the following constants are declared but never read
    goToNextWeek, 
    goToCurrentWeek
  } = useWeekNavigation();
  
  const { 
    error, //declared but never read
    successMessage, //declared but never read
    showError, 
    showSuccess,
    clearMessages //declared but never read
  } = useMessages();
  
  const {
    modalData,
    templateData, //this and the following constants are declared but never read
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
  const [scheduleData, setScheduleData] = useState({}); // declared but never read
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]); // declared but never read
  const [templates, setTemplates] = useState([]); // declared but never read
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true); // declared but never read
  
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
  const saveShift = async () => { // saveShift is declared but not read
    try {
      setLoading(true);
      
      // Check if this is an event shift
      if (modalData.event_id) {
        showSuccess('Event assignments are managed in the Events page');
        setShowShiftModal(false); // is this setShiftModal or showShiftModal?
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
        showSuccess('Shift updated successfully');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([shiftData]);
          
        if (error) throw error;
        showSuccess('Shift added successfully');
      }
      
      setShowShiftModal(false); // is this setShiftModal or showShiftModal?
      loadScheduleData();
    } catch (error) {
      console.error('Error saving shift:', error);
      showError(`Failed to save shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }  
}
export default AdminScheduleEditor;