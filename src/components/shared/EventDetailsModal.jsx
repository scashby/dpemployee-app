import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/devils-purse.css';
import { generatePDF } from '../../services/generatePDF';

const EventDetailsModal = ({ event, onClose, isAdmin }) => {
  const [employees, setEmployees] = useState([]);
  const [eventAssignments, setEventAssignments] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (event) {
      fetchEventDetails(event.id);
      fetchEmployees();
    }
  }, [event]);

  const fetchEventDetails = async (eventId) => {
    try {
      setLoading(true);
      
      // Fetch the specific event with additional data
      const [
        assignmentsResponse,
        suppliesResponse,
        beersResponse,
        notesResponse
      ] = await Promise.all([
        supabase.from('event_assignments').select('*').eq('event_id', eventId),
        supabase.from('event_supplies').select('*').eq('event_id', eventId),
        supabase.from('event_beers').select('*').eq('event_id', eventId),
        supabase.from('event_post_notes').select('*').eq('event_id', eventId)
      ]);
      
      if (assignmentsResponse.error) throw assignmentsResponse.error;
      if (suppliesResponse.error) throw suppliesResponse.error;
      if (beersResponse.error) throw beersResponse.error;
      if (notesResponse.error) throw notesResponse.error;
      
      // Process event assignments
      const assignedEmployeeIds = assignmentsResponse.data.map(a => a.employee_id);
      setEventAssignments({ [eventId]: assignedEmployeeIds });
      
      // Create the enriched event object
      const enrichedEvent = {
        ...event,
        supplies: suppliesResponse.data[0] || {},
        beers: beersResponse.data || [],
        notes: notesResponse.data[0] || {}
      };
      
      setEventDetails(enrichedEvent);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details. Please try again.');
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const handleDownloadPDF = () => {
    if (eventDetails) {
      generatePDF(eventDetails, employees, eventAssignments);
    }
  };

  if (loading) {
    return (
      <div className="dp-loading">
        <div className="dp-loading-spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!eventDetails) {
    return null;
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
        <div className="dp-section-header">
          <h3 className="dp-subsection-title">Event Details</h3>
          <button 
            onClick={onClose}
            className="dp-button dp-button-text"
          >
            Close
          </button>
        </div>
        
        <div className="dp-event-details">
          <div className="dp-event-details-section">
            <h4>Event Information</h4>
            <div><strong>Event Name:</strong> {eventDetails.title}</div>
            <div><strong>Date:</strong> {formatDate(eventDetails.date)}</div>
            <div><strong>Setup Time:</strong> {eventDetails.setup_time}</div>
            <div><strong>Duration:</strong> {eventDetails.duration}</div>
            <div><strong>Contact Name:</strong> {eventDetails.contact_name}</div>
            <div><strong>Contact Phone:</strong> {eventDetails.contact_phone}</div>
            <div><strong>Expected Attendees:</strong> {eventDetails.expected_attendees}</div>
            <div><strong>Type:</strong> {eventDetails.event_type === "other" ? eventDetails.event_type_other : eventDetails.event_type}</div>
            <div><strong>Staff Attending:</strong> {
              (eventAssignments[eventDetails.id] || []).map(empId => {
                return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
              }).join(', ')
            }</div>
          </div>
          
          <div className="dp-event-actions">
            <button
              onClick={handleDownloadPDF}
              className="dp-button dp-button-secondary dp-button-sm"
            >
              Download PDF
            </button>
            {isAdmin && (
              <button
                className="dp-button dp-button-primary dp-button-sm ml-2"
              >
                Edit Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;