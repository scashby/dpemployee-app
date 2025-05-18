import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date');
        if (eventsError) throw eventsError;

        // Fetch assignments, supplies, beers, notes, employees
        const [
          assignmentsResponse,
          suppliesResponse,
          beersResponse,
          notesResponse,
          employeesResponse
        ] = await Promise.all([
          supabase.from('event_assignments').select('*'),
          supabase.from('event_supplies').select('*'),
          supabase.from('event_beers').select('*'),
          supabase.from('event_post_notes').select('*'),
          supabase.from('employees').select('id, name')
        ]);
        if (assignmentsResponse.error) throw assignmentsResponse.error;
        if (suppliesResponse.error) throw suppliesResponse.error;
        if (beersResponse.error) throw beersResponse.error;
        if (notesResponse.error) throw notesResponse.error;
        if (employeesResponse.error) throw employeesResponse.error;

        // Group assignments by event_id
        const assignmentsByEvent = {};
        assignmentsResponse.data.forEach(a => {
          if (!assignmentsByEvent[a.event_id]) assignmentsByEvent[a.event_id] = [];
          assignmentsByEvent[a.event_id].push(a.employee_id);
        });

        // Group supplies, beers, notes by event_id
        const suppliesByEvent = {};
        suppliesResponse.data.forEach(s => { suppliesByEvent[s.event_id] = s; });
        const beersByEvent = {};
        beersResponse.data.forEach(b => {
          if (!beersByEvent[b.event_id]) beersByEvent[b.event_id] = [];
          beersByEvent[b.event_id].push(b);
        });
        const notesByEvent = {};
        notesResponse.data.forEach(n => { notesByEvent[n.event_id] = n; });

        // Combine all data into enriched events
        const enrichedEvents = eventsData.map(event => ({
          ...event,
          supplies: suppliesByEvent[event.id] || {},
          beers: beersByEvent[event.id] || [],
          notes: notesByEvent[event.id] || {},
          assignedStaff: (assignmentsByEvent[event.id] || []).map(empId =>
            employeesResponse.data.find(e => e.id === empId)?.name || "Unknown"
          ),
          openSpots: event.staff_needed
            ? Math.max(0, event.staff_needed - (assignmentsByEvent[event.id]?.length || 0))
            : 0,
        }));

        setEvents(enrichedEvents);
        setEmployees(employeesResponse.data || []);
        setError(null);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { events, employees, loading, error };
};

export default useEvents;