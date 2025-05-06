import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminScheduleEditor = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  
  // Gets Monday of the current week
  function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }
  
  // Format date for display (M/D)
  function formatDateForDisplay(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
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
  
  // Format date string for database queries (YYYY-MM-DD)
  function formatDateForDB(date) {
    return date.toISOString().split('T')[0];
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
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    if (employees.length > 0) {
      fetchSchedule();
    }
  }, [currentWeekStart, employees]);
  
  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
      
      console.log("Employees data:", data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    }
  };
  
  const fetchSchedule = async () => {
    try {
      console.log("Fetching schedule...");
      setLoading(true);
      
      // Get dates for the week
      const weekDates = getWeekDates();
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);
      
      console.log(`Fetching schedule from ${startDate} to ${endDate}`);
      
      // Fetch schedule for the week
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) {
        console.error("Error fetching schedules:", error);
        throw error;
      }
      
      console.log("Schedule data:", data);
      
      // Organize schedule data by employee and day
      const organized = [];
      
      employees.forEach(employee => {
        const employeeShifts = {
          id: employee.id,
          name: employee.name,
          shifts: {}
        };
        
        // Initialize each day with empty shift
        weekDates.forEach(date => {
          const dateStr = formatDateForDB(date);
          employeeShifts.shifts[dateStr] = [];
        });
        
        // Fill in shifts from data
        if (data && data.length > 0) {
          data.forEach(shift => {
            if (shift.employee_id === employee.id) {
              if (!employeeShifts.shifts[shift.date]) {
                employeeShifts.shifts[shift.date] = [];
              }
              employeeShifts.shifts[shift.date].push({
                id: shift.id,
                shift: shift.shift,
                time: shift.time,
                event_type: shift.event_type
              });
            }
          });
        }
        
        organized.push(employeeShifts);
      });
      
      console.log("Organized schedule data:", organized);
      setScheduleData(organized);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const addEmployee = () => {
    console.log('Add Employee clicked');
    // This would open a dialog to select an employee to add to the schedule
  };
  
  const saveChanges = () => {
    console.log('Save Changes clicked');
    // This would save any changes to the schedule
  };
  
  const removeEmployee = (employeeId) => {
    console.log(`Remove employee ${employeeId} from schedule`);
    // This would remove an employee from the current schedule
  };
  
  // Helper to get CSS class for different shift types
  const getShiftClass = (shiftType) => {
    switch (shiftType) {
      case 'Tasting Room':
        return 'bg-emerald-500 text-white';
      case 'Offsite':
        return 'bg-blue-500 text-white';
      case 'Packaging':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300';
    }
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  const weekDates = getWeekDates();
  const dateRange = `${formatDateForDisplay(weekDates[0])} thrugo ${formatDateForDisplay(weekDates[6])}`;
  
  // Day headers
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Edit Weekly Schedule</h1>
      
      <div className="flex items-center my-4">
        <button 
          onClick={goToPreviousWeek} 
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          ←Previous
        </button>
        
        <span className="mx-4 text-lg">{dateRange}</span>
        
        <button 
          onClick={goToNextWeek} 
          className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          Next→
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b">Employee</th>
              {dayNames.map((day, index) => (
                <th key={day} className="py-2 px-4 border-b text-center">{day}</th>
              ))}
              <th className="py-2 px-4 border-b text-center">REMOVE</th>
            </tr>
          </thead>
          <tbody>
            {scheduleData.map((employee) => (
              <tr key={employee.id} className="border-b">
                <td className="py-3 px-4">{employee.name}</td>
                
                {weekDates.map((date, dayIndex) => {
                  const dateStr = formatDateForDB(date);
                  const shifts = employee.shifts[dateStr] || [];
                  
                  return (
                    <td key={dateStr} className="py-2 px-2 align-top min-w-[100px]">
                      {shifts.map((shift, index) => (
                        <div 
                          key={index} 
                          className={`p-2 rounded mb-1 ${getShiftClass(shift.shift)}`}
                        >
                          {shift.shift}
                          <br />
                          {shift.time}
                        </div>
                      ))}
                    </td>
                  );
                })}
                
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => removeEmployee(employee.id)}
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
          onClick={addEmployee}
          className="mr-2 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          + Add Employee
        </button>
        
        <button 
          onClick={saveChanges}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Save Changes
        </button>
      </div>
      
      <div className="mt-6">
        <a href="#" className="text-blue-600 hover:underline">Download Personal Schedule</a>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;