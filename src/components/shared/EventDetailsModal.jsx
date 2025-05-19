import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/devils-purse.css';
import { generatePDF } from '../../services/generatePDF';

const EventDetailsModal = ({ visibleEventId }) => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [eventAssignments, setEventAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPrintForm, setShowPrintForm] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date');
      if (eventsError) throw eventsError;
      const [
        assignmentsResponse,
        suppliesResponse,
        beersResponse,
        notesResponse
      ] = await Promise.all([
        supabase.from('event_assignments').select('*'),
        supabase.from('event_supplies').select('*'),
        supabase.from('event_beers').select('*'),
        supabase.from('event_post_notes').select('*')
      ]);
      if (assignmentsResponse.error) throw assignmentsResponse.error;
      if (suppliesResponse.error) throw suppliesResponse.error;
      if (beersResponse.error) throw beersResponse.error;
      if (notesResponse.error) throw notesResponse.error;
      const assignmentsByEvent = {};
      if (assignmentsResponse.data && assignmentsResponse.data.length > 0) {
        assignmentsResponse.data.forEach(assignment => {
          if (!assignmentsByEvent[assignment.event_id]) {
            assignmentsByEvent[assignment.event_id] = [];
          }
          assignmentsByEvent[assignment.event_id].push(assignment.employee_id);
        });
      }
      setEventAssignments(assignmentsByEvent);
      const suppliesByEvent = {};
      suppliesResponse.data?.forEach(supply => {
        suppliesByEvent[supply.event_id] = supply;
      });
      const beersByEvent = {};
      beersResponse.data?.forEach(beer => {
        if (!beersByEvent[beer.event_id]) {
          beersByEvent[beer.event_id] = [];
        }
        beersByEvent[beer.event_id].push(beer);
      });
      const notesByEvent = {};
      notesResponse.data?.forEach(note => {
        notesByEvent[note.event_id] = note;
      });
      const enrichedEvents = eventsData?.map(event => ({
        ...event,
        supplies: suppliesByEvent[event.id] || {},
        beers: beersByEvent[event.id] || [],
        notes: notesByEvent[event.id] || {}
      })) || [];
      setEvents(enrichedEvents);
    } catch (error) {
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
    } catch (error) {}
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <div className="dp-loading">
        <div className="dp-loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="dp-container">
      {error && (
        <div className="dp-alert dp-alert-error">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="dp-alert dp-alert-success">
          {successMessage}
        </div>
      )}
      <div className="dp-section">
        <h3 className="dp-subsection-title">Event Details</h3>
        <div className="dp-table-container">
          <table className="dp-table hidden-mobile">
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="7" className="dp-empty-table">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event) =>
                  String(event.id) === String(visibleEventId) ? (
                    <React.Fragment key={event.id}>
                      <tr className="dp-table-row">
                        <td colSpan="7">
                          <div className="dp-event-details">
                            <div className="dp-event-details-section">
                              <h4>Event Information</h4>
                              <div><strong>Event Name:</strong> {event.title}</div>
                              <div><strong>Date:</strong> {formatDate(event.date)}</div>
                              <div><strong>Setup Time:</strong> {event.setup_time}</div>
                              <div><strong>Duration:</strong> {event.duration}</div>
                              <div><strong>Contact Name:</strong> {event.contact_name}</div>
                              <div><strong>Contact Phone:</strong> {event.contact_phone}</div>
                              <div><strong>Expected Attendees:</strong> {event.expected_attendees}</div>
                              <div><strong>Type:</strong> {event.event_type === "other" ? event.event_type_other : event.event_type}</div>
                              <div><strong>Staff Attending:</strong> {(eventAssignments[event.id] || []).map(empId => {
                                return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
                              }).join(', ')}</div>
                            </div>
                            <div className="dp-event-actions">
                              <button
                                onClick={() => generatePDF(event, employees, eventAssignments)}
                                className="dp-button dp-button-secondary dp-button-sm"
                              >
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ) : null
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;