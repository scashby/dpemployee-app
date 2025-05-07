import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEvents = () => {
  // All state and function declarations remain the same
  
  // Skipping to the return statement for brevity
  
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