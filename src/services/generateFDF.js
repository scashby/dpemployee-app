
// generateFDF.js
// Generates an FDF file from event data for merging with corporate-approved PDF

export function generateFDF(event) {
  const fdfHeader = `%FDF-1.2\n%âãÏÓ\n`;
  const fdfFields = `
1 0 obj
<<
/FDF <<
/Fields [
  << /T (event_name) /V (${event.title || ''}) >>
  << /T (event_date) /V (${event.date || ''}) >>
  << /T (event_time) /V (${event.time || ''}) >>
  << /T (event_duration) /V (${event.duration || ''}) >>
  << /T (event_setup) /V (${event.setup_time || ''}) >>
  << /T (event_staff) /V (${event.staff_attending || ''}) >>
  << /T (event_type) /V (${event.event_type === 'other' ? event.event_type_other : event.event_type}) >>
  << /T (event_notes) /V (${event.info || ''}) >>
  << /T (contact_name) /V (${event.contact_name || ''}) >>
  << /T (contact_phone) /V (${event.contact_phone || ''}) >>
  << /T (expected_attendees) /V (${event.expected_attendees || ''}) >>
]
>>
>>
endobj
trailer
<<
/Root 1 0 R
>>
%%EOF
`;

  const blob = new Blob([fdfHeader + fdfFields], { type: 'application/vnd.fdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'event-form.fdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
