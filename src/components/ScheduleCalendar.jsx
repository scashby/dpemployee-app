import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { supabase } from '../supabase/supabaseClient';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [openTime, setOpenTime] = useState('12:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [staff, setStaff] = useState([{ name: '', hours: '', event: '' }]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from('schedule').select('*');
    if (error) {
      console.error('Error fetching schedule:', error);
      return;
    }

    const formatted = data.map(item => ({
      id: item.id,
      title: `Open: ${item.open_time?.slice(0, 5) || '12:00'} - ${item.close_time?.slice(0, 5) || '18:00'}`,
      start: new Date(item.date),
      end: new Date(item.date),
      allDay: true,
      staff: item.staff || [],
      notes: item.notes || '',
      raw: item
    }));

    setEvents(formatted);
  };

  const handleSelectSlot = async ({ start }) => {
    const dateStr = moment(start).format('YYYY-MM-DD');
    const { data, error } = await supabase.from('schedule').select('*').eq('date', dateStr).single();
    if (data) {
      setOpenTime(data.open_time?.slice(0, 5) || '12:00');
      setCloseTime(data.close_time?.slice(0, 5) || '18:00');
      setNotes(data.notes || '');
      setStaff(data.staff || [{ name: '', hours: '', event: '' }]);
      setEditingId(data.id);
    } else {
      setOpenTime('12:00');
      setCloseTime('18:00');
      setNotes('');
      setStaff([{ name: '', hours: '', event: '' }]);
      setEditingId(null);
    }
    setSelectedDate(start);
    setShowModal(true);
  };

  const handleStaffChange = (index, field, value) => {
    const updated = [...staff];
    updated[index][field] = value;
    setStaff(updated);
  };

  const addStaff = () => {
    setStaff([...staff, { name: '', hours: '', event: '' }]);
  };

  const saveSchedule = async () => {
    const dateStr = moment(selectedDate).format('YYYY-MM-DD');
    const payload = {
      date: dateStr,
      open_time: openTime,
      close_time: closeTime,
      notes,
      staff
    };

    if (editingId) {
      await supabase.from('schedule').update(payload).eq('id', editingId);
    } else {
      await supabase.from('schedule').insert(payload);
    }

    setShowModal(false);
    fetchSchedule();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Weekly Schedule</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        style={{ height: 500 }}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Edit Schedule – {selectedDate.toDateString()}</h3>
            <div className="space-y-2">
              <label className="block">
                Open Time:
                <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="ml-2 border px-2 py-1 rounded" />
              </label>
              <label className="block">
                Close Time:
                <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="ml-2 border px-2 py-1 rounded" />
              </label>
              <label className="block">
                Notes:
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border p-1 rounded mt-1" />
              </label>
              <div>
                <h4 className="font-semibold mb-1">Staff</h4>
                {staff.map((s, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <input placeholder="Name" value={s.name} onChange={e => handleStaffChange(idx, 'name', e.target.value)} className="border px-2 py-1 rounded w-1/3" />
                    <input placeholder="Hours" value={s.hours} onChange={e => handleStaffChange(idx, 'hours', e.target.value)} className="border px-2 py-1 rounded w-1/3" />
                    <input placeholder="Event (optional)" value={s.event} onChange={e => handleStaffChange(idx, 'event', e.target.value)} className="border px-2 py-1 rounded w-1/3" />
                  </div>
                ))}
                <button onClick={addStaff} className="text-sm text-blue-600 hover:underline">+ Add Staff</button>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              <button onClick={saveSchedule} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;
