import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/devils-purse.css';
import { generatePDF } from '../../services/generatePDF';

const EventDetailsModal = ({ event, employees = [], eventAssignments = {} }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  if (!event) {
    return (
      <div className="dp-empty-table">
        No event selected.
      </div>
    );
  }

  return (
    <div className="dp-container">
      <div className="dp-section">
        <div className="dp-table-container">
          <table className="dp-table hidden-mobile">
            <tbody>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;