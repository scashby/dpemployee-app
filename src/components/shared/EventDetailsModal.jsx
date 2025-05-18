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
  // Get assigned employees
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{event.title || "Event Details"}</h2>
        <div className="mb-2"><strong>Date:</strong> {formatDate(event.date)}</div>
        <div className="mb-2"><strong>Setup Time:</strong> {event.setup_time || "Not specified"}</div>
        <div className="mb-2"><strong>Duration:</strong> {event.duration || event.time || "Not specified"}</div>
        <div className="mb-2"><strong>Contact:</strong> {event.contact_name ? `${event.contact_name} (${event.contact_phone || 'No phone'})` : "Not specified"}</div>
        <div className="mb-2"><strong>Staff Attending:</strong> {assignedEmployees || "Not assigned"}</div>
        <div className="mb-2"><strong>Expected Attendees:</strong> {event.expected_attendees || "Unknown"}</div>
        <div className="mb-2"><strong>Location:</strong> <span className={`dp-badge ${event.off_prem ? 'dp-badge-active' : 'dp-badge-inactive'}`}>{event.off_prem ? "Off-premise" : "On-premise"}</span></div>
        <div className="mb-2"><strong>Type:</strong> {event.event_type === 'other' ? event.event_type_other : 
          event.event_type === 'tasting' ? 'Tasting' :
          event.event_type === 'pint_night' ? 'Pint Night' :
          event.event_type === 'beer_fest' ? 'Beer Fest' : 'Other'}
        </div>
        {event.event_instructions && (
          <div className="mb-2">
            <strong>Instructions:</strong>
            <div>{event.event_instructions}</div>
          </div>
        )}

        <div className="mb-4">
          <h4 className="font-semibold">Supplies</h4>
          {event.supplies && Object.keys(event.supplies).length > 0 ? (
            <ul className="dp-event-supplies-list">
              {event.supplies.table_needed && <li>Table</li>}
              {event.supplies.beer_buckets && <li>Beer buckets</li>}
              {event.supplies.table_cloth && <li>Table cloth</li>}
              {event.supplies.tent_weights && <li>Tent/weights</li>}
              {event.supplies.signage && <li>Signage</li>}
              {event.supplies.ice && <li>Ice</li>}
              {event.supplies.jockey_box && <li>Jockey box</li>}
              {event.supplies.cups && <li>Cups</li>}
              {event.supplies.additional_supplies && (
                <li>Additional: {event.supplies.additional_supplies}</li>
              )}
            </ul>
          ) : (
            <p>No supplies specified</p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-semibold">Beer Products</h4>
          {event.beers && event.beers.length > 0 ? (
            <table className="dp-event-beers-table">
              <thead>
                <tr>
                  <th>Beer Style</th>
                  <th>Packaging</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {event.beers.map((beer, index) => (
                  <tr key={index}>
                    <td>{beer.beer_style}</td>
                    <td>{beer.packaging}</td>
                    <td>{beer.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No beer products specified</p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-semibold">Assigned Employees</h4>
          <div className="dp-employee-list">
            {eventAssignments[event.id] && eventAssignments[event.id].length > 0 ? (
              <ul>
                {(eventAssignments[event.id] || []).map(empId => {
                  const emp = employees.find(e => e.id === empId);
                  return emp ? (
                    <li key={empId} className="dp-employee-item">{emp.name}</li>
                  ) : null;
                })}
              </ul>
            ) : (
              <span className="dp-no-employees">No employees assigned</span>
            )}
          </div>
        </div>

        <div className="dp-event-actions flex gap-2 mt-4">
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