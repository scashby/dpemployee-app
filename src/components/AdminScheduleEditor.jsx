import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
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
    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      start: startDate,
      end: endDate
    };
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
      setLoading(false);
    }
  };
  
  const addEmployee = () => {
    // Placeholder for add employee functionality
    console.log('Add Employee clicked');
  };
  
  const saveChanges = () => {
    // Placeholder for save changes functionality
    console.log('Save Changes clicked');
  };
  
  const removeEmployee = (employeeId) => {
    // This would remove an employee from the current schedule
    console.log(`Remove employee ${employeeId} from schedule`);
  };
  
  if (loading) {
    return <div className="p-4">Loading schedule data...</div>;
  }
  
  const weekDates = getWeekDates();
  const dateRange = `${formatDateForDisplay(weekDates.start)} thrugo ${formatDateForDisplay(weekDates.end)}`;
  
  // Days of the week
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Weekly Schedule</h1>
      
      <div className="flex items-center mb-4">
        <button 
          onClick={goToPreviousWeek} 
          className="bg-gray-200 hover:bg-gray-300 py-1 px-4 rounded mr-2"
        >
          ←Previous
        </button>
        
        <div className="text-lg">{dateRange}</div>
        
        <button 
          onClick={goToNextWeek} 
          className="bg-gray-200 hover:bg-gray-300 py-1 px-4 rounded ml-2"
        >
          Next→
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-4 border-b border-gray-200">EMPLOYEE</th>
              {days.map(day => (
                <th key={day} className="py-2 px-4 border-b border-gray-200 text-center">{day}</th>
              ))}
              <th className="py-2 px-4 border-b border-gray-200 text-center">REMOVE</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b border-gray-200">{employee.name}</td>
                {days.map(day => (
                  <td 
                    key={day} 
                    className="py-2 px-4 border-b border-gray-200 text-center cursor-pointer"
                  ></td>
                ))}
                <td className="py-2 px-4 border-b border-gray-200 text-center">
                  <button 
                    onClick={() => removeEmployee(employee.id)}
                    className="text-gray-500 hover:text-red-500"
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
          className="bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded mr-2"
        >
          + Add Employee
        </button>
        
        <button 
          onClick={saveChanges}
          className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;