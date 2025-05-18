import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/devils-purse.css';
import { generatePDF } from '../../services/generatePDF';

// Remove the Manage Events section: Only render the modals for printing and post-event notes

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
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date');
      if (eventsError) throw eventsError;
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
      const enrichedEvents = eventsData?.map(event => ({
        ...event,
        supplies: suppliesByEvent[event.id] || {},
        beers: beersByEvent[event.id] || [],
        notes: notesByEvent[event.id] || {}
      })) || [];
      setEvents(enrichedEvents);
    } catch (error) {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
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
    } catch (error) {}
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
      setError('Failed to save notes');
      setTimeout(() => setError(''), 3000);
    }
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
    <>
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
    </>
  );
};

const PrintableEventForm = ({ event, employees, eventAssignments, onClose }) => {
  if (!event) return null;
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');
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

export default EventDetailsModal;