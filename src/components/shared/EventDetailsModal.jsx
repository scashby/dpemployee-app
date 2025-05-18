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
  // Build assignedEmployees string and add it to the event object
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');

  // Merge assignedEmployees into event for consistent access
  const eventWithAssigned = { ...event, assignedEmployees };

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
        <h2 className="text-2xl font-bold mb-4">{eventWithAssigned.title || "Event Details"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <div><strong>Date:</strong> {eventWithAssigned.date}</div>
          <div><strong>Setup Time:</strong> {eventWithAssigned.setup_time}</div>
          <div><strong>Duration:</strong> {eventWithAssigned.duration || eventWithAssigned.time}</div>
          <div><strong>Contact Name:</strong> {eventWithAssigned.contact_name}</div>
          <div><strong>Contact Phone:</strong> {eventWithAssigned.contact_phone}</div>
          <div><strong>Expected Attendees:</strong> {eventWithAssigned.expected_attendees}</div>
          <div><strong>Location:</strong> {eventWithAssigned.off_prem ? "Off-premise" : "On-premise"}</div>
          <div><strong>Type:</strong> {eventWithAssigned.event_type === "other" ? eventWithAssigned.event_type_other : eventWithAssigned.event_type}</div>
        </div>
        <div className="mb-4"><strong>Info:</strong> {eventWithAssigned.info}</div>
        <div className="mb-4"><strong>Event Instructions:</strong> {eventWithAssigned.event_instructions}</div>
        <div className="mb-4"><strong>Staff Attending:</strong> {eventWithAssigned.assignedEmployees}</div>
        <div className="mb-4">
          <strong>Supplies Needed:</strong>
          <ul className="list-disc list-inside ml-4">
            {eventWithAssigned.supplies && eventWithAssigned.supplies.table_needed && <li>Table</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.beer_buckets && <li>Beer buckets</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.table_cloth && <li>Table cloth</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.tent_weights && <li>Tent/weights</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.signage && <li>Signage</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.ice && <li>Ice</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.jockey_box && <li>Jockey box</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.cups && <li>Cups</li>}
            {eventWithAssigned.supplies && eventWithAssigned.supplies.additional_supplies && (
              <li>Additional: {eventWithAssigned.supplies.additional_supplies}</li>
            )}
          </ul>
        </div>
        <div className="mb-4">
          <strong>Beer Products:</strong>
          <ul className="list-disc list-inside ml-4">
            {eventWithAssigned.beers && eventWithAssigned.beers.length > 0 ? (
              eventWithAssigned.beers.map((beer, idx) => (
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
            <li><strong>Estimated Attendees:</strong> {eventWithAssigned.notes?.estimated_attendees}</li>
            <li><strong>Favorite Beer:</strong> {eventWithAssigned.notes?.favorite_beer}</li>
            <li><strong>Had Enough Product:</strong> {eventWithAssigned.notes?.enough_product ? "Yes" : "No"}</li>
            <li><strong>Adequately Staffed:</strong> {eventWithAssigned.notes?.adequately_staffed ? "Yes" : "No"}</li>
            <li><strong>Continue Participation:</strong> {eventWithAssigned.notes?.continue_participation ? "Yes" : "No"}</li>
            <li><strong>Critiques/Comments:</strong> {eventWithAssigned.notes?.critiques}</li>
            <li><strong>Return Equipment By:</strong> {eventWithAssigned.notes?.return_equipment_by}</li>
          </ul>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mt-6">
          <button
            onClick={() => generatePDF(eventWithAssigned, employees, eventAssignments)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Download PDF
          </button>
          <button
            onClick={() => onPostNotes && onPostNotes(eventWithAssigned)}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300"
          >
            Post-Event Notes
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit && onEdit(eventWithAssigned)}
                className="bg-yellow-600 text-white px-4 py-2 rounded shadow hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(eventWithAssigned)}
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