import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/devils-purse.css';
import { generatePDF } from '../../services/generatePDF';

const EventDetailsModal = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [eventAssignments, setEventAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    setup_time: '',
    duration: '',
    staff_attending: '',
    contact_name: '',
    contact_phone: '',
    expected_attendees: '',
    event_type: 'other',
    event_type_other: '',
    info: '',
    event_instructions: '',
    off_prem: false,
    supplies: {
      table_needed: false,
      beer_buckets: false,
      table_cloth: false,
      tent_weights: false,
      signage: false,
      ice: false,
      jockey_box: false,
      cups: false,
      additional_supplies: ''
    },
    beers: []
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(null);
  const [openEventId, setOpenEventId] = useState(null);
  const [showPostNotes, setShowPostNotes] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventEmployees, setNewEventEmployees] = useState([]);
  const [showPrintForm, setShowPrintForm] = useState(false);

  const printEventForm = (event) => {
    setSelectedEvent(event);
    setShowPrintForm(true);
  };

  const viewPostEventNotes = (event) => {
    setSelectedEvent(event);
    setShowPostNotes(true);
  };

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Get base event data
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date');
  
      if (eventsError) throw eventsError;
      
      // Fetch all related data
      const [
        assignmentsResponse,
        suppliesResponse,
        beersResponse,
        notesResponse
      ] = await Promise.all([
        supabase.from('event_assignments').select('*'),
        supabase.from('event_supplies').select('*'),
        supabase.from('event_beers').select('*'),
        supabase.from('event_post_notes').select('*')
      ]);
      
      if (assignmentsResponse.error) throw assignmentsResponse.error;
      if (suppliesResponse.error) throw suppliesResponse.error;
      if (beersResponse.error) throw beersResponse.error;
      if (notesResponse.error) throw notesResponse.error;
      
      // Group assignments by event_id for easier lookup
      const assignmentsByEvent = {};
      if (assignmentsResponse.data && assignmentsResponse.data.length > 0) {
        assignmentsResponse.data.forEach(assignment => {
          if (!assignmentsByEvent[assignment.event_id]) {
            assignmentsByEvent[assignment.event_id] = [];
          }
          assignmentsByEvent[assignment.event_id].push(assignment.employee_id);
        });
      }
      setEventAssignments(assignmentsByEvent);
      
      // Group other data by event_id
      const suppliesByEvent = {};
      suppliesResponse.data?.forEach(supply => {
        suppliesByEvent[supply.event_id] = supply;
      });
      
      const beersByEvent = {};
      beersResponse.data?.forEach(beer => {
        if (!beersByEvent[beer.event_id]) {
          beersByEvent[beer.event_id] = [];
        }
        beersByEvent[beer.event_id].push(beer);
      });
      
      const notesByEvent = {};
      notesResponse.data?.forEach(note => {
        notesByEvent[note.event_id] = note;
      });
      
      // Combine all data
      const enrichedEvents = eventsData?.map(event => ({
        ...event,
        supplies: suppliesByEvent[event.id] || {},
        beers: beersByEvent[event.id] || [],
        notes: notesByEvent[event.id] || {}
      })) || [];
      
      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .select('*');

      if (error) throw error;
      
      // Group assignments by event_id for easier lookup
      const assignmentsByEvent = {};
      if (data && data.length > 0) {
        data.forEach(assignment => {
          if (!assignmentsByEvent[assignment.event_id]) {
            assignmentsByEvent[assignment.event_id] = [];
          }
          assignmentsByEvent[assignment.event_id].push(assignment.employee_id);
        });
      }
      
      setEventAssignments(assignmentsByEvent);
    } catch (error) {
      console.error('Error fetching event assignments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e, id, field) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (id) {
      // Editing existing event
      setEvents(
        events.map((evt) => (evt.id === id ? { ...evt, [field]: value } : evt))
      );
    } else {
      // New event form
      setNewEvent({ ...newEvent, [field]: value });
    }
  };

  const handleEmployeeSelection = (e, eventId) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    if (eventId) {
      // Update event assignments for existing event
      setEventAssignments({
        ...eventAssignments,
        [eventId]: selectedOptions
      });
    } else {
      // Store selected employees temporarily for new event
      setNewEventEmployees(selectedOptions);
    }
  };

  const handleSupplyChange = (e, id, field) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (id) {
      // Editing existing event
      setEvents(
        events.map((evt) => (evt.id === id ? {
          ...evt,
          supplies: {
            ...evt.supplies,
            [field]: value
          }
        } : evt))
      );
    } else {
      // New event form
      setNewEvent({
        ...newEvent,
        supplies: {
          ...newEvent.supplies,
          [field]: value
        }
      });
    }
  };

  const handleBeerChange = (e, id, index, field) => {
    const value = field === 'quantity' ? parseInt(e.target.value, 10) || 1 : e.target.value;
    
    if (id) {
      // Editing existing event
      const updatedEvent = events.find(evt => evt.id === id);
      const updatedBeers = [...updatedEvent.beers];
      updatedBeers[index] = { ...updatedBeers[index], [field]: value };
      
      setEvents(
        events.map((evt) => (evt.id === id ? {
          ...evt,
          beers: updatedBeers
        } : evt))
      );
    } else {
      // New event form
      const updatedBeers = [...newEvent.beers];
      updatedBeers[index] = { ...updatedBeers[index], [field]: value };
      
      setNewEvent({
        ...newEvent,
        beers: updatedBeers
      });
    }
  };

  const addBeer = (id) => {
    const newBeer = {
      beer_style: '',
      packaging: '',
      quantity: 1
    };
    
    if (id) {
      // Editing existing event
      const updatedEvent = events.find(evt => evt.id === id);
      const updatedBeers = [...(updatedEvent.beers || []), newBeer];
      
      setEvents(
        events.map((evt) => (evt.id === id ? {
          ...evt,
          beers: updatedBeers
        } : evt))
      );
    } else {
      // New event form
      setNewEvent({
        ...newEvent,
        beers: [...newEvent.beers, newBeer]
      });
    }
  };

  const removeBeer = (id, index) => {
    if (id) {
      // Editing existing event
      const updatedEvent = events.find(evt => evt.id === id);
      const updatedBeers = [...updatedEvent.beers];
      updatedBeers.splice(index, 1);
      
      setEvents(
        events.map((evt) => (evt.id === id ? {
          ...evt,
          beers: updatedBeers
        } : evt))
      );
    } else {
      // New event form
      const updatedBeers = [...newEvent.beers];
      updatedBeers.splice(index, 1);
      
      setNewEvent({
        ...newEvent,
        beers: updatedBeers
      });
    }
  };

  const saveEventChanges = async (id) => {
    try {
      const eventToUpdate = events.find(evt => evt.id === id);
      console.log('saveEventChanges called with ID:', id);
      console.log('Found event to update:', eventToUpdate);
      // Update event details
      const { error } = await supabase
      .from('events')
      .update({
        title: eventToUpdate.title,
        date: eventToUpdate.date,
        time: eventToUpdate.time,
        setup_time: eventToUpdate.setup_time,
        duration: eventToUpdate.duration,
        contact_name: eventToUpdate.contact_name,
        contact_phone: eventToUpdate.contact_phone,
        expected_attendees: eventToUpdate.expected_attendees,
        event_type: eventToUpdate.event_type,
        event_type_other: eventToUpdate.event_type_other,
        event_instructions: eventToUpdate.event_instructions || eventToUpdate.info || '',
        info: null, // Set info to null to avoid duplication
        off_prem: eventToUpdate.off_prem
      })
      .eq('id', id);

      if (error) throw error;
      
      // Try a different approach for event supplies
      if (eventToUpdate.supplies) {
        // First check if supplies record exists
        const { data: existingSupplies } = await supabase
          .from('event_supplies')
          .select('*')
          .eq('event_id', id)
          .single();
        
        console.log('Existing supplies:', existingSupplies);
        
        if (existingSupplies) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('event_supplies')
            .update({
              table_needed: eventToUpdate.supplies.table_needed || false,
              beer_buckets: eventToUpdate.supplies.beer_buckets || false,
              table_cloth: eventToUpdate.supplies.table_cloth || false,
              tent_weights: eventToUpdate.supplies.tent_weights || false,
              signage: eventToUpdate.supplies.signage || false,
              ice: eventToUpdate.supplies.ice || false,
              jockey_box: eventToUpdate.supplies.jockey_box || false,
              cups: eventToUpdate.supplies.cups || false,
              additional_supplies: eventToUpdate.supplies.additional_supplies || ''
            })
            .eq('event_id', id);
          
          if (updateError) {
            console.error('Error updating supplies:', updateError);
            throw updateError;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('event_supplies')
            .insert([{
              event_id: id,
              table_needed: eventToUpdate.supplies.table_needed || false,
              beer_buckets: eventToUpdate.supplies.beer_buckets || false,
              table_cloth: eventToUpdate.supplies.table_cloth || false,
              tent_weights: eventToUpdate.supplies.tent_weights || false,
              signage: eventToUpdate.supplies.signage || false,
              ice: eventToUpdate.supplies.ice || false,
              jockey_box: eventToUpdate.supplies.jockey_box || false,
              cups: eventToUpdate.supplies.cups || false,
              additional_supplies: eventToUpdate.supplies.additional_supplies || ''
            }]);
          
          if (insertError) {
            console.error('Error inserting supplies:', insertError);
            throw insertError;
          }
        }
      }
      
      // Update beer products - first delete existing ones
      if (eventToUpdate.beers && eventToUpdate.beers.length > 0) {
        // First delete all existing beer products for this event
        const { error: deleteBeersError } = await supabase
          .from('event_beers')
          .delete()
          .eq('event_id', id);
          
        if (deleteBeersError) throw deleteBeersError;
        
        // Then insert the updated beer products
        const beersToInsert = eventToUpdate.beers
          .filter(beer => beer.beer_style && beer.beer_style.trim() !== '')
          .map(beer => ({
            event_id: id,
            beer_style: beer.beer_style,
            packaging: beer.packaging || '',
            quantity: beer.quantity || 1
          }));
          
        if (beersToInsert.length > 0) {
          const { error: insertBeersError } = await supabase
            .from('event_beers')
            .insert(beersToInsert);
            
          if (insertBeersError) throw insertBeersError;
        }
      }
      
      // Get current assignments for this event
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('event_assignments')
        .select('*')
        .eq('event_id', id);
      
      if (fetchError) throw fetchError;
      
      // Get the employee IDs that are currently assigned
      const currentEmployeeIds = currentAssignments.map(a => a.employee_id);
      
      // Get the new employee IDs from the state
      const newEmployeeIds = eventAssignments[id] || [];
      
      // Employees to add (in new but not in current)
      const employeesToAdd = newEmployeeIds.filter(empId => !currentEmployeeIds.includes(empId));
      
      // Employees to remove (in current but not in new)
      const employeesToRemove = currentEmployeeIds.filter(empId => !newEmployeeIds.includes(empId));
      
      // Add new assignments
      if (employeesToAdd.length > 0) {
        const assignmentsToAdd = employeesToAdd.map(empId => ({
          event_id: id,
          employee_id: empId
        }));
        
        const { error: insertError } = await supabase
          .from('event_assignments')
          .insert(assignmentsToAdd);
        
        if (insertError) throw insertError;
      }
      
      // Remove assignments that are no longer needed
      if (employeesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('event_assignments')
          .delete()
          .eq('event_id', id)
          .in('employee_id', employeesToRemove);
        
        if (deleteError) throw deleteError;
      }
      
      setSuccessMessage('Event updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditMode(null);
      
      // Refresh events to get updated data
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      setError(`Failed to update event: ${error.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const addEvent = async (e) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date) {
      setError('Title and date are required fields.');
      setTimeout(() => setError(''), 3000);
      return;
    }
  
    try {
      // First, insert the new event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          setup_time: newEvent.setup_time,
          duration: newEvent.duration,
          contact_name: newEvent.contact_name,
          contact_phone: newEvent.contact_phone,
          expected_attendees: newEvent.expected_attendees ? parseInt(newEvent.expected_attendees) : null,
          event_type: newEvent.event_type,
          event_type_other: newEvent.event_type === 'other' ? newEvent.event_type_other : null,
          info: newEvent.info,
          event_instructions: newEvent.event_instructions,
          off_prem: newEvent.off_prem
        }])
        .select();
  
      if (eventError) throw eventError;
      
      const newEventId = eventData[0].id;
      
      // Insert supplies
      const { error: suppliesError } = await supabase
        .from('event_supplies')
        .insert([{
          event_id: newEventId,
          table_needed: newEvent.supplies.table_needed,
          beer_buckets: newEvent.supplies.beer_buckets,
          table_cloth: newEvent.supplies.table_cloth,
          tent_weights: newEvent.supplies.tent_weights,
          signage: newEvent.supplies.signage,
          ice: newEvent.supplies.ice,
          jockey_box: newEvent.supplies.jockey_box,
          cups: newEvent.supplies.cups,
          additional_supplies: newEvent.supplies.additional_supplies
        }]);
        
      if (suppliesError) throw suppliesError;
      
      // Insert beers if there are any
      if (newEvent.beers && newEvent.beers.length > 0) {
        const beersToInsert = newEvent.beers
          .filter(beer => beer.beer_style.trim() !== '') // Only insert beers with a style
          .map(beer => ({
            event_id: newEventId,
            beer_style: beer.beer_style,
            packaging: beer.packaging,
            quantity: beer.quantity
          }));
          
        if (beersToInsert.length > 0) {
          const { error: beersError } = await supabase
            .from('event_beers')
            .insert(beersToInsert);
            
          if (beersError) throw beersError;
        }
      }
      
      // Create a placeholder for post-event notes
      const { error: notesError } = await supabase
        .from('event_post_notes')
        .insert([{
          event_id: newEventId
        }]);
        
      if (notesError) throw notesError;
      
      // If employees were selected, create assignments
      if (newEventEmployees && newEventEmployees.length > 0) {
        const assignments = newEventEmployees.map(empId => ({
          event_id: newEventId,
          employee_id: empId
        }));
        
        const { error: assignmentError } = await supabase
          .from('event_assignments')
          .insert(assignments);
        
        if (assignmentError) throw assignmentError;
        
        // Update the assignments state
        setEventAssignments({
          ...eventAssignments,
          [newEventId]: newEventEmployees
        });
      }
      
      // Add the new event to the state
      setEvents([...events, eventData[0]]);
      
      // Reset form
      setNewEvent({
        title: '',
        date: '',
        time: '',
        setup_time: '',
        duration: '',
        contact_name: '',
        contact_phone: '',
        expected_attendees: '',
        event_type: 'other',
        event_type_other: '',
        info: '',
        event_instructions: '',
        off_prem: false,
        supplies: {
          table_needed: false,
          beer_buckets: false,
          table_cloth: false,
          tent_weights: false,
          signage: false,
          ice: false,
          jockey_box: false,
          cups: false,
          additional_supplies: ''
        },
        beers: []
      });
      setNewEventEmployees([]);
      
      setSuccessMessage('Event added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh events and assignments
      await fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      setError(`Failed to add event: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const savePostEventNotes = async (eventId, notes) => {
    try {
      const { error } = await supabase
        .from('event_post_notes')
        .update(notes)
        .eq('event_id', eventId);
  
      if (error) throw error;
      setSuccessMessage('Notes saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowPostNotes(false);
      await fetchEvents();
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Failed to save notes');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      // The event_assignments will be automatically deleted due to the CASCADE constraint
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the local state
      setEvents(events.filter(evt => evt.id !== id));
      
      // Remove assignments from the state
      const updatedAssignments = { ...eventAssignments };
      delete updatedAssignments[id];
      setEventAssignments(updatedAssignments);
      
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Fix timezone issues by explicitly parsing the date parts
    // This ensures the date displayed matches the date stored without timezone shifts
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="dp-loading">
        <div className="dp-loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="dp-container">
      <h2 className="dp-section-title">Manage Events</h2>
      
      {error && (
        <div className="dp-alert dp-alert-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="dp-alert dp-alert-success">
          {successMessage}
        </div>
      )}

      <div className="dp-section">
        <h3 className="dp-subsection-title">Add New Event</h3>
      </div>

      <div className="dp-section">
        <h3 className="dp-subsection-title">Event List</h3>
        <div className="dp-table-container">
          {/* Desktop view table */}
          <table className="dp-table hidden-mobile">
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="7" className="dp-empty-table">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr className="dp-table-row">
                      <td className="dp-text-center">
                        <div className="dp-button-group">
                          <button
                            onClick={() => setOpenEventId(openEventId === event.id ? null : event.id)}
                            className="dp-button dp-button-secondary dp-button-sm"
                          >
                            {openEventId === event.id ? "Hide" : "Details"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded row for event details */}
                    {openEventId === event.id && (
                      <tr className="dp-table-row dp-event-details-row">
                        <td colSpan="7">
                          <div className="dp-event-details">
                            <div className="dp-event-details-section">
                              <h4>Event Information</h4>
                            </div>
                            
                            <div className="dp-event-actions">
                              <button
                                onClick={() => generatePDF(event, employees, eventAssignments)}
                                className="dp-button dp-button-secondary dp-button-sm"
                              >
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPrintForm && selectedEvent && (
        <div className="modal-backdrop">
          <div className="modal">
            <PrintableEventForm
              event={selectedEvent}
              employees={employees}
              eventAssignments={eventAssignments}
              onClose={() => setShowPrintForm(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};

// Printable Event Form with PDF Generation
const PrintableEventForm = ({ event, employees, eventAssignments, onClose }) => {
  if (!event) return null;

  // Get assigned employees
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="dp-printable-form-container">
      <h3 className="dp-subsection-title">DPBC EVENT FORM</h3>
      
      <div className="dp-printable-form">
        <div className="dp-form-logo">
          <div className="dp-logo-placeholder">DPBC LOGO</div>
        </div>
        
        <div className="dp-form-header">
          <h4>DPBC TASTING + EVENT FORM</h4>
        </div>
        
        <div className="dp-form-main">
          <div className="dp-form-section dp-event-info">
            <div className="dp-form-row">
              <label>Event Name:</label>
              <div className="dp-form-field">{event.title}</div>
            </div>
            
            <div className="dp-form-row">
              <label>Event Date:</label>
              <div className="dp-form-field">{formatDate(event.date)}</div>
            </div>
            
            <div className="dp-form-row">
              <label>Event Set Up Time:</label>
              <div className="dp-form-field">{event.setup_time}</div>
            </div>
            
            <div className="dp-form-row">
              <label>Event Duration:</label>
              <div className="dp-form-field">{event.duration}</div>
            </div>
            
            <div className="dp-form-row">
              <label>DP Staff Attending:</label>
              <div className="dp-form-field">{assignedEmployees}</div>
            </div>
            
            <div className="dp-form-row">
              <label>Event Contact(Name, Phone):</label>
              <div className="dp-form-field">
                {event.contact_name} {event.contact_phone ? `(${event.contact_phone})` : ''}
              </div>
            </div>
            
            <div className="dp-form-row">
              <label>Expected # of Attendees:</label>
              <div className="dp-form-field">{event.expected_attendees}</div>
            </div>
          </div>
          
          <div className="dp-form-section dp-event-type">
            <label>Type of Event</label>
            <div className="dp-checkbox-row">
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.event_type === 'tasting' ? 'checked' : ''}`}></div>
                <span>Tasting</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.event_type === 'pint_night' ? 'checked' : ''}`}></div>
                <span>Pint Night</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.event_type === 'beer_fest' ? 'checked' : ''}`}></div>
                <span>Beer Fest</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.event_type === 'other' ? 'checked' : ''}`}></div>
                <span>Other: {event.event_type === 'other' ? event.event_type_other : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="dp-form-section dp-supplies-needed">
            <h5 className="dp-section-header">SUPPLIES NEEDED</h5>
            <div className="dp-supplies-grid">
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.table_needed ? 'checked' : ''}`}></div>
                <span>Table</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.table_cloth ? 'checked' : ''}`}></div>
                <span>Table Cloth</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.signage ? 'checked' : ''}`}></div>
                <span>Signage</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.jockey_box ? 'checked' : ''}`}></div>
                <span>Jockey Box</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.cups ? 'checked' : ''}`}></div>
                <span>Cups</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.beer_buckets ? 'checked' : ''}`}></div>
                <span>Beer Buckets</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.tent_weights ? 'checked' : ''}`}></div>
                <span>Tent/Weights</span>
              </div>
              
              <div className="dp-checkbox">
                <div className={`dp-checkbox-box ${event.supplies?.ice ? 'checked' : ''}`}></div>
                <span>Ice</span>
              </div>
            </div>
            
            <div className="dp-jockey-box-note">
              (jockey box supplies include co2, purge bucket, water keg, ice, toolkit)
            </div>
            
            <div className="dp-form-row">
              <label>Additional Supplies:</label>
              <div className="dp-form-field">{event.supplies?.additional_supplies}</div>
            </div>
          </div>
          
          <div className="dp-form-section dp-beer-products">
            <div className="dp-beer-table">
              <div className="dp-beer-table-header">
                <div className="dp-beer-style">Beer Style</div>
                <div className="dp-beer-pkg">Pkg</div>
                <div className="dp-beer-qty">Qty</div>
              </div>
              
              {event.beers && event.beers.length > 0 ? (
                event.beers.slice(0, 5).map((beer, index) => (
                  <div key={index} className="dp-beer-table-row">
                    <div className="dp-beer-style">{beer.beer_style}</div>
                    <div className="dp-beer-pkg">{beer.packaging}</div>
                    <div className="dp-beer-qty">{beer.quantity}</div>
                  </div>
                ))
              ) : (
                <div className="dp-beer-table-row empty-row">
                  <div className="dp-beer-style"></div>
                  <div className="dp-beer-pkg"></div>
                  <div className="dp-beer-qty"></div>
                </div>
              )}
              
              {/* Add empty rows if less than 5 beers */}
              {event.beers && event.beers.length < 5 && 
                Array(5 - event.beers.length).fill().map((_, index) => (
                  <div key={`empty-${index}`} className="dp-beer-table-row empty-row">
                    <div className="dp-beer-style"></div>
                    <div className="dp-beer-pkg"></div>
                    <div className="dp-beer-qty"></div>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div className="dp-form-section dp-instructions">
            <div className="dp-form-row">
              <label>Event Instructions:</label>
              <div className="dp-form-field dp-instructions-text">
                {event.event_instructions || event.info || ''}
              </div>
            </div>
          </div>
          
          <div className="dp-form-section dp-post-notes">
            <h5 className="dp-section-header">POST EVENT NOTES</h5>
            <div className="dp-post-notes-content">
              <div className="dp-form-row">
                <label>Estimated attendees:</label>
                <div className="dp-form-field">{event.notes?.estimated_attendees || ''}</div>
              </div>
              
              <div className="dp-form-row">
                <label>Was there a favorite style of beer offered?</label>
                <div className="dp-form-field">{event.notes?.favorite_beer || ''}</div>
              </div>
              
              <div className="dp-form-row">
                <label>Did you have enough product?</label>
                <div className="dp-checkbox">
                  <div className={`dp-checkbox-box ${event.notes?.enough_product ? 'checked' : ''}`}></div>
                </div>
              </div>
              
              <div className="dp-form-row">
                <label>Were you adequately staffed for the event/tasting?</label>
                <div className="dp-checkbox">
                  <div className={`dp-checkbox-box ${event.notes?.adequately_staffed ? 'checked' : ''}`}></div>
                </div>
              </div>
              
              <div className="dp-form-row">
                <label>Should we continue to participate in this event?</label>
                <div className="dp-checkbox">
                  <div className={`dp-checkbox-box ${event.notes?.continue_participation ? 'checked' : ''}`}></div>
                </div>
              </div>
              
              <div className="dp-form-row">
                <label>Any critiques?</label>
                <div className="dp-form-field dp-critiques">{event.notes?.critiques || ''}</div>
              </div>
            </div>
            
            <div className="dp-reminder">
              REMINDER: RETURN SUPPLIES TO THE BREWERY IN THEIR DESIGNATED AREAS
            </div>
            
            <div className="dp-form-row">
              <label>RETURN EQUIPMENT BY:</label>
              <div className="dp-form-field">{event.notes?.return_equipment_by ? formatDate(event.notes.return_equipment_by) : ''}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dp-button-group">
        <button 
          onClick={() => generatePDF(event, employees, eventAssignments)} 
          className="dp-button dp-button-primary"
        >
          Download PDF Form
        </button>
        <button onClick={onClose} className="dp-button dp-button-secondary">
          Close
        </button>
      </div>
    </div>
  );
};

export default EventDetailsModal;