import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Fetch events from Supabase
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date');

        if (eventsError) throw eventsError;

        setEvents(eventsData || []);
        setError(null);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};

export default useEvents;