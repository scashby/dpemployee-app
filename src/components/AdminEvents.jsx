import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', info: '', assigned_employees: []
  });

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('date');
    if (!error) setEvents(data);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('name');
    if (data) setEmployees(data.map(e => e.name));
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const handleEmployeeChange = (index, value) => {
    const updated = [...events];
    updated[index].assigned_employees = value.split(',').map(v => v.trim());
    setEvents(updated);
  };

  const saveEvent = async (event) => {
    await supabase.from('events').update(event).eq('id', event.id);
    await syncToSchedule(event);
    fetchEvents();
  };

  const syncToSchedule = async (event) => {
    if (!event.assigned_employees || !event.date) return;
    const week_start = new Date(event.date);
    week_start.setDate(week_start.getDate() - week_start.getDay()); // Sunday start
    const weekStr = week_start.toISOString().slice(0, 10);
    const dayStr = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
    for (const name of event.assigned_employees) {
      await supabase.from('schedules').insert({
        week_start: weekStr,
        employee_name: name,
        day: dayStr,
        date: event.date,
        shift: 'Event',
        event_type: 'event',
        event_name: event.title,
      });
    }
  };

  const addNewEvent = async () => {
    await supabase.from('events').insert([newEvent]);
    setNewEvent({ title: '', date: '', time: '', info: '', assigned_employees: [] });
    fetchEvents();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Events</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Time</th>
            <th className="p-2 border">Info</th>
            <th className="p-2 border">Assigned Employees</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, index) => (
            <tr key={e.id}>
              <td className="p-2 border"><input value={e.title} onChange={ev => handleInputChange(index, 'title', ev.target.value)} /></td>
              <td className="p-2 border"><input type="date" value={e.date} onChange={ev => handleInputChange(index, 'date', ev.target.value)} /></td>
              <td className="p-2 border"><input value={e.time} onChange={ev => handleInputChange(index, 'time', ev.target.value)} /></td>
              <td className="p-2 border"><input value={e.info} onChange={ev => handleInputChange(index, 'info', ev.target.value)} /></td>
              <td className="p-2 border">
                <select multiple value={e.assigned_employees} onChange={ev => handleEmployeeChange(index, Array.from(ev.target.selectedOptions, o => o.value).join(','))} className="w-full">
                  {employees.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </td>
              <td className="p-2 border text-center">
                <button onClick={() => saveEvent(e)} className="bg-blue-600 text-white px-2 py-1 rounded">Save</button>
              </td>
            </tr>
          ))}
          <tr className="bg-yellow-50">
            <td className="p-2 border"><input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} /></td>
            <td className="p-2 border"><input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} /></td>
            <td className="p-2 border"><input value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} /></td>
            <td className="p-2 border"><input value={newEvent.info} onChange={e => setNewEvent({ ...newEvent, info: e.target.value })} /></td>
            <td className="p-2 border">
              <select multiple value={newEvent.assigned_employees} onChange={ev => setNewEvent({ ...newEvent, assigned_employees: Array.from(ev.target.selectedOptions, o => o.value) })} className="w-full">
                {employees.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </td>
            <td className="p-2 border text-center">
              <button onClick={addNewEvent} className="bg-green-600 text-white px-2 py-1 rounded">Add</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AdminEvents;