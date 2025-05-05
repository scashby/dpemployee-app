import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', is_admin: false });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('name');
    if (!error) setEmployees(data);
  };

  const handleChange = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = field === 'is_admin' ? value.target.checked : value;
    setEmployees(updated);
  };

  const saveChanges = async (employee) => {
    await supabase.from('employees').update(employee).eq('id', employee.id);
    fetchEmployees();
  };

  const addEmployee = async () => {
    if (!newEmployee.name) return;
    await supabase.from('employees').insert([newEmployee]);
    setNewEmployee({ name: '', email: '', phone: '', is_admin: false });
    fetchEmployees();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Employees</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Admin</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, index) => (
            <tr key={emp.id} className="border-t">
              <td className="p-2 border">
                <input value={emp.name} onChange={(e) => handleChange(index, 'name', e.target.value)} className="w-full" />
              </td>
              <td className="p-2 border">
                <input value={emp.email} onChange={(e) => handleChange(index, 'email', e.target.value)} className="w-full" />
              </td>
              <td className="p-2 border">
                <input value={emp.phone} onChange={(e) => handleChange(index, 'phone', e.target.value)} className="w-full" />
              </td>
              <td className="p-2 border text-center">
                <input type="checkbox" checked={emp.is_admin} onChange={(e) => handleChange(index, 'is_admin', e)} />
              </td>
              <td className="p-2 border text-center">
                <button onClick={() => saveChanges(emp)} className="bg-blue-600 text-white px-2 py-1 rounded">Save</button>
              </td>
            </tr>
          ))}
          <tr className="bg-yellow-50 border-t">
            <td className="p-2 border">
              <input value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full" placeholder="New name" />
            </td>
            <td className="p-2 border">
              <input value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full" placeholder="Email" />
            </td>
            <td className="p-2 border">
              <input value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} className="w-full" placeholder="Phone" />
            </td>
            <td className="p-2 border text-center">
              <input type="checkbox" checked={newEmployee.is_admin} onChange={(e) => setNewEmployee({ ...newEmployee, is_admin: e.target.checked })} />
            </td>
            <td className="p-2 border text-center">
              <button onClick={addEmployee} className="bg-green-600 text-white px-2 py-1 rounded">Add</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AdminEmployees;