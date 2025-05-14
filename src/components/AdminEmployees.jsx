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
    return <div className="admin-section">Loading employees...</div>;
  }

  return (
    <div className="admin-section">
      <h2 className="admin-title">Manage Employees</h2>
      
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

      <div className="mb-8">
        <h3 className="admin-subtitle">Add New Employee</h3>
        <form onSubmit={addEmployee} className="admin-form">
          <div className="form-row" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
            <div className="form-group">
              <label className="form-label">
                Name*
              </label>
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => handleInputChange(e, null, 'name')}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email*
              </label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={(e) => handleInputChange(e, null, 'email')}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Phone
              </label>
              <input
                type="tel"
                value={newEmployee.phone}
                onChange={(e) => handleInputChange(e, null, 'phone')}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{display: 'flex', alignItems: 'flex-end'}}>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={newEmployee.is_admin}
                  onChange={(e) => handleInputChange(e, null, 'is_admin')}
                  className="form-checkbox"
                />
                <span>Admin</span>
              </label>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>

      <h3 className="admin-subtitle">Employee List</h3>

      {/* Desktop view table */}
      <div className="overflow-x-auto hidden-mobile">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{textAlign: 'center'}}>Admin</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <input
                      type="text"
                      value={employee.name || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'name')}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      value={employee.email || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'email')}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="tel"
                      value={employee.phone || ''}
                      onChange={(e) => handleInputChange(e, employee.id, 'phone')}
                      className="table-input"
                    />
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <input
                      type="checkbox"
                      checked={employee.is_admin || false}
                      onChange={(e) => handleInputChange(e, employee.id, 'is_admin')}
                    />
                  </td>
                  <td className="cell-actions">
                    <button
                      onClick={() => saveEmployeeChanges(employee.id)}
                      className="btn btn-success btn-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="btn btn-danger btn-sm"
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

      {/* Mobile card view */}
      <div className="dp-employee-cards">
        {employees.length === 0 ? (
          <div className="dp-empty-employees">No employees found.</div>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className="dp-employee-card">
              <div className="dp-employee-card-body">
                <div className="dp-employee-card-field">
                  <label className="dp-employee-card-label">Name:</label>
                  <input
                    type="text"
                    value={employee.name || ''}
                    onChange={(e) => handleInputChange(e, employee.id, 'name')}
                    className="dp-employee-card-input"
                  />
                </div>
                
                <div className="dp-employee-card-field">
                  <label className="dp-employee-card-label">Email:</label>
                  <input
                    type="email"
                    value={employee.email || ''}
                    onChange={(e) => handleInputChange(e, employee.id, 'email')}
                    className="dp-employee-card-input"
                  />
                </div>
                
                <div className="dp-employee-card-field">
                  <label className="dp-employee-card-label">Phone:</label>
                  <input
                    type="tel"
                    value={employee.phone || ''}
                    onChange={(e) => handleInputChange(e, employee.id, 'phone')}
                    className="dp-employee-card-input"
                  />
                </div>
                
                <div className="dp-employee-card-field">
                  <label className="dp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={employee.is_admin || false}
                      onChange={(e) => handleInputChange(e, employee.id, 'is_admin')}
                      className="dp-checkbox"
                    />
                    <span>Admin</span>
                  </label>
                </div>
              </div>
              
              <div className="dp-employee-card-actions">
                <button
                  onClick={() => saveEmployeeChanges(employee.id)}
                  className="btn btn-success btn-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteEmployee(employee.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEmployees;