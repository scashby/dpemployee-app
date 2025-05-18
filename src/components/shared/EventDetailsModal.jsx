import React from "react";
import { generatePDF } from "../../services/generatePDF";

const EventDetailsModal = ({
  event,
  isAdmin,
  onClose,
  employees = [],
  eventAssignments = {},
}) => {
  // Helper to display Yes/No for booleans
  const yesNo = (val) => (val ? "Yes" : "No");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{event.title || "Event Details"}</h2>
        <div className="mb-2"><strong>Date:</strong> {event.date}</div>
        <div className="mb-2"><strong>Setup Time:</strong> {event.setup_time || "—"}</div>
        <div className="mb-2"><strong>Event Time:</strong> {event.duration || event.time || "—"}</div>
        <div className="mb-2"><strong>Location:</strong> {event.location || (event.off_prem ? "Off-premise" : "On-premise")}</div>
        <div className="mb-2"><strong>Contact Name:</strong> {event.contact_name || "—"}</div>
        <div className="mb-2"><strong>Contact Phone:</strong> {event.contact_phone || "—"}</div>
        <div className="mb-2"><strong>Expected Attendees:</strong> {event.expected_attendees || "—"}</div>
        <div className="mb-2"><strong>Type:</strong> {event.event_type === "other" ? event.event_type_other : event.event_type}</div>
        <div className="mb-2"><strong>Info:</strong> {event.info || "—"}</div>
        <div className="mb-2"><strong>Event Instructions:</strong> <div className="whitespace-pre-line">{event.event_instructions || "—"}</div></div>
        <div className="mb-2"><strong>Staff:</strong> {event.assignedStaff && event.assignedStaff.length > 0 ? event.assignedStaff.join(", ") : "Open Spots"}</div>
        <div className="mb-2">
          <strong>Supplies Needed:</strong>
          <ul className="list-disc list-inside">
            {event.supplies &&
              Object.entries(event.supplies)
                .filter(([key, value]) => value === true)
                .map(([key]) => (
                  <li key={key}>{key.replace(/_/g, " ")}</li>
                ))}
            {event.supplies && event.supplies.additional_supplies && (
              <li>
                Additional: {event.supplies.additional_supplies}
              </li>
            )}
          </ul>
        </div>
        <div className="mb-2">
          <strong>Beer Products:</strong>
          <ul className="list-disc list-inside">
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
        <div className="mb-2">
          <strong>Post-Event Notes:</strong>
          <div>
            {event.notes && Object.keys(event.notes).length > 0 ? (
              <ul className="list-disc list-inside">
                <li><strong>Estimated Attendees:</strong> {event.notes.estimated_attendees || "—"}</li>
                <li><strong>Favorite Beer:</strong> {event.notes.favorite_beer || "—"}</li>
                <li><strong>Had Enough Product:</strong> {yesNo(event.notes.enough_product)}</li>
                <li><strong>Adequately Staffed:</strong> {yesNo(event.notes.adequately_staffed)}</li>
                <li><strong>Continue Participation:</strong> {yesNo(event.notes.continue_participation)}</li>
                <li><strong>Critiques/Comments:</strong> {event.notes.critiques || "—"}</li>
                <li><strong>Return Equipment By:</strong> {event.notes.return_equipment_by || "—"}</li>
              </ul>
            ) : (
              <span>No notes yet.</span>
            )}
          </div>
        </div>
        {/* Employee actions */}
        <div className="mt-4 flex flex-col gap-2">
          {event.openSpots > 0 && (
            <button className="bg-gold text-white px-4 py-2 rounded shadow hover:bg-yellow-600">
              Pick Up Shift
            </button>
          )}
          <button className="bg-gray-200 px-4 py-2 rounded shadow hover:bg-gray-300">
            Post Event Notes
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-center"
            onClick={() => generatePDF(event, employees, eventAssignments)}
          >
            Download Event Form
          </button>
        </div>
        {/* Admin actions */}
        {isAdmin && (
          <div className="mt-4 flex gap-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Edit
            </button>
            <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailsModal;