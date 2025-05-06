import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({
    rawData: [],
    groupedData: {},
    queryParams: {},
    employeeMatches: []
  });
  
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
  
  // Format week start date for database (YYYY-MM-DD)
  function formatWeekStartForDB(date) {
    const weekStart = getMonday(date);
    return weekStart.toISOString().split('T')[0];
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
      
      // Get the week start date in YYYY-MM-DD format
      const weekStart = formatWeekStartForDB(currentWeekStart);
      console.log(`Fetching schedule for week starting: ${weekStart}`);
      
      setDebug(prev => ({
        ...prev,
        queryParams: { week_start: weekStart }
      }));
      
      // Fetch schedule for the current week
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', weekStart);
      
      if (error) throw error;
      console.log("Raw schedule data:", data);
      
      setDebug(prev => ({
        ...prev,
        rawData: data || []
      }));
      
      // Group schedules by employee name
      const schedulesGroupedByEmployee = {};
      const employeeMatches = [];
      
      // Create an entry for each employee
      employees.forEach(emp => {
        schedulesGroupedByEmployee[emp.name] = [];
      });
      
      // Fill in shifts from data
      if (data && data.length > 0) {
        data.forEach(shift => {
          // Check for exact match with employee name
          if (schedulesGroupedByEmployee.hasOwnProperty(shift.employee_name)) {
            schedulesGroupedByEmployee[shift.employee_name].push(shift);
            employeeMatches.push({
              shift_employee: shift.employee_name,
              matched_employee: shift.employee_name,
              status: 'Exact match'
            });
          } else {
            // Log the miss for debugging
            employeeMatches.push({
              shift_employee: shift.employee_name,
              available_employees: Object.keys(schedulesGroupedByEmployee),
              status: 'No match'
            });
            
            // Try to find a close match
            const employeeNames = Object.keys(schedulesGroupedByEmployee);
            for (const empName of employeeNames) {
              if (empName.includes(shift.employee_name) || 
                  shift.employee_name.includes(empName)) {
                schedulesGroupedByEmployee[empName].push(shift);
                employeeMatches[employeeMatches.length - 1].status = 
                  `Partial match with ${empName}`;
                employeeMatches[employeeMatches.length - 1].matched_employee = empName;
                break;
              }
            }
          }
        });
      }
      
      console.log("Grouped by employee:", schedulesGroupedByEmployee);
      setScheduleData(schedulesGroupedByEmployee);
      
      setDebug(prev => ({
        ...prev,
        groupedData: schedulesGroupedByEmployee,
        employeeMatches: employeeMatches
      }));
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Direct query for debugging
  const testQuery = async () => {
    try {
      // Try querying with different column
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .limit(10);
      
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert(`Found ${data.length} records.
First record: ${JSON.stringify(data[0], null, 2)}
        
To check for name matching issues, compare these values:
- Employee names in schedules table: ${[...new Set(data.map(d => d.employee_name))].join(', ')}
- Employee names in our employees state: ${employees.map(e => e.name).join(', ')}`);
      }
    } catch (err) {
      alert(`Exception: ${err.message}`);
    }
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
  
  const dateRange = `${formatDateForDisplay(currentWeekStart)} thrugo ${formatDateForDisplay(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
  
  // Day headers
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Edit Weekly Schedule</h1>
      
      {/* Debug Information Panel */}
      <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-bold mb-2">Debug Info</h2>
        <div><strong>Week Start:</strong> {formatWeekStartForDB(currentWeekStart)}</div>
        <div><strong>Employees Count:</strong> {employees.length}</div>
        <div><strong>Raw Schedule Data:</strong> {debug.rawData.length} records</div>
        <div><strong>Grouped Data Keys:</strong> {Object.keys(debug.groupedData).join(', ')}</div>
        
        <div className="mt-2">
          <button
            onClick={testQuery}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
          >
            Test Direct Query
          </button>
        </div>
        
        <div className="mt-2">
          <h3 className="font-semibold">Employee Name Matching:</h3>
          <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-auto max-h-40">
            {JSON.stringify(debug.employeeMatches, null, 2)}
          </pre>
        </div>
        
        <div className="mt-2">
          <h3 className="font-semibold">Employee List:</h3>
          <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-auto max-h-40">
            {JSON.stringify(employees.map(e => e.name), null, 2)}
          </pre>
        </div>
      </div>
      
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
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b">
                <td className="py-3 px-4">{employee.name}</td>
                
                {dayNames.map((day) => {
                  // Find shifts for this employee on this day
                  const shifts = scheduleData[employee.name]?.filter(shift => shift.day === day) || [];
                  
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
          className="mr-2 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          + Add Employee
        </button>
        
        <button 
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