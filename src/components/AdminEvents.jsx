import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [eventAssignments, setEventAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    info: '',
    off_prem: false,
    selectedEmployees: []
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
      
      // Fetch all event assignments
      await fetchEventAssignments();
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .select('*');

      if (error) throw error;
      
      // Group assignments by event_id for easier lookup
      const assignmentsByEvent = {};
      if (data && data.length > 0) {
        data.forEach(assignment => {
          if (!assignmentsByEvent[assignment.event_id]) {
            assignmentsByEvent[assignment.event_id] = [];
          }
          assignmentsByEvent[assignment.event_id].push(assignment.employee_id);
        });
      }
      
      setEventAssignments(assignmentsByEvent);
    } catch (error) {
      console.error('Error fetching event assignments:', error);
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
      // Update event assignments for existing event
      setEventAssignments({
        ...eventAssignments,
        [eventId]: selectedOptions
      });
    } else {
      // Store selected employees temporarily for new event
      setNewEvent({ ...newEvent, selectedEmployees: selectedOptions });
    }
  };

  const saveEventChanges = async (id) => {
    try {
      const eventToUpdate = events.find(evt => evt.id === id);
      
      // Update event details
      const { error } = await supabase
        .from('events')
        .update({
          title: eventToUpdate.title,
          date: eventToUpdate.date,
          time: eventToUpdate.time,
          info: eventToUpdate.info,
          off_prem: eventToUpdate.off_prem
        })
        .eq('id', id);

      if (error) throw error;
      
      // Get current assignments for this event
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('event_assignments')
        .select('*')
        .eq('event_id', id);
      
      if (fetchError) throw fetchError;
      
      // Get the employee IDs that are currently assigned
      const currentEmployeeIds = currentAssignments.map(a => a.employee_id);
      
      // Get the new employee IDs from the state
      const newEmployeeIds = eventAssignments[id] || [];
      
      // Employees to add (in new but not in current)
      const employeesToAdd = newEmployeeIds.filter(empId => !currentEmployeeIds.includes(empId));
      
      // Employees to remove (in current but not in new)
      const employeesToRemove = currentEmployeeIds.filter(empId => !newEmployeeIds.includes(empId));
      
      // Add new assignments
      if (employeesToAdd.length > 0) {
        const assignmentsToAdd = employeesToAdd.map(empId => ({
          event_id: id,
          employee_id: empId
        }));
        
        const { error: insertError } = await supabase
          .from('event_assignments')
          .insert(assignmentsToAdd);
        
        if (insertError) throw insertError;
      }
      
      // Remove assignments that are no longer needed
      if (employeesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('event_assignments')
          .delete()
          .eq('event_id', id)
          .in('employee_id', employeesToRemove);
        
        if (deleteError) throw deleteError;
      }
      
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditMode(null);
      
      // Refresh event assignments
      await fetchEventAssignments();
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
      // First, insert the new event
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          info: newEvent.info,
          off_prem: newEvent.off_prem
        }])
        .select();

      if (error) throw error;
      
      const newEventId = data[0].id;
      
      // If employees were selected, create assignments
      if (newEvent.selectedEmployees && newEvent.selectedEmployees.length > 0) {
        const assignments = newEvent.selectedEmployees.map(empId => ({
          event_id: newEventId,
          employee_id: empId
        }));
        
        const { error: assignmentError } = await supabase
          .from('event_assignments')
          .insert(assignments);
        
        if (assignmentError) throw assignmentError;
        
        // Update the assignments state
        setEventAssignments({
          ...eventAssignments,
          [newEventId]: newEvent.selectedEmployees
        });
      }
      
      // Add the new event to the state
      setEvents([...events, data[0]]);
      
      // Reset form
      setNewEvent({
        title: '',
        date: '',
        time: '',
        info: '',
        off_prem: false,
        selectedEmployees: []
      });
      
      setSuccessMessage('Event added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh event assignments
      await fetchEventAssignments();
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
      // The event_assignments will be automatically deleted due to the CASCADE constraint
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the local state
      setEvents(events.filter(evt => evt.id !== id));
      
      // Remove assignments from the state
      const updatedAssignments = { ...eventAssignments };
      delete updatedAssignments[id];
      setEventAssignments(updatedAssignments);
      
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
    return <div className="admin-section">Loading events...</div>;
  }

  return (
    <div className="admin-section">
      <h2 className="admin-title">Manage Events</h2>
      
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
        <h3 className="admin-subtitle">Add New Event</h3>
        <form onSubmit={addEvent} className="admin-form">
          <div className="form-row" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
            <div className="form-group">
              <label className="form-label">
                Title*
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => handleInputChange(e, null, 'title')}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Date*
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => handleInputChange(e, null, 'date')}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Time
              </label>
              <input
                type="text"
                value={newEvent.time}
                placeholder="e.g. 3:00 PM - 7:00 PM"
                onChange={(e) => handleInputChange(e, null, 'time')}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{display: 'flex', alignItems: 'flex-end'}}>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={newEvent.off_prem}
                  onChange={(e) => handleInputChange(e, null, 'off_prem')}
                  className="form-checkbox"
                />
                <span>Off-Premise Event</span>
              </label>
            </div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label className="form-label">
                Information
              </label>
              <textarea
                value={newEvent.info}
                onChange={(e) => handleInputChange(e, null, 'info')}
                className="form-textarea"
                rows="3"
              ></textarea>
            </div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label className="form-label">
                Assign Employees
              </label>
              <select
                multiple
                className="form-select"
                onChange={(e) => handleEmployeeSelection(e, null)}
                value={newEvent.selectedEmployees || []}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <div className="form-help-text">
                Hold Ctrl/Cmd to select multiple employees
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>

>
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
    </div>
  );
};

export default AdminEvents;={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple employees
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
                        value={eventAssignments[event.id] || []}
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="max-h-20 overflow-y-auto">
                        {eventAssignments[event.id] && eventAssignments[event.id].length > 0 ? (
                          <ul className="list-disc list-inside">
                            {eventAssignments[event.id].map(empId => {
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
    </div>
  );
};

export default AdminEvents;={emp.id} value={emp.id}>
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