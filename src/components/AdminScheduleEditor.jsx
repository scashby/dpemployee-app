import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  const [schedule, setSchedule] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  
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
  
  // Get date for display (MM/DD)
  function formatDateForDisplay(date) {
    const month = date.getMonth() + 1; // getMonth is zero-based
    const day = date.getDate();
    return `${month}/${day}`;
  }
  
  // Get formatted date range for the week
  function getWeekRangeDisplay() {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const startMonth = currentWeekStart.getMonth() + 1;
    const startDay = currentWeekStart.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    
    return `${startMonth}/${startDay} thrugo ${endMonth}/${endDay}`;
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
    console.log("AdminScheduleEditor - Initial loading");
    fetchEmployees();
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    console.log("AdminScheduleEditor - Week changed, fetching schedule");
    if (employees.length > 0) {
      fetchSchedule();
    }
  }, [currentWeekStart, employees]);
  
  const fetchEmployees = async () => {
    console.log("Fetching employees...");
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      console.log("Fetched employees:", data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    }
  };
  
  const fetchSchedule = async () => {
    console.log("Fetching schedule...");
    try {
      setLoading(true);
      
      // Get dates for the week
      const weekDates = getWeekDates();
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);
      
      console.log(`Fetching schedule from ${startDate} to ${endDate}`);
      
      // Fetch existing schedule for the week
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      console.log("Schedule data from DB:", data);
      
      // Initialize an empty schedule
      const scheduleData = [];
      
      // For each employee, create a row with their shifts
      employees.forEach(employee => {
        const employeeRow = {
          employee: employee,
          shifts: Array(7).fill(null) // One for each day of the week
        };
        
        // Fill in existing shifts
        if (data) {
          weekDates.forEach((date, dayIndex) => {
            const dateStr = formatDateForDB(date);
            const shift = data.find(s => s.employee_id === employee.id && s.date === dateStr);
            
            if (shift) {
              employeeRow.shifts[dayIndex] = {
                id: shift.id,
                type: shift.shift,
                time: shift.time,
                event_type: shift.event_type,
                event_id: shift.event_id
              };
            }
          });
        }
        
        scheduleData.push(employeeRow);
      });
      
      console.log("Processed schedule data:", scheduleData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const addEmployee = () => {
    // This would open a dialog to add employee to this week's schedule
    alert('Add employee functionality will be implemented here');
  };
  
  const saveChanges = async () => {
    alert('Save changes functionality will be implemented here');
    // This would save any changes made to the schedule
  };
  
  // Function to get the appropriate CSS class for a shift
  const getShiftClass = (shift) => {
    if (!shift) return '';
    
    switch (shift.type) {
      case 'Tasting Room':
        return 'tasting-room-shift';
      case 'Offsite':
        return 'offsite-shift';
      case 'Packaging':
        return 'packaging-shift';
      default:
        return '';
    }
  };
  
  if (loading && employees.length === 0) {
    return <div className="admin-section">Loading schedule data...</div>;
  }
  
  // Days of the week
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  return (
    <div className="admin-section">
      <h2 className="page-title">Edit Weekly Schedule</h2>
      
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
      
      <div className="week-navigation">
        <button className="nav-button" onClick={goToPreviousWeek}>
          ←Previous
        </button>
        
        <div className="current-week">
          {getWeekRangeDisplay()}
        </div>
        
        <button className="nav-button" onClick={goToNextWeek}>
          Next→
        </button>
      </div>
      
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="employee-header">EMPLOYEE</th>
              {days.map(day => (
                <th key={day} className="day-header">{day}</th>
              ))}
              <th className="remove-header">REMOVE</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, index) => (
              <tr key={row.employee.id} className="employee-row">
                <td className="employee-cell">{row.employee.name}</td>
                {row.shifts.map((shift, dayIndex) => (
                  <td key={dayIndex} className="shift-cell">
                    {shift && (
                      <div className={`shift-box ${getShiftClass(shift)}`}>
                        {shift.type}
                        <br />
                        {shift.time}
                      </div>
                    )}
                  </td>
                ))}
                <td className="remove-cell">
                  <button className="remove-button">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="schedule-actions">
        <button className="action-button add-employee" onClick={addEmployee}>
          + Add Employee
        </button>
        
        <button className="action-button save-changes" onClick={saveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;