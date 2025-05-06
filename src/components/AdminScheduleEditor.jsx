import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/admin.css';

const AdminScheduleEditor = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal states
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [modalData, setModalData] = useState({
    employeeName: '',
    day: '',
    shift: '11-Close',
    event_type: 'tasting',
    id: null // Set if editing an existing shift
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
  
  // Get date for a specific day of the week
  function getDateForDay(day) {
    const dayIndex = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].indexOf(day);
    if (dayIndex === -1) return null;
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
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
      setAvailableEmployees(data || []);
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
      const scheduledEmployees = new Set();
      
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
  
  // Open modal to add a new shift
  const openAddShiftModal = (employeeName, day) => {
    const date = getDateForDay(day);
    const formattedDate = formatDateForDB(date);
    
    setModalData({
      employeeName,
      day,
      date: formattedDate,
      shift: '11-Close',
      event_type: 'tasting',
      id: null
    });
    
    setShowShiftModal(true);
  };
  
  // Open modal to edit an existing shift
  const openEditShiftModal = (shift, employeeName, day) => {
    setModalData({
      employeeName,
      day,
      date: shift.date,
      shift: shift.shift,
      event_type: shift.event_type,
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
        event_name: null
      };
      
      let result;
      
      if (modalData.id) {
        // Update existing shift
        const { data, error } = await supabase
          .from('schedules')
          .update(shiftData)
          .eq('id', modalData.id)
          .select();
        
        if (error) throw error;
        result = data;
        setSuccessMessage('Shift updated successfully');
      } else {
        // Add new shift
        const { data, error } = await supabase
          .from('schedules')
          .insert(shiftData)
          .select();
        
        if (error) throw error;
        result = data;
        setSuccessMessage('Shift added successfully');
      }
      
      console.log("Shift saved:", result);
      
      // Close modal and refresh schedule
      setShowShiftModal(false);
      fetchSchedule();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving shift:', error);
      setError('Failed to save shift. Please try again.');
      
      // Clear error message after a delay
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a shift
  const deleteShift = async (shiftId) => {
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
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting shift:', error);
      setError('Failed to delete shift. Please try again.');
      
      // Clear error message after a delay
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };
  
  // Open modal to add an employee to the schedule
  const openAddEmployeeModal = () => {
    setShowAddEmployeeModal(true);
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
      
      // Get all shifts for this employee in the current week
      const dateRange = getWeekDateRange();
      const startDate = formatDateForDB(dateRange.start);
      const endDate = formatDateForDB(dateRange.end);
      
      const { data, error } = await supabase
        .from('schedules')
        .select('id')
        .eq('employee_name', employeeName)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Delete all shifts for this employee
      if (data && data.length > 0) {
        const shiftIds = data.map(s => s.id);
        
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .in('id', shiftIds);
        
        if (deleteError) throw deleteError;
      }
      
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
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error removing employee from schedule:', error);
      setError('Failed to remove employee. Please try again.');
      
      // Clear error message after a delay
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };
  
  // Save all changes
  const saveChanges = () => {
    setSuccessMessage('All changes saved successfully');
    
    // Clear success message after a delay
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
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
  const displayRange = `${formatDateForDisplay(dateRange.start)} - ${formatDateForDisplay(dateRange.end)}`;
  
  // Day headers - starting with Monday
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Get the scheduled employees (those who have shifts in the current schedule)
  const scheduledEmployeeNames = Object.keys(scheduleData);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Edit Weekly Schedule</h1>
      
      {error && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="my-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
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
                        <div 
                          key={index} 
                          className={`p-2 rounded mb-1 relative ${getShiftClass(shift.event_type)}`}
                        >
                          <div className="flex justify-between">
                            <span>
                              {shift.event_type === 'tasting' ? 'Tasting Room' : shift.event_type}
                              <br />
                              {shift.shift}
                            </span>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditShiftModal(shift, employeeName, day);
                                }}
                                className="text-white hover:text-gray-200"
                              >
                                ✎
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteShift(shift.id);
                                }}
                                className="text-white hover:text-gray-200"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
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
          onClick={saveChanges}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Save Changes
        </button>
      </div>
      
      <div className="mt-6">
        <a href="#" className="text-blue-600 hover:underline">Download Personal Schedule</a>
      </div>
      
      {/* Add/Edit Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modalData.id ? 'Edit Shift' : 'Add Shift'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <input
                type="text"
                value={modalData.employeeName}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day
              </label>
              <input
                type="text"
                value={modalData.day}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Time
              </label>
              <input
                type="text"
                name="shift"
                value={modalData.shift}
                onChange={handleModalInputChange}
                placeholder="e.g. 11-Close, 9:00-5:15 PM"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="event_type"
                value={modalData.event_type}
                onChange={handleModalInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="tasting">Tasting Room</option>
                <option value="offsite">Offsite</option>
                <option value="packaging">Packaging</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowShiftModal(false)}
                className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveShift}
                className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
              >
                {modalData.id ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Employee to Schedule</h2>
            
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
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScheduleEditor;