export async function generatePDF(event, employees = [], eventAssignments = {}) {
  try {
    // Helper functions for formatting data for display/logging only
    const getAssignedEmployees = () => {
      return (eventAssignments[event.id] || [])
        .map(empId => employees.find(e => e.id === empId)?.name || '')
        .filter(Boolean)
        .join(', ');
    };

    // Prepare the event data to send to the API
    const eventData = {
      title: event.title || '',
      date: event.date || '',
      setup_time: event.setup_time || '',
      duration: event.duration || '',
      staffAttending: getAssignedEmployees(),
      contact_name: event.contact_name || '',
      contact_phone: event.contact_phone || '',
      expected_attendees: event.expected_attendees,
      event_type: event.event_type || 'other',
      event_type_other: event.event_type_other || '',
      info: event.info || '',
      event_instructions: event.event_instructions || '',
      off_prem: event.off_prem || false,
      supplies: event.supplies || {
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
      beers: event.beers || []
    };

    console.log('Sending PDF data to server API...');
    
    // Call the existing API endpoint
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    // Get the PDF blob from the server response
    const pdfBlob = await response.blob();
    
    // Create a download link for the PDF
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title || 'Event'}_Form.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF downloaded successfully.');
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}