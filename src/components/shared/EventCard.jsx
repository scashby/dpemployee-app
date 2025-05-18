import React from "react";

const EventCard = ({ event, isAdmin, onClick }) => {
  const openSpots = event.staffNeeded - (event.assignedStaff?.length || 0);

  return (
    <div
      className="bg-white rounded shadow p-4 cursor-pointer hover:ring-2 hover:ring-gold transition"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg">{event.date}</span>
        <span className="text-sm text-gray-500">{event.time}</span>
      </div>
      <div className="mb-2">
        <span className="font-semibold">{event.location}</span>
      </div>
      <div>
        {event.assignedStaff && event.assignedStaff.length > 0 ? (
          <div>
            <span className="text-sm text-gray-700">Staff: </span>
            {event.assignedStaff.join(", ")}
          </div>
        ) : (
          <span className="text-sm text-red-600">Open Spots: {openSpots}</span>
        )}
      </div>
      {isAdmin && (
        <div className="mt-2 text-xs text-gray-400">Admin controls available</div>
      )}
    </div>
  );
};

export default EventCard;