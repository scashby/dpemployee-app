import { PDFDocument } from 'pdf-lib';

export async function generatePDF(event, employees = [], eventAssignments = {}) {
  try {
    // Prepare the data to send to the server
    const staffAttending = (eventAssignments[event.id] || [])
      .map(empId => employees.find(e => e.id === empId)?.name || '')
      .filter(Boolean)
      .join(', ');
    
    // Create a copy of the event with staffAttending added
    const requestData = {
      ...event,
      staffAttending,
      // Make sure beers are included properly
      beers: event.beers || []
    };
    
    console.log('Sending data to server for PDF generation...');
    
    // Call the serverless function
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    // Get the PDF blob
    const pdfBlob = await response.blob();
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `${event.title || 'Event'}_Form.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log('PDF downloaded successfully.');
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}