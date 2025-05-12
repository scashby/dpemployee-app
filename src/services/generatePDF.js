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
    
    // First pass: set text fields without worrying about appearance
    const setTextField = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      try {
        const field = form.getTextField(name);
        
        // Just set the text value using the basic API
        field.setText(String(value));
        
        // Let's also try to set a default appearance string on the acroField
        // This helps with consistent font rendering
        try {
          const acroField = field.acroField;
          if (acroField && acroField.dict) {
            // Try to use the existing DA string rather than creating a new one
            if (!acroField.dict.has('DA')) {
              acroField.dict.set(
                pdfDoc.context.obj('DA'), 
                pdfDoc.context.string('/Helv 10 Tf 0 g')
              );
            }
          }
        } catch (appearanceError) {
          // Ignore appearance errors - fallback to basic text setting
        }
      } catch (e) {
        console.log(`Error setting field ${name}:`, e.message);
      }
    };
    
    // Set checkboxes
    const setCheckbox = (name, checked) => {
      try {
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.log(`Error setting checkbox ${name}:`, e.message);
      }
    };
    
    // Set text fields
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
    
    // Beer table fields
    console.log('Setting beer table fields...');
    if (event.beers && event.beers.length > 0) {
      for (let i = 0; i < Math.min(event.beers.length, 5); i++) {
        const idx = i + 1;
        const beer = event.beers[i];
        if (beer) {
          setTextField(`Beer Style ${idx}`, beer.beer_style);
          setTextField(`Package Style ${idx}`, beer.packaging);
          setTextField(`Quantity ${idx}`, beer.quantity?.toString());
        }
      }
    }
    
    // Set checkboxes
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
    
    // Custom flattening approach to avoid white boxes
    console.log('Custom flattening approach...');
    
    // Get all form fields
    const fields = form.getFields();
    
    // Create copy of appearances before flattening
    const appearances = {};
    
    // Store each field's appearance stream if available
    fields.forEach(field => {
      try {
        const acroField = field.acroField;
        if (acroField && acroField.dict && acroField.dict.has('AP')) {
          appearances[field.getName()] = {
            ap: acroField.dict.get(pdfDoc.context.obj('AP')),
            value: field.isCheckBox() 
              ? field.isChecked() 
              : field.isTextField() ? field.getText() : null
          };
        }
      } catch (e) {
        // Ignore errors when storing appearances
      }
    });
    
    // Flatten the form
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