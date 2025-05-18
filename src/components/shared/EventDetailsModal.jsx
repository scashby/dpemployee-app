import React from "react";

const EventDetailsModal = ({ event, isAdmin, onClose }) => {
  // Placeholder for actions: Pick Up Shift, Post Event Notes, Download PDF, Edit/Delete for admin
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2">{event.title || "Event Details"}</h2>
        <div className="mb-2">
          <strong>Date:</strong> {event.date}
        </div>
        <div className="mb-2">
          <strong>Location:</strong> {event.location}
        </div>
        <div className="mb-2">
          <strong>Time:</strong> {event.time}
        </div>
        <div className="mb-2">
          <strong>Staff:</strong>{" "}
          {event.assignedStaff && event.assignedStaff.length > 0
            ? event.assignedStaff.join(", ")
            : "Open Spots"}
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
          <a
            href={`/api/events/${event.id}/download-pdf`}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-center"
            download
          >
            Download Event Form
          </a>
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