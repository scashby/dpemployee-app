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
    
    // Set checkboxes - direct access, no clever code
    if (event.event_type === 'tasting') {
      form.getCheckBox("Tasting").check();
    } else {
      form.getCheckBox("Tasting").uncheck();
    }
    
    if (event.event_type === 'pint_night') {
      form.getCheckBox("Pint Night").check();
    } else {
      form.getCheckBox("Pint Night").uncheck();
    }
    
    if (event.event_type === 'beer_fest') {
      form.getCheckBox("Beer Fest").check();
    } else {
      form.getCheckBox("Beer Fest").uncheck();
    }
    
    if (event.event_type === 'other') {
      form.getCheckBox("Other").check();
    } else {
      form.getCheckBox("Other").uncheck();
    }
    
    if (event.supplies?.table_needed) {
      form.getCheckBox("Table").check();
    } else {
      form.getCheckBox("Table").uncheck();
    }
    
    if (event.supplies?.beer_buckets) {
      form.getCheckBox("Beer Buckets").check();
    } else {
      form.getCheckBox("Beer Buckets").uncheck();
    }
    
    if (event.supplies?.table_cloth) {
      form.getCheckBox("Table Cloth").check();
    } else {
      form.getCheckBox("Table Cloth").uncheck();
    }
    
    if (event.supplies?.tent_weights) {
      form.getCheckBox("Tent Weights").check();
    } else {
      form.getCheckBox("Tent Weights").uncheck();
    }
    
    if (event.supplies?.signage) {
      form.getCheckBox("Signage").check();
    } else {
      form.getCheckBox("Signage").uncheck();
    }
    
    if (event.supplies?.ice) {
      form.getCheckBox("Ice").check();
    } else {
      form.getCheckBox("Ice").uncheck();
    }
    
    if (event.supplies?.jockey_box) {
      form.getCheckBox("Jockey Box").check();
    } else {
      form.getCheckBox("Jockey Box").uncheck();
    }
    
    if (event.supplies?.cups) {
      form.getCheckBox("Cups").check();
    } else {
      form.getCheckBox("Cups").uncheck();
    }
    
    // Set basic text fields - direct access, no clever code
    form.getTextField("Event Name").setText(event.title || '');
    form.getTextField("Event Date").setText(formatDate(event.date));
    form.getTextField("Event Set Up Time").setText(formatTime(event.setup_time));
    form.getTextField("Event Duration").setText(event.duration || '');
    form.getTextField("DP Staff Attending").setText(getAssignedEmployees());
    form.getTextField("Event Contact").setText(event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '');
    form.getTextField("Expected Attendees").setText(event.expected_attendees?.toString() || '');
    
    // Other text fields
    if (event.event_type === 'other') {
      form.getTextField("Other More Detail").setText(event.event_type_other || '');
    }
    
    form.getTextField("Additional Supplies").setText(event.supplies?.additional_supplies || '');
    form.getTextField("Event Instructions").setText(event.event_instructions || event.info || '');
    
    // Beer table fields - direct access, no fancy logic
    if (event.beers && event.beers.length > 0) {
      // Beer 1
      if (event.beers[0]) {
        form.getTextField("Beer Style 1").setText(event.beers[0].beer_style || '');
        form.getTextField("Package Style 1").setText(event.beers[0].packaging || '');
        form.getTextField("Quantity 1").setText(event.beers[0].quantity?.toString() || '');
      }
      
      // Beer 2
      if (event.beers.length > 1 && event.beers[1]) {
        form.getTextField("Beer Style 2").setText(event.beers[1].beer_style || '');
        form.getTextField("Package Style 2").setText(event.beers[1].packaging || '');
        form.getTextField("Quantity 2").setText(event.beers[1].quantity?.toString() || '');
      }
      
      // Beer 3
      if (event.beers.length > 2 && event.beers[2]) {
        form.getTextField("Beer Style 3").setText(event.beers[2].beer_style || '');
        form.getTextField("Package Style 3").setText(event.beers[2].packaging || '');
        form.getTextField("Quantity 3").setText(event.beers[2].quantity?.toString() || '');
      }
      
      // Beer 4
      if (event.beers.length > 3 && event.beers[3]) {
        form.getTextField("Beer Style 4").setText(event.beers[3].beer_style || '');
        form.getTextField("Package Style 4").setText(event.beers[3].packaging || '');
        form.getTextField("Quantity 4").setText(event.beers[3].quantity?.toString() || '');
      }
      
      // Beer 5
      if (event.beers.length > 4 && event.beers[4]) {
        form.getTextField("Beer Style 5").setText(event.beers[4].beer_style || '');
        form.getTextField("Package Style 5").setText(event.beers[4].packaging || '');
        form.getTextField("Quantity 5").setText(event.beers[4].quantity?.toString() || '');
      }
    }
    
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