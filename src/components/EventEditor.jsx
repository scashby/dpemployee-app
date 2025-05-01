import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import moment from 'moment';

const emptyEvent = {
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  staff_needed: '',
  contact: '',
  prep_notes: '',
  staff_working: [{ name: '', role: '', hours: '' }]
};

const EventEditor = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('date');
    if (error) console.error(error);
    else setEvents(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStaffChange = (index, field, value) => {
    const updated = [...form.staff_working];
    updated[index][field] = value;
    setForm(prev => ({ ...prev, staff_working: updated }));
  };

  const addStaff = () => {
    setForm(prev => ({
      ...prev,
      staff_working: [...prev.staff_working, { name: '', role: '', hours: '' }]
    }));
  };

  const saveEvent = async () => {
    if (!form.title || !form.date) return alert('Title and date are required.');

    if (editingId) {
      await supabase.from('events').update(form).eq('id', editingId);
    } else {
      await supabase.from('events').insert(form);
    }

    setForm(emptyEvent);
    setEditingId(null);
    fetchEvents();
  };

  const editEvent = (event) => {
    setForm(event);
    setEditingId(event.id);
  };

  const deleteEvent = async (id) => {
    if (confirm('Delete this event?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchEvents();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Edit Events</h2>

      <div className="bg-gray-50 p-4 rounded shadow mb-6">
        <h3 className="text-lg font-bold mb-2">{editingId ? 'Edit Event' : 'Add New Event'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border p-2 rounded" />
          <input type="date" name="date" value={form.date} onChange={handleChange} className="border p-2 rounded" />
          <input type="time" name="start_time" value={form.start_time} onChange={handleChange} className="border p-2 rounded" />
          <input type="time" name="end_time" value={form.end_time} onChange={handleChange} className="border p-2 rounded" />
          <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="border p-2 rounded" />
          <input name="staff_needed" value={form.staff_needed} onChange={handleChange} placeholder="Staff Needed" className="border p-2 rounded" />
          <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact" className="border p-2 rounded" />
          <textarea name="prep_notes" value={form.prep_notes} onChange={handleChange} placeholder="Prep Notes" className="col-span-2 border p-2 rounded" />
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Staff Working</h4>
          {form.staff_working.map((s, idx) => (
            <div key={idx} className="flex space-x-2 mb-2">
              <input placeholder="Name" value={s.name} onChange={e => handleStaffChange(idx, 'name', e.target.value)} className="border p-1 rounded w-1/3" />
              <input placeholder="Role" value={s.role} onChange={e => handleStaffChange(idx, 'role', e.target.value)} className="border p-1 rounded w-1/3" />
              <input placeholder="Hours" value={s.hours} onChange={e => handleStaffChange(idx, 'hours', e.target.value)} className="border p-1 rounded w-1/3" />
            </div>
          ))}
          <button onClick={addStaff} className="text-blue-600 text-sm mt-1 hover:underline">+ Add Staff Member</button>
        </div>

        <div className="mt-4 space-x-2">
          <button onClick={saveEvent} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          <button onClick={() => { setForm(emptyEvent); setEditingId(null); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">Current Events</h3>
      <ul className="divide-y border rounded">
        {events.map(evt => (
          <li key={evt.id} className="p-4 flex justify-between items-start">
            <div>
              <p className="font-semibold">{evt.title} — {moment(evt.date).format('MMM D')}</p>
              <p className="text-sm text-gray-600">{evt.location} | {evt.start_time?.slice(0, 5)}–{evt.end_time?.slice(0, 5)}</p>
              {evt.staff_working?.length > 0 && (
                <ul className="mt-1 text-sm text-gray-700">
                  {evt.staff_working.map((s, i) => (
                    <li key={i}>• {s.name} ({s.role}, {s.hours})</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-x-2">
              <button onClick={() => editEvent(evt)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={() => deleteEvent(evt.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventEditor;
