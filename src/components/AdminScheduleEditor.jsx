import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Week navigation state - starting with Monday
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
  
  // Get date range for the week (Monday to Sunday)
  function getWeekDateRange() {
    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6); // 6 days after Monday = Sunday
    
    return {
      start: startDate,
      end: endDate
    };
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
    console.log("Initial load - fetching employees");
    fetchEmployees();
  }, []);
  
  // Fetch schedule whenever week changes
  useEffect(() => {
    if (employees.length > 0) {
      console.log("Week changed or employees loaded - fetching schedule");
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
      
      if (error) throw error;
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
      
      // Calculate date range for the week
      const dateRange = getWeekDateRange();
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      console.log(`Fetching schedule from ${startDate} to ${endDate}`);
      
      // Fetch schedule for the current week using date range
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      console.log("Raw schedule data:", data);
      
      // Group schedules by employee name
      const scheduleByEmployee = {};
      
      // Initialize with all employees
      employees.forEach(emp => {
        scheduleByEmployee[emp.name] = {};
        
        // Initialize days - starting with Monday
        ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach(day => {
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
          } else {
            // Try to find close match if no exact match
            for (const name of Object.keys(scheduleByEmployee)) {
              if (name.includes(empName) || empName.includes(name)) {
                matchedEmployee = name;
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
      
      console.log("Grouped schedule data:", scheduleByEmployee);
      setScheduleData(scheduleByEmployee);
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
  
  const removeEmployee = (employeeName) => {
    console.log(`Remove employee ${employeeName} from schedule`);
    // This would remove an employee from the current schedule
  };
  
  // Helper to get CSS class for different shift types
  const getShiftClass = (eventType) => {
    switch (eventType) {
      case 'tasting':
        return 'bg-emerald-500 text-white';
      case 'offsite':
        return 'bg-blue-500 text-white';
      case 'packaging':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300';
    }
  };
  
  if (loading && employees.length === 0) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  const dateRange = getWeekDateRange();
  const displayRange = `${formatDateForDisplay(dateRange.start)} thrugo ${formatDateForDisplay(dateRange.end)}`;
  
  // Day headers - starting with Monday
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
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
        
        <span className="mx-4 text-lg">{displayRange}</span>
        
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
              {dayNames.map((day) => (
                <th key={day} className="py-2 px-4 border-b text-center">{day}</th>
              ))}
              <th className="py-2 px-4 border-b text-center">REMOVE</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b">
                <td className="py-3 px-4">{employee.name}</td>
                
                {dayNames.map((day) => {
                  const shifts = scheduleData?.[employee.name]?.[day] || [];
                  
                  return (
                    <td key={day} className="py-2 px-2 align-top min-w-[100px]">
                      {shifts.map((shift, index) => (
                        <div 
                          key={index} 
                          className={`p-2 rounded mb-1 ${getShiftClass(shift.event_type)}`}
                        >
                          {shift.event_type === 'tasting' ? 'Tasting Room' : shift.event_type}
                          <br />
                          {shift.shift}
                        </div>
                      ))}
                    </td>
                  );
                })}
                
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => removeEmployee(employee.name)}
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