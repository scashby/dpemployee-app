import { PDFDocument } from 'pdf-lib';

export async function generatePDF(event, employees = [], eventAssignments = {}) {
  try {
    // Helper functions
    const getAssignedEmployees = () => {
      return (eventAssignments[event.id] || [])
        .map(empId => employees.find(e => e.id === empId)?.name || '')
        .filter(Boolean)
        .join(', ');
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    const formatTime = (timeString) => {
      if (!timeString) return '';
      try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        return timeString;
      }
    };

    // Load the template PDF
    console.log('Loading PDF template...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Super simple setTextField function
    const setTextField = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      try {
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        console.error(`Error setting field ${name}:`, e);
      }
    };
    
    // Super simple setCheckbox function
    const setCheckbox = (name, checked) => {
      try {
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.error(`Error setting checkbox ${name}:`, e);
      }
    };
    
    // Set text fields - simple approach
    console.log('Setting text fields...');
    setTextField("Event Name", event.title);
    setTextField("Event Date", formatDate(event.date));
    setTextField("Event Set Up Time", formatTime(event.setup_time));
    setTextField("Event Duration", event.duration);
    setTextField("DP Staff Attending", getAssignedEmployees());
    setTextField("Event Contact", event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '');
    setTextField("Expected Attendees", event.expected_attendees);
    setTextField("Event Instructions", event.event_instructions || event.info);
    setTextField("Additional Supplies", event.supplies?.additional_supplies);
    
    if (event.event_type === 'other') {
      setTextField("Other More Detail", event.event_type_other);
    }
    
    // Set beer table fields - simple approach
    console.log('Setting beer table fields...');
    if (event.beers && event.beers.length > 0) {
      // Beer 1
      if (event.beers[0]) {
        setTextField("Beer Style 1", event.beers[0].beer_style);
        setTextField("Package Style 1", event.beers[0].packaging);
        setTextField("Quantity 1", event.beers[0].quantity);
      }
      
      // Beer 2
      if (event.beers.length > 1 && event.beers[1]) {
        setTextField("Beer Style 2", event.beers[1].beer_style);
        setTextField("Package Style 2", event.beers[1].packaging);
        setTextField("Quantity 2", event.beers[1].quantity);
      }
      
      // Beer 3
      if (event.beers.length > 2 && event.beers[2]) {
        setTextField("Beer Style 3", event.beers[2].beer_style);
        setTextField("Package Style 3", event.beers[2].packaging);
        setTextField("Quantity 3", event.beers[2].quantity);
      }
      
      // Beer 4
      if (event.beers.length > 3 && event.beers[3]) {
        setTextField("Beer Style 4", event.beers[3].beer_style);
        setTextField("Package Style 4", event.beers[3].packaging);
        setTextField("Quantity 4", event.beers[3].quantity);
      }
      
      // Beer 5
      if (event.beers.length > 4 && event.beers[4]) {
        setTextField("Beer Style 5", event.beers[4].beer_style);
        setTextField("Package Style 5", event.beers[4].packaging);
        setTextField("Quantity 5", event.beers[4].quantity);
      }
    }
    
    // Set checkboxes - simple approach
    console.log('Setting checkboxes...');
    setCheckbox("Tasting", event.event_type === 'tasting');
    setCheckbox("Pint Night", event.event_type === 'pint_night');
    setCheckbox("Beer Fest", event.event_type === 'beer_fest');
    setCheckbox("Other", event.event_type === 'other');
    
    setCheckbox("Table", event.supplies?.table_needed);
    setCheckbox("Beer Buckets", event.supplies?.beer_buckets);
    setCheckbox("Table Cloth", event.supplies?.table_cloth);
    setCheckbox("Tent Weights", event.supplies?.tent_weights);
    setCheckbox("Signage", event.supplies?.signage);
    setCheckbox("Ice", event.supplies?.ice);
    setCheckbox("Jockey Box", event.supplies?.jockey_box);
    setCheckbox("Cups", event.supplies?.cups);
    
    // Flatten the form to avoid field rendering issues
    console.log('Flattening form...');
    form.flatten();
    
    // Save the PDF
    console.log('Saving PDF...');
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Create a blob and download the PDF
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
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