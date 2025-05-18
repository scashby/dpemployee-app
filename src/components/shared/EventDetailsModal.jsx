import React from "react";
import { generatePDF } from "../../services/generatePDF";

const EventDetailsModal = ({
  event,
  employees = [],
  eventAssignments = {},
  onClose,
  isAdmin = false,
  onEdit,
  onDelete,
  onPostNotes,
}) => {
  // Get assigned employees as names
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');

  return (
    <div className="dp-printable-event-form-modal">
      <div className="dp-printable-event-form">
        <button className="dp-close-btn" onClick={onClose}>&times;</button>
        <h2 className="dp-form-title">{event.title || "Event Details"}</h2>
        <div className="dp-form-row"><strong>Date:</strong> {event.date}</div>
        <div className="dp-form-row"><strong>Setup Time:</strong> {event.setup_time}</div>
        <div className="dp-form-row"><strong>Duration:</strong> {event.duration || event.time}</div>
        <div className="dp-form-row"><strong>Contact Name:</strong> {event.contact_name}</div>
        <div className="dp-form-row"><strong>Contact Phone:</strong> {event.contact_phone}</div>
        <div className="dp-form-row"><strong>Expected Attendees:</strong> {event.expected_attendees}</div>
        <div className="dp-form-row"><strong>Location:</strong> {event.off_prem ? "Off-premise" : "On-premise"}</div>
        <div className="dp-form-row"><strong>Type:</strong> {event.event_type === "other" ? event.event_type_other : event.event_type}</div>
        <div className="dp-form-row"><strong>Info:</strong> {event.info}</div>
        <div className="dp-form-row"><strong>Event Instructions:</strong> {event.event_instructions}</div>
        <div className="dp-form-row"><strong>Staff Attending:</strong> {assignedEmployees}</div>
        <div className="dp-form-row">
          <strong>Supplies Needed:</strong>
          <ul>
            {event.supplies && event.supplies.table_needed && <li>Table</li>}
            {event.supplies && event.supplies.beer_buckets && <li>Beer buckets</li>}
            {event.supplies && event.supplies.table_cloth && <li>Table cloth</li>}
            {event.supplies && event.supplies.tent_weights && <li>Tent/weights</li>}
            {event.supplies && event.supplies.signage && <li>Signage</li>}
            {event.supplies && event.supplies.ice && <li>Ice</li>}
            {event.supplies && event.supplies.jockey_box && <li>Jockey box</li>}
            {event.supplies && event.supplies.cups && <li>Cups</li>}
            {event.supplies && event.supplies.additional_supplies && (
              <li>Additional: {event.supplies.additional_supplies}</li>
            )}
          </ul>
        </div>
        <div className="dp-form-row">
          <strong>Beer Products:</strong>
          <ul>
            {event.beers && event.beers.length > 0 ? (
              event.beers.map((beer, idx) => (
                <li key={idx}>
                  {beer.beer_style} — {beer.packaging} — {beer.quantity}
                </li>
              ))
            ) : (
              <li>No beers listed</li>
            )}
          </ul>
        </div>
        <div className="dp-form-row">
          <strong>Post-Event Notes:</strong>
          <ul>
            <li><strong>Estimated Attendees:</strong> {event.notes?.estimated_attendees}</li>
            <li><strong>Favorite Beer:</strong> {event.notes?.favorite_beer}</li>
            <li><strong>Had Enough Product:</strong> {event.notes?.enough_product ? "Yes" : "No"}</li>
            <li><strong>Adequately Staffed:</strong> {event.notes?.adequately_staffed ? "Yes" : "No"}</li>
            <li><strong>Continue Participation:</strong> {event.notes?.continue_participation ? "Yes" : "No"}</li>
            <li><strong>Critiques/Comments:</strong> {event.notes?.critiques}</li>
            <li><strong>Return Equipment By:</strong> {event.notes?.return_equipment_by}</li>
          </ul>
        </div>
        <div className="dp-event-actions">
          <button
            onClick={() => generatePDF(event, employees, eventAssignments)}
            className="dp-button dp-button-secondary"
          >
            Download PDF
          </button>
          <button
            onClick={() => onPostNotes && onPostNotes(event)}
            className="dp-button dp-button-secondary"
          >
            Post-Event Notes
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit && onEdit(event)}
                className="dp-button dp-button-primary"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(event)}
                className="dp-button dp-button-danger"
              >
                Delete
              </button>
            </>
          )}
          <button onClick={onClose} className="dp-button dp-button-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;