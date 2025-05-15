// src/components/EventEditor.jsx - Responsive Refactor
import React, { useState, useEffect } from 'react';
import FormGroup from './shared/FormGroup';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';

const EventEditor = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    setup_time: '',
    duration: '',
    contact_name: '',
    contact_phone: '',
    expected_attendees: '',
    event_type: 'tasting',
    event_type_other: '',
    event_instructions: '',
    off_prem: false,
    info: ''
  });
  
  const [beers, setBeers] = useState([]);
  const [supplies, setSupplies] = useState({
    table_needed: false,
    beer_buckets: false,
    table_cloth: false,
    tent_weights: false,
    signage: false,
    ice: false,
    jockey_box: false,
    cups: false,
    additional_supplies: ''
  });

  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || '',
        setup_time: event.setup_time || '',
        duration: event.duration || '',
        contact_name: event.contact_name || '',
        contact_phone: event.contact_phone || '',
        expected_attendees: event.expected_attendees || '',
        event_type: event.event_type || 'tasting',
        event_type_other: event.event_type_other || '',
        event_instructions: event.event_instructions || '',
        off_prem: event.off_prem || false,
        info: event.info || ''
      });
      
      // Load beers and supplies if available
      if (event.beers) {
        setBeers(event.beers);
      }
      
      if (event.supplies) {
        setSupplies(event.supplies);
      }
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSuppliesChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSupplies(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addBeer = () => {
    setBeers([...beers, { beer_style: '', packaging: 'Draft', quantity: 1 }]);
  };

  const updateBeer = (index, field, value) => {
    const updatedBeers = [...beers];
    updatedBeers[index][field] = value;
    setBeers(updatedBeers);
  };

  const removeBeer = (index) => {
    setBeers(beers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Combine all data
    const eventData = {
      ...formData,
      beers,
      supplies
    };
    
    onSave(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4">
        {event ? 'Edit Event' : 'Create New Event'}
      </h2>
      
      {/* Basic Information Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Event Title" htmlFor="title">
            <FormInput
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup label="Date" htmlFor="date">
            <FormInput
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormGroup label="Time" htmlFor="time">
            <FormInput
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              placeholder="e.g., 5:00 PM"
              required
            />
          </FormGroup>

          <FormGroup label="Setup Time" htmlFor="setup_time">
            <FormInput
              id="setup_time"
              name="setup_time"
              value={formData.setup_time}
              onChange={handleChange}
              placeholder="e.g., 4:00 PM"
            />
          </FormGroup>

          <FormGroup label="Duration" htmlFor="duration">
            <FormInput
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 2 hours"
            />
          </FormGroup>
        </div>
      </div>
      
      {/* Contact Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Contact Name" htmlFor="contact_name">
            <FormInput
              id="contact_name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup label="Contact Phone" htmlFor="contact_phone">
            <FormInput
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
            />
          </FormGroup>
        </div>
      </div>
      
      {/* Event Details Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Event Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Expected Attendees" htmlFor="expected_attendees">
            <FormInput
              id="expected_attendees"
              name="expected_attendees"
              type="number"
              value={formData.expected_attendees}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup label="Event Type" htmlFor="event_type">
            <FormSelect
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              options={[
                { value: 'tasting', label: 'Tasting' },
                { value: 'pint_night', label: 'Pint Night' },
                { value: 'beer_fest', label: 'Beer Festival' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </FormGroup>
        </div>
        
        {formData.event_type === 'other' && (
          <div className="mt-4">
            <FormGroup label="Specify Event Type" htmlFor="event_type_other">
              <FormInput
                id="event_type_other"
                name="event_type_other"
                value={formData.event_type_other}
                onChange={handleChange}
              />
            </FormGroup>
          </div>
        )}
        
        <div className="mt-4">
          <FormGroup label="Event Instructions" htmlFor="event_instructions">
            <textarea
              id="event_instructions"
              name="event_instructions"
              value={formData.event_instructions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </FormGroup>
        </div>
        
        <div className="mt-4 flex items-center">
          <input
            id="off_prem"
            name="off_prem"
            type="checkbox"
            checked={formData.off_prem}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="off_prem" className="ml-2 text-sm text-gray-700">
            Off-premise event
          </label>
        </div>
      </div>
      
      {/* Beer Products Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="text-lg font-semibold">Beer Products</h3>
          <button
            type="button"
            onClick={addBeer}
            className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"
          >
            Add Beer
          </button>
        </div>
        
        {beers.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">No beer products added yet. Click "Add Beer" to add products.</p>
        )}
        
        {beers.map((beer, index) => (
          <div key={index} className="border p-3 rounded-md mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Beer {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeBeer(index)}
                className="text-red-500 hover:text-red-700"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor={`beer-style-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Beer Style
                </label>
                <input
                  id={`beer-style-${index}`}
                  value={beer.beer_style}
                  onChange={(e) => updateBeer(index, 'beer_style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor={`packaging-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Packaging
                </label>
                <select
                  id={`packaging-${index}`}
                  value={beer.packaging}
                  onChange={(e) => updateBeer(index, 'packaging', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Draft">Draft</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Cans">Cans</option>
                </select>
              </div>
              
              <div>
                <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={beer.quantity}
                  onChange={(e) => updateBeer(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Supplies Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Supplies</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-3">
          <div className="flex items-center">
            <input
              id="table_needed"
              name="table_needed"
              type="checkbox"
              checked={supplies.table_needed}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="table_needed" className="ml-2 text-sm text-gray-700">
              Table Needed
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="beer_buckets"
              name="beer_buckets"
              type="checkbox"
              checked={supplies.beer_buckets}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="beer_buckets" className="ml-2 text-sm text-gray-700">
              Beer Buckets
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="table_cloth"
              name="table_cloth"
              type="checkbox"
              checked={supplies.table_cloth}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="table_cloth" className="ml-2 text-sm text-gray-700">
              Table Cloth
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="tent_weights"
              name="tent_weights"
              type="checkbox"
              checked={supplies.tent_weights}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="tent_weights" className="ml-2 text-sm text-gray-700">
              Tent Weights
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="signage"
              name="signage"
              type="checkbox"
              checked={supplies.signage}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="signage" className="ml-2 text-sm text-gray-700">
              Signage
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="ice"
              name="ice"
              type="checkbox"
              checked={supplies.ice}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="ice" className="ml-2 text-sm text-gray-700">
              Ice
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="jockey_box"
              name="jockey_box"
              type="checkbox"
              checked={supplies.jockey_box}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="jockey_box" className="ml-2 text-sm text-gray-700">
              Jockey Box
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="cups"
              name="cups"
              type="checkbox"
              checked={supplies.cups}
              onChange={handleSuppliesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="cups" className="ml-2 text-sm text-gray-700">
              Cups
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <FormGroup label="Additional Supplies" htmlFor="additional_supplies">
            <textarea
              id="additional_supplies"
              name="additional_supplies"
              value={supplies.additional_supplies}
              onChange={handleSuppliesChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            ></textarea>
          </FormGroup>
        </div>
      </div>
      
      {/* Additional Notes Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Additional Notes</h3>
        
        <FormGroup label="Additional Information" htmlFor="info">
          <textarea
            id="info"
            name="info"
            value={formData.info}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </FormGroup>
      </div>
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventEditor;
