import React, { useEffect, useState } from "react";
import EventCard from "../components/shared/EventCard";
import EventDetailsModal from "../components/shared/EventDetailsModal";
import useEvents from "../hooks/useEvents";

const Events = () => {
  const { events, loading, error } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Replace with your actual auth logic

  // Example: Replace with your real authentication context or logic
  useEffect(() => {
    // setIsAdmin(auth.user?.role === "admin");
    setIsAdmin(true); // For demo purposes
  }, []);

  if (loading) return <div className="p-4">Loading events...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading events.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Events Schedule</h1>
        {isAdmin && (
          <button
            className="bg-gold text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
            // onClick={handleAddEvent} // Implement this for admin add event
          >
            Add Event
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isAdmin={isAdmin}
            onClick={() => setSelectedEvent(event)}
          />
        ))}
      </div>
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isAdmin={isAdmin}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Events;