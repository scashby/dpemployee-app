import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    info: '',
    off_prem: false,
    assigned_employees: []
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e, id, field) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (id) {
      // Editing existing event
      setEvents(
        events.map((evt) => (evt.id === id ? { ...evt, [field]: value } : evt))
      );
    } else {
      // New event form
      setNewEvent({ ...newEvent, [field]: value });
    }
  };

  const handleEmployeeSelection = (e, eventId) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    if (eventId) {
      // Editing existing event
      setEvents(
        events.map((evt) => (evt.id === eventId ? { ...evt, assigned_employees: selectedOptions } : evt))
      );
    } else {
      // New event form
      setNewEvent({ ...newEvent, assigned_employees: selectedOptions });
    }
  };

  const saveEventChanges = async (id) => {
    try {
      const eventToUpdate = events.find(evt => evt.id === id);
      
      // Currently, we don't have a proper schema for employee assignments
      // So we'll only update the event details for now
      const { error } = await supabase
        .from('events')
        .update({
          title: eventToUpdate.title,
          date: eventToUpdate.date,
          time: eventToUpdate.time,
          info: eventToUpdate.info,
          off_prem: eventToUpdate.off_prem
          // assigned_employees will be added once schema is confirmed
        })
        .eq('id', id);

      if (error) throw error;
      
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditMode(null);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const addEvent = async (e) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date) {
      setError('Title and date are required fields.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      // For now, we'll only save the basic event details
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          info: newEvent.info,
          off_prem: newEvent.off_prem
          // assigned_employees will be added once schema is confirmed
        }])
        .select();

      if (error) throw error;

      // We'll temporarily add the assigned_employees to the local state
      // even though it's not being saved to the database yet
      setEvents([...events, {...data[0], assigned_employees: newEvent.assigned_employees}]);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        info: '',
        off_prem: false,
        assigned_employees: []
      });
      setSuccessMessage('Event added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEvents(events.filter(evt => evt.id !== id));
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="p-4">Loading events...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Events</h2>
      
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
        <h3 className="text-xl font-semibold mb-2">Add New Event</h3>
        <form onSubmit={addEvent} className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title*
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => handleInputChange(e, null, 'title')}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date*
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => handleInputChange(e, null, 'date')}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="text"
                value={newEvent.time}
                placeholder="e.g. 3:00 PM - 7:00 PM"
                onChange={(e) => handleInputChange(e, null, 'time')}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newEvent.off_prem}
                  onChange={(e) => handleInputChange(e, null, 'off_prem')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Off-Premise Event</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Information
              </label>
              <textarea
                value={newEvent.info}
                onChange={(e) => handleInputChange(e, null, 'info')}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Employees
              </label>
              <select
                multiple
                className="w-full p-2 border rounded"
                onChange={(e) => handleEmployeeSelection(e, null)}
                value={newEvent.assigned_employees}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple employees
              </div>
              <div className="text-sm text-orange-500 mt-1">
                Note: Employee assignments will be saved once the schema structure is confirmed
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4">Event List</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border text-left">Title</th>
              <th className="py-2 px-4 border text-left">Date</th>
              <th className="py-2 px-4 border text-left">Time</th>
              <th className="py-2 px-4 border text-center">Off-Premise</th>
              <th className="py-2 px-4 border text-left">Info</th>
              <th className="py-2 px-4 border text-left">Assigned Employees</th>
              <th className="py-2 px-4 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 px-4 border text-center">
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td className="py-2 px-4 border">
                    {editMode === event.id ? (
                      <input
                        type="text"
                        value={event.title || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'title')}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      event.title
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {editMode === event.id ? (
                      <input
                        type="date"
                        value={event.date || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'date')}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      formatDate(event.date)
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {editMode === event.id ? (
                      <input
                        type="text"
                        value={event.time || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'time')}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      event.time
                    )}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {editMode === event.id ? (
                      <input
                        type="checkbox"
                        checked={event.off_prem || false}
                        onChange={(e) => handleInputChange(e, event.id, 'off_prem')}
                      />
                    ) : (
                      event.off_prem ? "Yes" : "No"
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {editMode === event.id ? (
                      <textarea
                        value={event.info || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'info')}
                        className="w-full p-1 border rounded"
                        rows="2"
                      ></textarea>
                    ) : (
                      <div className="max-h-20 overflow-y-auto">
                        {event.info}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {editMode === event.id ? (
                      <select
                        multiple
                        className="w-full p-1 border rounded"
                        onChange={(e) => handleEmployeeSelection(e, event.id)}
                        value={event.assigned_employees || []}
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="max-h-20 overflow-y-auto">
                        {event.assigned_employees && event.assigned_employees.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {event.assigned_employees.map(empId => {
                              const emp = employees.find(e => e.id === empId);
                              return emp ? (
                                <li key={empId}>{emp.name}</li>
                              ) : null;
                            })}
                          </ul>
                        ) : (
                          "No employees assigned"
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {editMode === event.id ? (
                      <>
                        <button
                          onClick={() => saveEventChanges(event.id)}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditMode(event.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
        <h4 className="font-semibold text-yellow-800">Note on Employee Assignment</h4>
        <p className="text-yellow-800">
          This feature requires a schema update to store the employee-event assignments.
          Options include: adding an <code>assigned_employees</code> column (UUID array) to the events table or 
          creating a join table to track assignments. Please confirm your preferred schema to enable this feature fully.
        </p>
      </div>
    </div>
  );
};

export default AdminEvents;