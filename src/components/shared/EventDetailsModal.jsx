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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{event.title || "Event Details"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <div><strong>Date:</strong> {event.date}</div>
          <div><strong>Setup Time:</strong> {event.setup_time}</div>
          <div><strong>Duration:</strong> {event.duration || event.time}</div>
          <div><strong>Contact Name:</strong> {event.contact_name}</div>
          <div><strong>Contact Phone:</strong> {event.contact_phone}</div>
          <div><strong>Expected Attendees:</strong> {event.expected_attendees}</div>
          <div><strong>Location:</strong> {event.off_prem ? "Off-premise" : "On-premise"}</div>
          <div><strong>Type:</strong> {event.event_type === "other" ? event.event_type_other : event.event_type}</div>
        </div>
        <div className="mb-4"><strong>Info:</strong> {event.info}</div>
        <div className="mb-4"><strong>Event Instructions:</strong> {event.event_instructions}</div>
        <div className="mb-4"><strong>Staff Attending:</strong> {assignedEmployees}</div>
        <div className="mb-4">
          <strong>Supplies Needed:</strong>
          <ul className="list-disc list-inside ml-4">
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
        <div className="mb-4">
          <strong>Beer Products:</strong>
          <ul className="list-disc list-inside ml-4">
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
        <div className="mb-4">
          <strong>Post-Event Notes:</strong>
          <ul className="list-disc list-inside ml-4">
            <li><strong>Estimated Attendees:</strong> {event.notes?.estimated_attendees}</li>
            <li><strong>Favorite Beer:</strong> {event.notes?.favorite_beer}</li>
            <li><strong>Had Enough Product:</strong> {event.notes?.enough_product ? "Yes" : "No"}</li>
            <li><strong>Adequately Staffed:</strong> {event.notes?.adequately_staffed ? "Yes" : "No"}</li>
            <li><strong>Continue Participation:</strong> {event.notes?.continue_participation ? "Yes" : "No"}</li>
            <li><strong>Critiques/Comments:</strong> {event.notes?.critiques}</li>
            <li><strong>Return Equipment By:</strong> {event.notes?.return_equipment_by}</li>
          </ul>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mt-6">
          <button
            onClick={() => generatePDF(event, employees, eventAssignments)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Download PDF
          </button>
          <button
            onClick={() => onPostNotes && onPostNotes(event)}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300"
          >
            Post-Event Notes
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit && onEdit(event)}
                className="bg-yellow-600 text-white px-4 py-2 rounded shadow hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(event)}
                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;