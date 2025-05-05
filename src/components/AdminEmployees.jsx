import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    is_admin: false,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) console.error('Error fetching employees:', error);
    else setEmployees(data);
  };

  const handleEdit = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
    );
  };

  const saveEmployee = async (emp) => {
    const { error } = await supabase
      .from('employees')
      .update({
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        is_admin: emp.is_admin,
      })
      .eq('id', emp.id);

    if (error) console.error('Error updating employee:', error);
    fetchEmployees();
  };

  const deleteEmployee = async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) console.error('Error deleting employee:', error);
    fetchEmployees();
  };

  const addEmployee = async () => {
    const { error } = await supabase.from('employees').insert([newEmployee]);
    if (error) console.error('Error adding employee:', error);
    setNewEmployee({ name: '', email: '', phone: '', is_admin: false });
    fetchEmployees();
  };

  return (
    <div>
      <h2>Manage Employees</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Admin</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <input
                  value={emp.name}
                  onChange={(e) => handleEdit(emp.id, 'name', e.target.value)}
                />
              </td>
              <td>
                <input
                  value={emp.email}
                  onChange={(e) => handleEdit(emp.id, 'email', e.target.value)}
                />
              </td>
              <td>
                <input
                  value={emp.phone}
                  onChange={(e) => handleEdit(emp.id, 'phone', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={emp.is_admin}
                  onChange={(e) => handleEdit(emp.id, 'is_admin', e.target.checked)}
                />
              </td>
              <td>
                <button onClick={() => saveEmployee(emp)}>Save</button>
                <button onClick={() => deleteEmployee(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
              />
            </td>
            <td>
              <input
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
              />
            </td>
            <td>
              <input
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, phone: e.target.value })
                }
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={newEmployee.is_admin}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, is_admin: e.target.checked })
                }
              />
            </td>
            <td>
              <button onClick={addEmployee}>Add</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AdminEmployees;