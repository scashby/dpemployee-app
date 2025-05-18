import React from "react";

const EventCard = ({ event, isAdmin, onClick }) => {
  return (
    <div
      className="bg-white rounded shadow p-4 cursor-pointer hover:ring-2 hover:ring-gold transition"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg">{event.title}</span>
        <span className="text-sm text-gray-500">{event.date}</span>
      </div>
      <div className="mb-2">
        <span className="font-semibold">{event.duration || event.time || "Time TBD"}</span>
      </div>
      <div className="mb-2">
        <span className={`inline-block px-2 py-1 rounded text-xs ${event.off_prem ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"}`}>
          {event.off_prem ? "Off-premise" : "On-premise"}
        </span>
      </div>
      <div className="mb-2">
        <span className="font-semibold">Staff: </span>
        {event.assignedStaff && event.assignedStaff.length > 0
          ? event.assignedStaff.join(", ")
          : <span className="text-red-600">Open Spots: {event.openSpots}</span>
        }
      </div>
      <div className="mb-2">
        <span className="font-semibold">Type: </span>
        {event.event_type === "other"
          ? event.event_type_other
          : event.event_type === "tasting"
          ? "Tasting"
          : event.event_type === "pint_night"
          ? "Pint Night"
          : event.event_type === "beer_fest"
          ? "Beer Fest"
          : "Other"}
      </div>
      {isAdmin && (
        <div className="mt-2 text-xs text-gray-400">Admin controls available</div>
      )}
    </div>
  );
};

export default EventCard;