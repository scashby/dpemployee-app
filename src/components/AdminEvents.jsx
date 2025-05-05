import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', info: '', on_premise: true });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (!error) setEvents(data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addEvent = async () => {
    const { data, error } = await supabase.from('events').insert([newEvent]);
    if (!error) {
      setNewEvent({ title: '', date: '', time: '', info: '', on_premise: true });
      fetchEvents();
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Edit/Add Events</h2>
      <input name="title" value={newEvent.title} onChange={handleChange} placeholder="Title" className="border p-1 mr-2" />
      <input name="date" value={newEvent.date} onChange={handleChange} placeholder="YYYY-MM-DD" className="border p-1 mr-2" />
      <input name="time" value={newEvent.time} onChange={handleChange} placeholder="Time" className="border p-1 mr-2" />
      <input name="info" value={newEvent.info} onChange={handleChange} placeholder="Info" className="border p-1 mr-2" />
      <label>
        <input type="checkbox" name="on_premise" checked={newEvent.on_premise} onChange={handleChange} />
        On-Premise
      </label>
      <button onClick={addEvent} className="bg-green-600 text-white px-3 py-1 ml-2">Add</button>
      <ul className="mt-4">
        {events.map(event => (
          <li key={event.id}>{event.title} – {event.date} – {event.on_premise ? 'On-Premise' : 'Off-Premise'}</li>
        ))}
      </ul>
    </div>
  );
};

export default AdminEvents;