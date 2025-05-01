import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { supabase } from '../supabase/supabaseClient';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';

const localizer = momentLocalizer(moment);

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from('events').select('*');
      if (data) {
        const formatted = data.map(event => ({
          title: `${event.title} (${event.location})`,
          start: new Date(event.date),
          end: new Date(event.date),
          allDay: true,
        }));
        setEvents(formatted);
      } else {
        console.error(error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Events Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default EventsCalendar;
