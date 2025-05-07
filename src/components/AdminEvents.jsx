import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [eventAssignments, setEventAssignments] = useState({});
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    info: '',
    off_prem: false,
    selectedEmployees: []
  });

  // Fetch events and employees on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });
          
        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw eventsError;
        }
        
        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, name')
          .order('name');
          
        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          throw employeesError;
        }
        
        // Fetch event-employee assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('event_employees')
          .select('*');
          
        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          throw assignmentsError;
        }
        
        // Process assignments into a more usable format
        const assignmentsMap = {};
        assignmentsData.forEach(assignment => {
          if (!assignmentsMap[assignment.event_id]) {
            assignmentsMap[assignment.event_id] = [];
          }
          assignmentsMap[assignment.event_id].push(assignment.employee_id);
        });
        
        setEvents(eventsData);
        setEmployees(employeesData);
        setEventAssignments(assignmentsMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format date to display in a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle input changes for new event and event edits
  const handleInputChange = (e, eventId, field) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (eventId) {
      // Editing existing event
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId ? { ...event, [field]: value } : event
        )
      );
    } else {
      // New event
      setNewEvent(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle employee selection for new event and event edits
  const handleEmployeeSelection = (e, eventId) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    if (eventId) {
      // Editing existing event
      setEventAssignments(prev => ({
        ...prev,
        [eventId]: selectedOptions
      }));
    } else {
      // New event
      setNewEvent(prev => ({
        ...prev,
        selectedEmployees: selectedOptions
      }));
    }
  };

  // Add a new event
  const addEvent = async (e) => {
    e.preventDefault();
    
    try {
      // Insert new event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{ 
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          info: newEvent.info,
          off_prem: newEvent.off_prem
        }])
        .select();
        
      if (eventError) throw eventError;
      
      const newEventId = eventData[0].id;
      
      // Insert employee assignments if any
      if (newEvent.selectedEmployees.length > 0) {
        const assignmentsToInsert = newEvent.selectedEmployees.map(empId => ({
          event_id: newEventId,
          employee_id: empId
        }));
        
        const { error: assignmentError } = await supabase
          .from('event_employees')
          .insert(assignmentsToInsert);
          
        if (assignmentError) throw assignmentError;
      }
      
      // Update state with new event
      setEvents(prev => [...prev, eventData[0]]);
      
      // Update assignments state
      if (newEvent.selectedEmployees.length > 0) {
        setEventAssignments(prev => ({
          ...prev,
          [newEventId]: newEvent.selectedEmployees
        }));
      }
      
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
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Save changes to an existing event
  const saveEventChanges = async (eventId) => {
    try {
      const eventToUpdate = events.find(event => event.id === eventId);
      
      // Update event
      const { error: eventError } = await supabase
        .from('events')
        .update({ 
          title: eventToUpdate.title,
          date: eventToUpdate.date,
          time: eventToUpdate.time,
          info: eventToUpdate.info,
          off_prem: eventToUpdate.off_prem
        })
        .eq('id', eventId);
        
      if (eventError) throw eventError;
      
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('event_employees')
        .delete()
        .eq('event_id', eventId);
        
      if (deleteError) throw deleteError;
      
      // Insert new assignments if any
      if (eventAssignments[eventId] && eventAssignments[eventId].length > 0) {
        const assignmentsToInsert = eventAssignments[eventId].map(empId => ({
          event_id: eventId,
          employee_id: empId
        }));
        
        const { error: insertError } = await supabase
          .from('event_employees')
          .insert(assignmentsToInsert);
          
        if (insertError) throw insertError;
      }
      
      setEditMode(null);
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Delete an event
  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      // Delete event-employee assignments first (foreign key constraint)
      const { error: assignmentError } = await supabase
        .from('event_employees')
        .delete()
        .eq('event_id', eventId);
        
      if (assignmentError) throw assignmentError;
      
      // Delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
        
      if (eventError) throw eventError;
      
      // Update state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Clean up assignments state
      const newAssignments = { ...eventAssignments };
      delete newAssignments[eventId];
      setEventAssignments(newAssignments);
      
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Title<span className="text-red-500">*</span>
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
                Date<span className="text-red-500">*</span>
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
            <div className="form-group">
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
          </div>
          
          <div className="form-group">
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
          
          <div className="form-group">
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

      <h3 className="admin-subtitle">Event List</h3>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th className="text-center">Off-Premise</th>
              <th>Info</th>
              <th>Assigned Employees</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>
                    {editMode === event.id ? (
                      <input
                        type="text"
                        value={event.title || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'title')}
                        className="form-input"
                      />
                    ) : (
                      event.title
                    )}
                  </td>
                  <td>
                    {editMode === event.id ? (
                      <input
                        type="date"
                        value={event.date || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'date')}
                        className="form-input"
                      />
                    ) : (
                      formatDate(event.date)
                    )}
                  </td>
                  <td>
                    {editMode === event.id ? (
                      <input
                        type="text"
                        value={event.time || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'time')}
                        className="form-input"
                      />
                    ) : (
                      event.time
                    )}
                  </td>
                  <td className="text-center">
                    {editMode === event.id ? (
                      <input
                        type="checkbox"
                        checked={event.off_prem || false}
                        onChange={(e) => handleInputChange(e, event.id, 'off_prem')}
                        className="form-checkbox"
                      />
                    ) : (
                      event.off_prem ? "Yes" : "No"
                    )}
                  </td>
                  <td>
                    {editMode === event.id ? (
                      <textarea
                        value={event.info || ''}
                        onChange={(e) => handleInputChange(e, event.id, 'info')}
                        className="form-textarea"
                        rows="2"
                      ></textarea>
                    ) : (
                      <div className="max-h-20 overflow-y-auto">
                        {event.info}
                      </div>
                    )}
                  </td>
                  <td>
                    {editMode === event.id ? (
                      <select
                        multiple
                        className="form-select"
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
                            {(eventAssignments[event.id] || []).map(empId => {
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
                  <td className="cell-actions">
                    {editMode === event.id ? (
                      <>
                        <button
                          onClick={() => saveEventChanges(event.id)}
                          className="btn btn-success btn-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditMode(event.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="btn btn-danger btn-sm"
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

export default AdminEvents;