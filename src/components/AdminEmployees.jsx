import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    is_admin: false
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, id, field) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (id) {
      // Editing existing employee
      setEmployees(
        employees.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
      );
    } else {
      // New employee form
      setNewEmployee({ ...newEmployee, [field]: value });
    }
  };

  const saveEmployeeChanges = async (id) => {
    try {
      const employeeToUpdate = employees.find(emp => emp.id === id);
      
      const { error } = await supabase
        .from('employees')
        .update({
          name: employeeToUpdate.name,
          email: employeeToUpdate.email,
          phone: employeeToUpdate.phone,
          is_admin: employeeToUpdate.is_admin
        })
        .eq('id', id);

      if (error) throw error;
      
      setSuccessMessage('Employee updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    
    if (!newEmployee.name || !newEmployee.email) {
      setError('Name and email are required fields.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();

      if (error) throw error;

      setEmployees([...employees, data[0]]);
      setNewEmployee({
        name: '',
        email: '',
        phone: '',
        is_admin: false
      });
      setSuccessMessage('Employee added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Failed to add employee. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEmployees(employees.filter(emp => emp.id !== id));
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="p-4">Loading employees...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Employees</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Add New Employee</h3>
        <form onSubmit={addEmployee} className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => handleInputChange(e, null, 'name')}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email*
              </label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={(e) => handleInputChange(e, null, 'email')}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={newEmployee.phone}
                onChange={(e) => handleInputChange(e, null, 'phone')}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newEmployee.is_admin}
                  onChange={(e) => handleInputChange(e, null, 'is_admin')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </label>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4">Employee List</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border text-left">Name</th>
              <th className="py-2 px-4 border text-left">Email</th>
              <th className="py-2 px-4 border text-left">Phone</th>
              <th className="py-2 px-4 border text-center">Admin</th>
              <th className="py-2 px-4 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 px-4 border text-center">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="py-2 px-4 border">
                    <input
                      type="text"
                      value={employee.name || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'name')}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input
                      type="email"
                      value={employee.email || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'email')}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input
                      type="tel"
                      value={employee.phone || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'phone')}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border text-center">
                    <input
                      type="checkbox"
                      checked={employee.is_admin || false}
                      onChange={(e) => handleInputChange(e, employee.id, 'is_admin')}
                    />
                  </td>
                  <td className="py-2 px-4 border text-center">
                    <button
                      onClick={() => saveEmployeeChanges(employee.id)}
                      className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEmployees;