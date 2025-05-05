import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', is_admin: false });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*');
    if (!error) setEmployees(data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addEmployee = async () => {
    const { data, error } = await supabase.from('employees').insert([newEmployee]);
    if (!error) {
      setNewEmployee({ name: '', email: '', phone: '', is_admin: false });
      fetchEmployees();
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Edit/Add Employees</h2>
      <div className="mb-4">
        <input name="name" value={newEmployee.name} onChange={handleChange} placeholder="Name" className="border p-1 mr-2" />
        <input name="email" value={newEmployee.email} onChange={handleChange} placeholder="Email" className="border p-1 mr-2" />
        <input name="phone" value={newEmployee.phone} onChange={handleChange} placeholder="Phone" className="border p-1 mr-2" />
        <label>
          <input type="checkbox" name="is_admin" checked={newEmployee.is_admin} onChange={handleChange} />
          Admin
        </label>
        <button onClick={addEmployee} className="bg-blue-500 text-white px-3 py-1 ml-2">Add</button>
      </div>
      <ul>
        {employees.map(emp => (
          <li key={emp.id}>{emp.name} – {emp.email} – {emp.phone} – {emp.is_admin ? 'Admin' : 'Staff'}</li>
        ))}
      </ul>
    </div>
  );
};

export default AdminEmployees;