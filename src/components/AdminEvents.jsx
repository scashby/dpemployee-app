import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/devils-purse.css';

const AdminEvents = () => {
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
  // Add these state variables
  const [openEventId, setOpenEventId] = useState(null);
  const [showPostNotes, setShowPostNotes] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventEmployees, setNewEventEmployees] = useState([]);

  // Helper functions for the detail view
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

  // New handler functions for the form
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
  <form onSubmit={addEvent} className="dp-form">
    <div className="dp-form-row">
      <div className="dp-form-group">
        <label className="dp-form-label">
          Event Name<span className="dp-required">*</span>
        </label>
        <input
          type="text"
          value={newEvent.title}
          onChange={(e) => handleInputChange(e, null, 'title')}
          className="dp-input"
          required
        />
      </div>
      <div className="dp-form-group">
        <label className="dp-form-label">
          Event Date<span className="dp-required">*</span>
        </label>
        <input
          type="date"
          value={newEvent.date}
          onChange={(e) => handleInputChange(e, null, 'date')}
          className="dp-input"
          required
        />
      </div>
    </div>

    <div className="dp-form-row">
      <div className="dp-form-group">
        <label className="dp-form-label">
          Setup Time
        </label>
        <input
          type="time"
          value={newEvent.setup_time}
          onChange={(e) => handleInputChange(e, null, 'setup_time')}
          className="dp-input"
        />
      </div>
      <div className="dp-form-group">
        <label className="dp-form-label">
          Event Duration
        </label>
        <input
          type="text"
          value={newEvent.duration}
          placeholder="e.g. 1pm - 3:30pm"
          onChange={(e) => handleInputChange(e, null, 'duration')}
          className="dp-input"
        />
      </div>
      <div className="dp-form-group">
        <label className="dp-form-label">
          DP Staff Attending
        </label>
        <select
          multiple
          className="dp-select"
          onChange={(e) => handleEmployeeSelection(e, null)}
          value={newEventEmployees || []}
        >
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        <div className="dp-form-help">
          Hold Ctrl/Cmd to select multiple employees
        </div>
      </div>
    </div>

    <div className="dp-form-row">
      <div className="dp-form-group">
        <label className="dp-form-label">
          Contact Name
        </label>
        <input
          type="text"
          value={newEvent.contact_name}
          onChange={(e) => handleInputChange(e, null, 'contact_name')}
          className="dp-input"
        />
      </div>
      <div className="dp-form-group">
        <label className="dp-form-label">
          Contact Phone
        </label>
        <input
          type="text"
          value={newEvent.contact_phone}
          onChange={(e) => handleInputChange(e, null, 'contact_phone')}
          className="dp-input"
        />
      </div>
      <div className="dp-form-group">
        <label className="dp-form-label">
          Expected # of Attendees
        </label>
        <input
          type="number"
          value={newEvent.expected_attendees}
          onChange={(e) => handleInputChange(e, null, 'expected_attendees')}
          className="dp-input"
        />
      </div>
    </div>

    <div className="dp-form-group">
      <label className="dp-form-label">
        Type of Event
      </label>
      <div className="dp-form-row" style={{ marginBottom: "0.5rem" }}>
        <div className="dp-checkbox-container">
          <label className="dp-checkbox-label">
            <input
              type="radio"
              name="event_type"
              value="tasting"
              checked={newEvent.event_type === 'tasting'}
              onChange={(e) => handleInputChange(e, null, 'event_type')}
              className="dp-checkbox"
            />
            <span>Tasting</span>
          </label>
        </div>
        <div className="dp-checkbox-container">
          <label className="dp-checkbox-label">
            <input
              type="radio"
              name="event_type"
              value="pint_night"
              checked={newEvent.event_type === 'pint_night'}
              onChange={(e) => handleInputChange(e, null, 'event_type')}
              className="dp-checkbox"
            />
            <span>Pint Night</span>
          </label>
        </div>
        <div className="dp-checkbox-container">
          <label className="dp-checkbox-label">
            <input
              type="radio"
              name="event_type"
              value="beer_fest"
              checked={newEvent.event_type === 'beer_fest'}
              onChange={(e) => handleInputChange(e, null, 'event_type')}
              className="dp-checkbox"
            />
            <span>Beer Fest</span>
          </label>
        </div>
        <div className="dp-checkbox-container">
          <label className="dp-checkbox-label">
            <input
              type="radio"
              name="event_type"
              value="other"
              checked={newEvent.event_type === 'other'}
              onChange={(e) => handleInputChange(e, null, 'event_type')}
              className="dp-checkbox"
            />
            <span>Other</span>
          </label>
        </div>
      </div>
      {newEvent.event_type === 'other' && (
        <input
          type="text"
          value={newEvent.event_type_other}
          placeholder="Describe event type"
          onChange={(e) => handleInputChange(e, null, 'event_type_other')}
          className="dp-input"
        />
      )}
    </div>

    <div className="dp-form-group">
      <label className="dp-form-label">
        Event Instructions
      </label>
      <textarea
        value={newEvent.event_instructions}
        placeholder="Include any additional notes about the event"
        onChange={(e) => handleInputChange(e, null, 'event_instructions')}
        className="dp-textarea"
        rows="3"
      ></textarea>
    </div>

    <div className="dp-form-group">
      <label className="dp-form-label">
        Off-Premise Event
      </label>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.off_prem}
            onChange={(e) => handleInputChange(e, null, 'off_prem')}
            className="dp-checkbox"
          />
          <span>Event is held off-premise</span>
        </label>
      </div>
    </div>

    <h4 className="dp-subsection-title">Supplies Needed</h4>
    <div className="dp-form-row">
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.table_needed}
            onChange={(e) => handleSupplyChange(e, null, 'table_needed')}
            className="dp-checkbox"
          />
          <span>Table</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.beer_buckets}
            onChange={(e) => handleSupplyChange(e, null, 'beer_buckets')}
            className="dp-checkbox"
          />
          <span>Beer buckets</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.table_cloth}
            onChange={(e) => handleSupplyChange(e, null, 'table_cloth')}
            className="dp-checkbox"
          />
          <span>Table Cloth</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.tent_weights}
            onChange={(e) => handleSupplyChange(e, null, 'tent_weights')}
            className="dp-checkbox"
          />
          <span>Tent/Weights</span>
        </label>
      </div>
    </div>
    <div className="dp-form-row">
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.signage}
            onChange={(e) => handleSupplyChange(e, null, 'signage')}
            className="dp-checkbox"
          />
          <span>Signage</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.ice}
            onChange={(e) => handleSupplyChange(e, null, 'ice')}
            className="dp-checkbox"
          />
          <span>Ice</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.jockey_box}
            onChange={(e) => handleSupplyChange(e, null, 'jockey_box')}
            className="dp-checkbox"
          />
          <span>Jockey box</span>
        </label>
      </div>
      <div className="dp-checkbox-container">
        <label className="dp-checkbox-label">
          <input
            type="checkbox"
            checked={newEvent.supplies.cups}
            onChange={(e) => handleSupplyChange(e, null, 'cups')}
            className="dp-checkbox"
          />
          <span>Cups</span>
        </label>
      </div>
    </div>
    <div className="dp-form-group">
      <label className="dp-form-label">
        Additional Supplies
      </label>
      <input
        type="text"
        value={newEvent.supplies.additional_supplies}
        placeholder="e.g. Stickers, Matchbooks"
        onChange={(e) => handleSupplyChange(e, null, 'additional_supplies')}
        className="dp-input"
      />
    </div>

    <h4 className="dp-subsection-title">Beer Products</h4>
    {newEvent.beers.map((beer, index) => (
      <div key={index} className="dp-form-row">
        <div className="dp-form-group">
          <label className="dp-form-label">
            Beer Style
          </label>
          <input
            type="text"
            value={beer.beer_style}
            onChange={(e) => handleBeerChange(e, null, index, 'beer_style')}
            className="dp-input"
            placeholder="e.g. Handline Kolsch"
          />
        </div>
        <div className="dp-form-group">
          <label className="dp-form-label">
            Packaging
          </label>
          <input
            type="text"
            value={beer.packaging}
            onChange={(e) => handleBeerChange(e, null, index, 'packaging')}
            className="dp-input"
            placeholder="e.g. 16oz Case"
          />
        </div>
        <div className="dp-form-group">
          <label className="dp-form-label">
            Quantity
          </label>
          <input
            type="number"
            value={beer.quantity}
            onChange={(e) => handleBeerChange(e, null, index, 'quantity')}
            className="dp-input"
            min="1"
          />
        </div>
        <div className="dp-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => removeBeer(null, index)}
            className="dp-button dp-button-danger dp-button-sm"
          >
            Remove
          </button>
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={() => addBeer(null)}
      className="dp-button dp-button-secondary dp-button-sm mb-4"
    >
      Add Beer
    </button>
    
    <div className="dp-form-actions">
      <button
        type="submit"
        className="dp-button dp-button-primary"
      >
        Add Event
      </button>
    </div>
  </form>
</div>

<div className="dp-section">
  <h3 className="dp-subsection-title">Event List</h3>
  <div className="dp-table-container">
    <table className="dp-table">
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Date</th>
          <th>Duration</th>
          <th>Staff</th>
          <th>Location</th>
          <th>Type</th>
          <th className="dp-text-center">Actions</th>
        </tr>
      </thead>
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
                <td>
                  <span className="dp-event-title">{event.title}</span>
                </td>
                <td>
                  {formatDate(event.date)}
                </td>
                <td>
                  {event.duration || event.time || "Time TBD"}
                </td>
                <td>
                  {eventAssignments[event.id] && eventAssignments[event.id].length > 0 ? 
                    employees.find(e => e.id === eventAssignments[event.id][0])?.name + 
                    (eventAssignments[event.id].length > 1 ? ` +${eventAssignments[event.id].length - 1} more` : '')
                    : "Not assigned"
                  }
                </td>
                <td>
                  <span className={`dp-badge ${event.off_prem ? 'dp-badge-active' : 'dp-badge-inactive'}`}>
                    {event.off_prem ? "Off-premise" : "On-premise"}
                  </span>
                </td>
                <td>
                  {event.event_type === 'other' ? event.event_type_other : 
                   event.event_type === 'tasting' ? 'Tasting' :
                   event.event_type === 'pint_night' ? 'Pint Night' :
                   event.event_type === 'beer_fest' ? 'Beer Fest' : 'Other'}
                </td>
                <td className="dp-text-center">
                  <div className="dp-button-group">
                    <button
                      onClick={() => setOpenEventId(openEventId === event.id ? null : event.id)}
                      className="dp-button dp-button-secondary dp-button-sm"
                    >
                      {openEventId === event.id ? "Hide" : "Details"}
                    </button>
                    <button
                      onClick={() => setEditMode(event.id)}
                      className="dp-button dp-button-primary dp-button-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="dp-button dp-button-danger dp-button-sm"
                    >
                      Delete
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
                        <div className="dp-event-details-grid">
                          <div>
                            <strong>Date:</strong> {formatDate(event.date)}
                          </div>
                          <div>
                            <strong>Setup Time:</strong> {event.setup_time || "Not specified"}
                          </div>
                          <div>
                            <strong>Duration:</strong> {event.duration || event.time || "Not specified"}
                          </div>
                          <div>
                            <strong>Contact:</strong> {event.contact_name ? `${event.contact_name} (${event.contact_phone || 'No phone'})` : "Not specified"}
                          </div>
                          <div>
                            <strong>Staff Attending:</strong> 
                            {eventAssignments[event.id] && eventAssignments[event.id].length > 0 ? 
                              eventAssignments[event.id].map(empId => 
                                employees.find(e => e.id === empId)?.name).filter(Boolean).join(', ')
                              : "Not assigned"
                            }
                          </div>
                          <div>
                            <strong>Expected Attendees:</strong> {event.expected_attendees || "Unknown"}
                          </div>
                        </div>
                        {event.event_instructions && (
                          <div className="dp-event-details-instructions">
                            <strong>Instructions:</strong>
                            <p>{event.event_instructions}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="dp-event-details-columns">
                        <div className="dp-event-details-section">
                          <h4>Supplies</h4>
                          {event.supplies && Object.keys(event.supplies).length > 0 ? (
                            <ul className="dp-event-supplies-list">
                              {event.supplies.table_needed && <li>Table</li>}
                              {event.supplies.beer_buckets && <li>Beer buckets</li>}
                              {event.supplies.table_cloth && <li>Table cloth</li>}
                              {event.supplies.tent_weights && <li>Tent/weights</li>}
                              {event.supplies.signage && <li>Signage</li>}
                              {event.supplies.ice && <li>Ice</li>}
                              {event.supplies.jockey_box && <li>Jockey box</li>}
                              {event.supplies.cups && <li>Cups</li>}
                              {event.supplies.additional_supplies && (
                                <li>Additional: {event.supplies.additional_supplies}</li>
                              )}
                            </ul>
                          ) : (
                            <p>No supplies specified</p>
                          )}
                        </div>
                        
                        <div className="dp-event-details-section">
                          <h4>Beer Products</h4>
                          {event.beers && event.beers.length > 0 ? (
                            <table className="dp-event-beers-table">
                              <thead>
                                <tr>
                                  <th>Beer Style</th>
                                  <th>Packaging</th>
                                  <th>Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.beers.map((beer, index) => (
                                  <tr key={index}>
                                    <td>{beer.beer_style}</td>
                                    <td>{beer.packaging}</td>
                                    <td>{beer.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No beer products specified</p>
                          )}
                        </div>
                        
                        <div className="dp-event-details-section">
                          <h4>Assigned Employees</h4>
                          <div className="dp-employee-list">
                            {eventAssignments[event.id] && eventAssignments[event.id].length > 0 ? (
                              <ul>
                                {(eventAssignments[event.id] || []).map(empId => {
                                  const emp = employees.find(e => e.id === empId);
                                  return emp ? (
                                    <li key={empId} className="dp-employee-item">{emp.name}</li>
                                  ) : null;
                                })}
                              </ul>
                            ) : (
                              <span className="dp-no-employees">No employees assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="dp-event-actions">
                        <button
                          onClick={() => printEventForm(event)}
                          className="dp-button dp-button-secondary"
                        >
                          Print Event Form
                        </button>
                        <button
                          onClick={() => viewPostEventNotes(event)}
                          className="dp-button dp-button-secondary"
                        >
                          Post-Event Notes
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Edit form row */}
              {editMode === event.id && (
                <tr className="dp-table-row dp-event-edit-row">
                  <td colSpan="7">
                    <div className="dp-event-edit-form">
                      <h4>Edit Event</h4>
                      <div className="dp-form-row">
                        <div className="dp-form-group">
                          <label className="dp-form-label">Event Name</label>
                          <input
                            type="text"
                            value={event.title || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'title')}
                            className="dp-input"
                          />
                        </div>
                        <div className="dp-form-group">
                          <label className="dp-form-label">Date</label>
                          <input
                            type="date"
                            value={event.date || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'date')}
                            className="dp-input"
                          />
                        </div>
                      </div>

                      <div className="dp-form-row">
                        <div className="dp-form-group">
                          <label className="dp-form-label">Setup Time</label>
                          <input
                            type="time"
                            value={event.setup_time || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'setup_time')}
                            className="dp-input"
                          />
                        </div>
                        <div className="dp-form-group">
                          <label className="dp-form-label">Duration</label>
                          <input
                            type="text"
                            value={event.duration || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'duration')}
                            className="dp-input"
                          />
                        </div>
                        <div className="dp-form-group">
                          <label className="dp-form-label">Staff Attending</label>
                          <select
                            multiple
                            className="dp-select"
                            onChange={(e) => handleEmployeeSelection(e, event.id)}
                            value={eventAssignments[event.id] || []}
                          >
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                          <div className="dp-form-help">
                            Hold Ctrl/Cmd to select multiple employees
                          </div>
                        </div>
                      </div>

                      <div className="dp-form-row">
                        <div className="dp-form-group">
                          <label className="dp-form-label">Contact Name</label>
                          <input
                            type="text"
                            value={event.contact_name || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'contact_name')}
                            className="dp-input"
                          />
                        </div>
                        <div className="dp-form-group">
                          <label className="dp-form-label">Contact Phone</label>
                          <input
                            type="text"
                            value={event.contact_phone || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'contact_phone')}
                            className="dp-input"
                          />
                        </div>
                        <div className="dp-form-group">
                          <label className="dp-form-label">Expected Attendees</label>
                          <input
                            type="number"
                            value={event.expected_attendees || ''}
                            onChange={(e) => handleInputChange(e, event.id, 'expected_attendees')}
                            className="dp-input"
                          />
                        </div>
                      </div>

                      <div className="dp-form-group">
                        <label className="dp-form-label">Type of Event</label>
                        <div className="dp-form-row" style={{ marginBottom: "0.5rem" }}>
                          <div className="dp-checkbox-container">
                            <label className="dp-checkbox-label">
                              <input
                                type="radio"
                                name={`event_type_${event.id}`}
                                value="tasting"
                                checked={event.event_type === 'tasting'}
                                onChange={(e) => handleInputChange(e, event.id, 'event_type')}
                                className="dp-checkbox"
                              />
                              <span>Tasting</span>
                            </label>
                          </div>
                          <div className="dp-checkbox-container">
                            <label className="dp-checkbox-label">
                              <input
                                type="radio"
                                name={`event_type_${event.id}`}
                                value="pint_night"
                                checked={event.event_type === 'pint_night'}
                                onChange={(e) => handleInputChange(e, event.id, 'event_type')}
                                className="dp-checkbox"
                              />
                              <span>Pint Night</span>
                            </label>
                          </div>
                          <div className="dp-checkbox-container">
                            <label className="dp-checkbox-label">
                              <input
                                type="radio"
                                name={`event_type_${event.id}`}
                                value="beer_fest"
                                checked={event.event_type === 'beer_fest'}
                                onChange={(e) => handleInputChange(e, event.id, 'event_type')}
                                className="dp-checkbox"
                              />
                              <span>Beer Fest</span>
                            </label>
                          </div>
                          <div className="dp-checkbox-container">
                            <label className="dp-checkbox-label">
                              <input
                                type="radio"
                                name={`event_type_${event.id}`}
                                value="other"
                                checked={event.event_type === 'other'}
                                onChange={(e) => handleInputChange(e, event.id, 'event_type')}
                                className="dp-checkbox"
                              />
                              <span>Other</span>
                            </label>
                          </div>
                        </div>
                        {event.event_type === 'other' && (
                          <input
                            type="text"
                            value={event.event_type_other || ''}
                            placeholder="Describe event type"
                            onChange={(e) => handleInputChange(e, event.id, 'event_type_other')}
                            className="dp-input"
                          />
                        )}
                      </div>

                      <div className="dp-form-group">
                        <label className="dp-form-label">Event Instructions</label>
                        <textarea
                          value={event.event_instructions || event.info || ''}
                          onChange={(e) => handleInputChange(e, event.id, 'event_instructions')}
                          className="dp-textarea"
                          rows="3"
                        ></textarea>
                      </div>

                      <div className="dp-form-group">
                        <label className="dp-form-label">Off-Premise Event</label>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.off_prem || false}
                              onChange={(e) => handleInputChange(e, event.id, 'off_prem')}
                              className="dp-checkbox"
                            />
                            <span>Event is held off-premise</span>
                          </label>
                        </div>
                      </div>

                      <h4>Supplies Needed</h4>
                      <div className="dp-form-row">
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.table_needed || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'table_needed')}
                              className="dp-checkbox"
                            />
                            <span>Table</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.beer_buckets || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'beer_buckets')}
                              className="dp-checkbox"
                            />
                            <span>Beer buckets</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.table_cloth || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'table_cloth')}
                              className="dp-checkbox"
                            />
                            <span>Table Cloth</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.tent_weights || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'tent_weights')}
                              className="dp-checkbox"
                            />
                            <span>Tent/Weights</span>
                          </label>
                        </div>
                      </div>
                      <div className="dp-form-row">
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.signage || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'signage')}
                              className="dp-checkbox"
                            />
                            <span>Signage</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.ice || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'ice')}
                              className="dp-checkbox"
                            />
                            <span>Ice</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.jockey_box || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'jockey_box')}
                              className="dp-checkbox"
                            />
                            <span>Jockey box</span>
                          </label>
                        </div>
                        <div className="dp-checkbox-container">
                          <label className="dp-checkbox-label">
                            <input
                              type="checkbox"
                              checked={event.supplies?.cups || false}
                              onChange={(e) => handleSupplyChange(e, event.id, 'cups')}
                              className="dp-checkbox"
                            />
                            <span>Cups</span>
                          </label>
                        </div>
                      </div>
                      <div className="dp-form-group">
                        <label className="dp-form-label">Additional Supplies</label>
                        <input
                          type="text"
                          value={event.supplies?.additional_supplies || ''}
                          onChange={(e) => handleSupplyChange(e, event.id, 'additional_supplies')}
                          className="dp-input"
                        />
                      </div>

                      <h4>Beer Products</h4>
                      {event.beers && event.beers.map((beer, index) => (
                        <div key={index} className="dp-form-row">
                          <div className="dp-form-group">
                            <label className="dp-form-label">Beer Style</label>
                            <input
                              type="text"
                              value={beer.beer_style || ''}
                              onChange={(e) => handleBeerChange(e, event.id, index, 'beer_style')}
                              className="dp-input"
                            />
                          </div>
                          <div className="dp-form-group">
                            <label className="dp-form-label">Packaging</label>
                            <input
                              type="text"
                              value={beer.packaging || ''}
                              onChange={(e) => handleBeerChange(e, event.id, index, 'packaging')}
                              className="dp-input"
                            />
                          </div>
                          <div className="dp-form-group">
                            <label className="dp-form-label">Quantity</label>
                            <input
                              type="number"
                              value={beer.quantity || 1}
                              onChange={(e) => handleBeerChange(e, event.id, index, 'quantity')}
                              className="dp-input"
                              min="1"
                            />
                          </div>
                          <div className="dp-form-group" style={{display: 'flex', alignItems: 'flex-end'}}>
                            <button
                              type="button"
                              onClick={() => removeBeer(event.id, index)}
                              className="dp-button dp-button-danger dp-button-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBeer(event.id)}
                        className="dp-button dp-button-secondary dp-button-sm mb-4"
                      >
                        Add Beer
                      </button>

                      <div className="dp-button-group">
                        <button
                          onClick={() => saveEventChanges(event.id)}
                          className="dp-button dp-button-success"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="dp-button dp-button-secondary"
                        >
                          Cancel
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

{showPostNotes && selectedEvent && (
  <div className="modal-backdrop">
    <div className="modal">
      <PostEventNotesModal
        event={selectedEvent}
        onClose={() => setShowPostNotes(false)}
        onSave={savePostEventNotes}
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
  });

  const generatePDF = async () => {
    try {
      console.log("Generating exact DPBC EVENT FORM template...");
      
      // First, we need to load HTML2Canvas and jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      // Create document with exact dimensions
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });
      
      // Set the exact positioning constants
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      
      // Get template image first and draw it as base
      const getBase64Image = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = error => {
            console.error("Error loading image:", error);
            reject(error);
          };
          img.src = url;
        });
      };
      
      try {
        // Add logo
        const logoData = await getBase64Image('/logo.png');
        const logoWidth = 80;
        const logoHeight = 90;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoData, 'PNG', logoX, 40, logoWidth, logoHeight);
      } catch (logoError) {
        console.error("Error loading logo:", logoError);
      }
      
      // Add gray title bar
      const titleBarY = 150;
      doc.setFillColor(190, 190, 190);
      doc.rect(0, titleBarY, pageWidth, 30, 'F');
      
      // Add title text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DPBC TASTING + EVENT FORM', pageWidth / 2, titleBarY + 20, { align: 'center' });
      
      // Start form fields
      let currentY = titleBarY + 50;
      
      // Create form field template
      const createFormField = (label, value, y) => {
        const fieldWidth = pageWidth - 80;
        const labelWidth = 150;
        
        // Draw box
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, fieldWidth, 25, 'S');
        
        // Add label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(label, margin + 10, y + 17);
        
        // Add value
        doc.setFont('helvetica', 'normal');
        doc.text(value || '', margin + labelWidth, y + 17);
      };
      
      // Create main form fields
      createFormField('Event Name :', event.title || '', currentY);
      currentY += 30;
      
      createFormField('Event Date:', new Date(event.date).toLocaleDateString(), currentY);
      currentY += 30;
      
      createFormField('Event Set Up Time:', event.setup_time || '', currentY);
      currentY += 30;
      
      createFormField('Event Duration:', event.duration || event.time || '', currentY);
      currentY += 30;
      
      createFormField('DP Staff Attending:', assignedEmployees.join(', '), currentY);
      currentY += 30;
      
      createFormField('Event Contact(Name, Phone):', event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '', currentY);
      currentY += 30;
      
      createFormField('Expected # of Attendees:', event.expected_attendees?.toString() || '?', currentY);
      currentY += 40;
      
      // Type of Event section header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, pageWidth - 80, 25, 'F');
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, currentY, pageWidth - 80, 25, 'S');
      doc.setFont('helvetica', 'bold');
      doc.text('Type of Event', margin + 10, currentY + 17);
      currentY += 35;
      
      // Event type checkboxes
      const checkboxSize = 12;
      
      // First row - Tasting & Pint Night
      doc.setFont('helvetica', 'normal');
      
      // Tasting checkbox
      doc.rect(margin + 20, currentY, checkboxSize, checkboxSize, 'S');
      if (event.event_type === 'tasting') {
        doc.setFillColor(0);
        doc.rect(margin + 22, currentY + 2, 8, 8, 'F');
      }
      doc.text('Tasting:', margin + 40, currentY + 10);
      
      // Pint Night checkbox
      doc.rect(margin + 200, currentY, checkboxSize, checkboxSize, 'S');
      if (event.event_type === 'pint_night') {
        doc.setFillColor(0);
        doc.rect(margin + 202, currentY + 2, 8, 8, 'F');
      }
      doc.text('Pint Night:', margin + 220, currentY + 10);
      
      currentY += 25;
      
      // Second row - Beer Fest & Other
      doc.rect(margin + 20, currentY, checkboxSize, checkboxSize, 'S');
      if (event.event_type === 'beer_fest') {
        doc.setFillColor(0);
        doc.rect(margin + 22, currentY + 2, 8, 8, 'F');
      }
      doc.text('Beer Fest :', margin + 40, currentY + 10);
      
      doc.rect(margin + 200, currentY, checkboxSize, checkboxSize, 'S');
      if (event.event_type === 'other') {
        doc.setFillColor(0);
        doc.rect(margin + 202, currentY + 2, 8, 8, 'F');
      }
      doc.text('Other :', margin + 220, currentY + 10);
      
      // Add other text if present
      if (event.event_type === 'other' && event.event_type_other) {
        currentY += 20;
        doc.text(event.event_type_other, margin + 40, currentY + 10);
      }
      
      currentY += 30;
      
      // SUPPLIES NEEDED section header
      doc.setFillColor(190, 190, 190);
      doc.rect(0, currentY, pageWidth, 30, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('SUPPLIES NEEDED', pageWidth / 2, currentY + 20, { align: 'center' });
      currentY += 40;
      
      // Create supplies table
      const tableX = margin;
      const tableWidth = pageWidth - 80;
      const col1Width = 180;
      const col2Width = 80;
      const col3Width = 60;
      const col4Width = 100;
      const col5Width = tableWidth - col1Width - col2Width - col3Width - col4Width;
      
      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(tableX, currentY, col1Width + col2Width + col3Width, 25, 'F');
      doc.rect(tableX + col1Width + col2Width + col3Width, currentY, col4Width + col5Width, 25, 'F');
      
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.rect(tableX, currentY, tableWidth, 25, 'S');
      doc.line(tableX + col1Width, currentY, tableX + col1Width, currentY + 25);
      doc.line(tableX + col1Width + col2Width, currentY, tableX + col1Width + col2Width, currentY + 25);
      doc.line(tableX + col1Width + col2Width + col3Width, currentY, tableX + col1Width + col2Width + col3Width, currentY + 25);
      
      // Table headers text
      doc.setFont('helvetica', 'bold');
      doc.text('Beer Style', tableX + 10, currentY + 17);
      doc.text('Pkg', tableX + col1Width + 10, currentY + 17);
      doc.text('Qty', tableX + col1Width + col2Width + 10, currentY + 17);
      
      // Supply checkboxes in header
      const checkX1 = tableX + col1Width + col2Width + col3Width + 10;
      doc.text('Table:', checkX1, currentY + 10);
      doc.rect(checkX1 + 50, currentY + 3, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.table_needed) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 52, currentY + 5, 8, 8, 'F');
      }
      
      doc.text('Beer buckets:', checkX1, currentY + 22);
      doc.rect(checkX1 + 80, currentY + 15, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.beer_buckets) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 82, currentY + 17, 8, 8, 'F');
      }
      
      // Beer rows
      const rowHeight = 30;
      currentY += 25;
      
      // Draw box for rows
      doc.rect(tableX, currentY, tableWidth, rowHeight * 3, 'S');
      doc.line(tableX + col1Width, currentY, tableX + col1Width, currentY + rowHeight * 3);
      doc.line(tableX + col1Width + col2Width, currentY, tableX + col1Width + col2Width, currentY + rowHeight * 3);
      doc.line(tableX + col1Width + col2Width + col3Width, currentY, tableX + col1Width + col2Width + col3Width, currentY + rowHeight * 3);
      
      // Draw horizontal row lines
      doc.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight);
      doc.line(tableX, currentY + rowHeight * 2, tableX + tableWidth, currentY + rowHeight * 2);
      
      // Add beer data
      doc.setFont('helvetica', 'normal');
      if (event.beers && event.beers.length > 0) {
        event.beers.forEach((beer, index) => {
          if (index < 3) {
            const y = currentY + (index * rowHeight) + 20;
            doc.text(beer.beer_style || '', tableX + 10, y);
            doc.text(beer.packaging || '', tableX + col1Width + 10, y);
            doc.text(beer.quantity?.toString() || '', tableX + col1Width + col2Width + 10, y);
          }
        });
      }
      
      // Supply checkboxes on the side
      const checkY1 = currentY + 20;
      
      // First column
      doc.text('Table Cloth:', checkX1, checkY1);
      doc.rect(checkX1 + 80, checkY1 - 7, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.table_cloth) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 82, checkY1 - 5, 8, 8, 'F');
      }
      
      doc.text('Tent/Weights:', checkX1, checkY1 + rowHeight);
      doc.rect(checkX1 + 80, checkY1 + rowHeight - 7, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.tent_weights) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 82, checkY1 + rowHeight - 5, 8, 8, 'F');
      }
      
      doc.text('Signage:', checkX1, checkY1 + rowHeight * 2);
      doc.rect(checkX1 + 80, checkY1 + rowHeight * 2 - 7, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.signage) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 82, checkY1 + rowHeight * 2 - 5, 8, 8, 'F');
      }
      
      // Continue with other checkboxes
      const checkX2 = tableX + tableWidth - 80;
      
      doc.text('Ice:', checkX1, checkY1 + rowHeight * 3 - 5);
      doc.rect(checkX1 + 80, checkY1 + rowHeight * 3 - 12, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.ice) {
        doc.setFillColor(0);
        doc.rect(checkX1 + 82, checkY1 + rowHeight * 3 - 10, 8, 8, 'F');
      }
      
      doc.text('Jockey box:', checkX2, checkY1);
      doc.rect(checkX2 + 80, checkY1 - 7, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.jockey_box) {
        doc.setFillColor(0);
        doc.rect(checkX2 + 82, checkY1 - 5, 8, 8, 'F');
      }
      
      // Jockey box note
      doc.setFontSize(6);
      doc.text('(jockey box supplies include CO2, purge bucket, water keg, ice, toolkit)', checkX2, checkY1 + 10);
      
      doc.setFontSize(10);
      doc.text('Cups:', checkX2, checkY1 + rowHeight + 10);
      doc.rect(checkX2 + 80, checkY1 + rowHeight + 3, checkboxSize, checkboxSize, 'S');
      if (event.supplies?.cups) {
        doc.setFillColor(0);
        doc.rect(checkX2 + 82, checkY1 + rowHeight + 5, 8, 8, 'F');
      }
      
      // Reset position to below supplies table
      currentY += (rowHeight * 3) + 20;
      
      // Additional Supplies section
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Supplies:', tableX, currentY);
      doc.setFont('helvetica', 'normal');
      
      // Draw box
      doc.rect(tableX, currentY - 15, tableWidth, 40, 'S');
      
      // Additional supplies value
      doc.text(event.supplies?.additional_supplies || '', tableX + 120, currentY);
      
      // Small note
      doc.setFontSize(6);
      doc.text('(Stickers, Koozies, Hats, Dog toy)', tableX + 10, currentY + 15);
      
      currentY += 35;
      
      // Event Instructions section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Instructions:', tableX, currentY);
      doc.setFont('helvetica', 'normal');
      
      // Draw box
      doc.rect(tableX, currentY - 15, tableWidth, 60, 'S');
      
      // Instructions text
      if (event.event_instructions) {
        const maxWidth = tableWidth - 130;
        const splitText = doc.splitTextToSize(event.event_instructions, maxWidth);
        doc.text(splitText, tableX + 120, currentY);
      }
      
      // Small note
      doc.setFontSize(6);
      doc.text('(include additional notes here)', tableX + 120, currentY + 40);
      
      currentY += 60;
      
      // POST EVENT NOTES section
      doc.setFontSize(10);
      doc.setFillColor(190, 190, 190);
      doc.rect(0, currentY, pageWidth, 30, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('POST EVENT NOTES', pageWidth / 2, currentY + 20, { align: 'center' });
      
      currentY += 40;
      
      // Post event notes fields
      const createNotesField = (label, value, y) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, tableX, y);
        
        // Draw underline for answer
        doc.setDrawColor(150, 150, 150);
        doc.line(tableX + 200, y + 5, tableX + tableWidth - 20, y + 5);
        
        // Value
        doc.setFont('helvetica', 'normal');
        if (value) {
          doc.text(value, tableX + 200, y);
        }
      };
      
      createNotesField('Estimated attendees:', event.notes?.estimated_attendees || '', currentY);
      currentY += 25;
      
      createNotesField('Was there a favorite style of beer offered?', event.notes?.favorite_beer || '', currentY);
      currentY += 25;
      
      createNotesField('Did you have enough product?', event.notes?.enough_product === true ? 'Yes' : (event.notes?.enough_product === false ? 'No' : ''), currentY);
      currentY += 25;
      
      createNotesField('Were you adequately staffed for the event/tasting?', event.notes?.adequately_staffed === true ? 'Yes' : (event.notes?.adequately_staffed === false ? 'No' : ''), currentY);
      currentY += 25;
      
      createNotesField('Should we continue to participate in this event?', event.notes?.continue_participation === true ? 'Yes' : (event.notes?.continue_participation === false ? 'No' : ''), currentY);
      currentY += 25;
      
      createNotesField('Any critiques?', event.notes?.critiques || '', currentY);
      currentY += 35;
      
      // REMINDER section
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, currentY, tableWidth, 25, 'F');
      doc.setTextColor(255, 0, 0); // Red text
      doc.setFont('helvetica', 'bold');
      doc.text('REMINDER: RETURN SUPPLIES TO THE BREWERY IN THEIR DESIGNATED AREAS', pageWidth / 2, currentY + 15, { align: 'center' });
      
      currentY += 35;
      
      // Return equipment by
      doc.setTextColor(0, 0, 0); // Black text
      doc.text('RETURN EQUIPMENT BY:', tableX, currentY);
      
      // Draw underline
      doc.setDrawColor(150, 150, 150);
      doc.line(tableX + 200, currentY + 5, tableX + tableWidth - 20, currentY + 5);
      
      // Value
      doc.setFont('helvetica', 'normal');
      if (event.notes?.return_equipment_by) {
        doc.text(new Date(event.notes.return_equipment_by).toLocaleDateString(), tableX + 200, currentY);
      }
      
      // Save the PDF
      doc.save(`${event.title.replace(/\s+/g, '_')}_Event_Form.pdf`);
      console.log("PDF generated successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="dp-section">
      <h3 className="dp-subsection-title">Event Form PDF</h3>
      <p>Click the button below to download the DPBC Event Form as a PDF:</p>
      
      <div className="dp-button-group">
        <button onClick={generatePDF} className="dp-button dp-button-primary">
          Download PDF Form
        </button>
        <button onClick={onClose} className="dp-button dp-button-secondary">
          Close
        </button>
      </div>
      
      <div className="dp-form-group">
        <p className="dp-note">
          Note: This will generate a PDF that exactly matches the approved DPBC Event Form template.
        </p>
      </div>
    </div>
  );
};
    
// Post Event Notes Modal
const PostEventNotesModal = ({ event, onClose, onSave }) => {
  const [notes, setNotes] = useState({
    estimated_attendees: event.notes?.estimated_attendees || '',
    favorite_beer: event.notes?.favorite_beer || '',
    enough_product: event.notes?.enough_product || false,
    adequately_staffed: event.notes?.adequately_staffed || false,
    continue_participation: event.notes?.continue_participation || false,
    critiques: event.notes?.critiques || '',
    return_equipment_by: event.notes?.return_equipment_by || ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotes({
      ...notes,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(event.id, notes);
  };

  return (
    <div className="dp-post-notes-modal">
      <h2>Post-Event Notes: {event.title}</h2>
      <form onSubmit={handleSubmit}>
        <div className="dp-form-group">
          <label className="dp-form-label">Estimated Attendees</label>
          <input
            type="number"
            name="estimated_attendees"
            value={notes.estimated_attendees}
            onChange={handleInputChange}
            className="dp-input"
          />
        </div>
        
        <div className="dp-form-group">
          <label className="dp-form-label">Favorite Beer Offered</label>
          <input
            type="text"
            name="favorite_beer"
            value={notes.favorite_beer}
            onChange={handleInputChange}
            className="dp-input"
          />
        </div>
        
        <div className="dp-form-group">
          <label className="dp-checkbox-label">
            <input
              type="checkbox"
              name="enough_product"
              checked={notes.enough_product}
              onChange={handleInputChange}
              className="dp-checkbox"
            />
            <span>Had Enough Product</span>
          </label>
        </div>
        
        <div className="dp-form-group">
          <label className="dp-checkbox-label">
            <input
              type="checkbox"
              name="adequately_staffed"
              checked={notes.adequately_staffed}
              onChange={handleInputChange}
              className="dp-checkbox"
            />
            <span>Adequately Staffed</span>
          </label>
        </div>
        
        <div className="dp-form-group">
          <label className="dp-checkbox-label">
            <input
              type="checkbox"
              name="continue_participation"
              checked={notes.continue_participation}
              onChange={handleInputChange}
              className="dp-checkbox"
            />
            <span>Continue Participation in Future</span>
          </label>
        </div>
        
        <div className="dp-form-group">
          <label className="dp-form-label">Critiques/Comments</label>
          <textarea
            name="critiques"
            value={notes.critiques}
            onChange={handleInputChange}
            className="dp-textarea"
            rows="3"
          ></textarea>
        </div>
        
        <div className="dp-form-group">
          <label className="dp-form-label">Return Equipment By</label>
          <input
            type="date"
            name="return_equipment_by"
            value={notes.return_equipment_by}
            onChange={handleInputChange}
            className="dp-input"
          />
        </div>
        
        <div className="dp-button-group">
          <button type="submit" className="dp-button dp-button-success">Save Notes</button>
          <button type="button" onClick={onClose} className="dp-button dp-button-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};
export default AdminEvents;