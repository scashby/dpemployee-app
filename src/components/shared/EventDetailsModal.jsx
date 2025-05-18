import React from "react";
import { generatePDF } from "../../services/generatePDF";

const EventDetailsModal = ({
  event,
  employees = [],
  eventAssignments = {},
  onClose,
}) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl relative overflow-y-auto max-h-[95vh]">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
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
          <div className="dp-button-group mt-6 flex flex-col md:flex-row gap-2">
            <button
              onClick={() => generatePDF(event, employees, eventAssignments)}
              className="dp-button dp-button-primary bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
            >
              Download PDF Form
            </button>
            <button
              onClick={onClose}
              className="dp-button dp-button-secondary bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;