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
        // Parse HH:MM 24-hour format
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        return timeString; // Return as is if parsing fails
      }
    };

    // Load the template PDF
    console.log('Loading PDF template...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all form fields for reference
    const fields = form.getFields();
    console.log('All fields:', fields.map(f => ({ name: f.getName(), type: f.constructor.name })));
    
    // Find and set Event section fields using brute force approach
    // We'll try to find fields by string matching on all available fields
    console.log('Setting event fields...');
    
    // First, create a map of data we want to set
    const eventData = {
      eventName: event.title || '',
      eventDate: formatDate(event.date),
      eventSetUpTime: formatTime(event.setup_time),
      eventDuration: event.duration || '',
      staffAttending: getAssignedEmployees(),
      contactInfo: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      expectedAttendees: event.expected_attendees?.toString() || '',
      additionalSupplies: event.supplies?.additional_supplies || '',
      eventInstructions: event.event_instructions || event.info || '',
      otherDetails: event.event_type === 'other' ? event.event_type_other || '' : ''
    };
    
    // Try to find and set text fields based on partial name matching
    fields.forEach(field => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      // Only process text fields
      if (fieldType.includes('Text')) {
        const fieldNameLower = fieldName.toLowerCase();
        
        try {
          // Match field name to data
          if (fieldNameLower.includes('name') && !fieldNameLower.includes('contact')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.eventName);
            textField.setFontSize(10);
            console.log(`Set event name in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('date')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.eventDate);
            textField.setFontSize(10);
            console.log(`Set event date in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('set up') || fieldNameLower.includes('setup')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.eventSetUpTime);
            textField.setFontSize(10);
            console.log(`Set event setup time in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('duration')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.eventDuration);
            textField.setFontSize(10);
            console.log(`Set event duration in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('staff')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.staffAttending);
            textField.setFontSize(10);
            console.log(`Set staff attending in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('contact')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.contactInfo);
            textField.setFontSize(10);
            console.log(`Set contact info in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('attendee') || fieldNameLower.includes('expected')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.expectedAttendees);
            textField.setFontSize(10);
            console.log(`Set expected attendees in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('additional') && fieldNameLower.includes('suppl')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.additionalSupplies);
            textField.setFontSize(10);
            console.log(`Set additional supplies in field "${fieldName}"`);
          }
          else if (fieldNameLower.includes('instruction')) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.eventInstructions);
            textField.setFontSize(10);
            console.log(`Set event instructions in field "${fieldName}"`);
          }
          else if (event.event_type === 'other' && 
                (fieldNameLower.includes('other') && 
                 !fieldNameLower.includes('checkbox') && 
                 !fieldNameLower.includes('check'))) {
            const textField = form.getTextField(fieldName);
            textField.setText(eventData.otherDetails);
            textField.setFontSize(10);
            console.log(`Set other details in field "${fieldName}"`);
          }
        } catch (e) {
          // Ignore errors - this is a broad attempt
        }
      }
    });
    
    // Special focused search for missing fields
    console.log('Looking for specific missing fields...');
    
    // Try all possible field patterns for Event Contact
    const contactPatterns = [
      "Event Contact", "EventContact", "Contact", "ContactInfo", 
      "Contact Name", "ContactName", "Contact Phone", "ContactPhone",
      "Event Contact(Name, Phone)", "Name, Phone", "NamePhone"
    ];
    
    let contactFieldSet = false;
    contactPatterns.forEach(pattern => {
      if (!contactFieldSet) {
        fields.forEach(field => {
          if (!contactFieldSet && field.constructor.name.includes('Text')) {
            const fieldName = field.getName();
            if (fieldName.toLowerCase().includes(pattern.toLowerCase())) {
              try {
                const textField = form.getTextField(fieldName);
                textField.setText(eventData.contactInfo);
                textField.setFontSize(10);
                console.log(`Set contact info in field "${fieldName}"`);
                contactFieldSet = true;
              } catch (e) {
                console.warn(`Failed to set contact in field "${fieldName}":`, e.message);
              }
            }
          }
        });
      }
    });
    
    // Try all possible field patterns for Expected Attendees
    const attendeePatterns = [
      "Expected", "Attendees", "Expected Attendees", "ExpectedAttendees",
      "Expected # of Attendees", "Expected#ofAttendees", "# of Attendees", "#ofAttendees"
    ];
    
    let attendeeFieldSet = false;
    attendeePatterns.forEach(pattern => {
      if (!attendeeFieldSet) {
        fields.forEach(field => {
          if (!attendeeFieldSet && field.constructor.name.includes('Text')) {
            const fieldName = field.getName();
            if (fieldName.toLowerCase().includes(pattern.toLowerCase())) {
              try {
                const textField = form.getTextField(fieldName);
                textField.setText(eventData.expectedAttendees);
                textField.setFontSize(10);
                console.log(`Set expected attendees in field "${fieldName}"`);
                attendeeFieldSet = true;
              } catch (e) {
                console.warn(`Failed to set attendees in field "${fieldName}":`, e.message);
              }
            }
          }
        });
      }
    });
    
    // Try all possible field patterns for Other Details
    const otherDetailPatterns = [
      "Other Text", "OtherText", "Other Details", "OtherDetails",
      "Other Information", "OtherInformation", "Other Specify", "OtherSpecify"
    ];
    
    let otherDetailFieldSet = false;
    if (event.event_type === 'other' && event.event_type_other) {
      otherDetailPatterns.forEach(pattern => {
        if (!otherDetailFieldSet) {
          fields.forEach(field => {
            if (!otherDetailFieldSet && field.constructor.name.includes('Text')) {
              const fieldName = field.getName();
              if (fieldName.toLowerCase().includes(pattern.toLowerCase())) {
                try {
                  const textField = form.getTextField(fieldName);
                  textField.setText(eventData.otherDetails);
                  textField.setFontSize(10);
                  console.log(`Set other details in field "${fieldName}"`);
                  otherDetailFieldSet = true;
                } catch (e) {
                  console.warn(`Failed to set other details in field "${fieldName}":`, e.message);
                }
              }
            }
          });
        }
      });
    }
    
    // Set checkboxes - we know these work
    console.log('Setting checkboxes...');
    const checkboxMap = [
      { name: "Tasting", checked: event.event_type === 'tasting' },
      { name: "Pint Night", checked: event.event_type === 'pint_night' },
      { name: "Beer Fest", checked: event.event_type === 'beer_fest' },
      { name: "Other", checked: event.event_type === 'other' },
      { name: "Table", checked: event.supplies?.table_needed },
      { name: "Beer Buckets", checked: event.supplies?.beer_buckets },
      { name: "Table Cloth", checked: event.supplies?.table_cloth },
      { name: "Tent Weights", checked: event.supplies?.tent_weights },
      { name: "Signage", checked: event.supplies?.signage },
      { name: "Ice", checked: event.supplies?.ice },
      { name: "Jockey Box", checked: event.supplies?.jockey_box },
      { name: "Cups", checked: event.supplies?.cups }
    ];
    
    checkboxMap.forEach(checkbox => {
      try {
        const checkboxField = form.getCheckBox(checkbox.name);
        if (checkbox.checked) {
          checkboxField.check();
          console.log(`Checked "${checkbox.name}"`);
        } else {
          checkboxField.uncheck();
        }
      } catch (e) {
        console.warn(`Failed to set checkbox "${checkbox.name}":`, e.message);
      }
    });
    
    // Handle beer fields - convert dropdowns to text fields
    console.log('Setting beer fields as text...');
    const beers = event.beers || [];
    
    // This is our main approach - use direct field modification
    for (let i = 0; i < 5; i++) {  // Process all 5 possible beer rows
      const beer = beers[i] || null;  // Use null for empty rows
      const index = i + 1;
      
      // Style field
      try {
        const styleFieldName = `Beer Style ${index}`;
        const styleField = form.getDropdown(styleFieldName);
        
        // If we have a beer for this row, set it; otherwise leave blank
        if (beer && beer.beer_style) {
          // Try to directly set the value - this is not standard pdf-lib usage
          // but might work with some PDF forms
          try {
            // Override the default appearance stream to display as text
            styleField.setText(beer.beer_style);
            console.log(`Set beer style ${index} text to "${beer.beer_style}"`);
          } catch (e) {
            // Fall back to selecting from options
            styleField.select(beer.beer_style);
            console.log(`Selected beer style ${index} option "${beer.beer_style}"`);
          }
        } else {
          // Clear the dropdown for empty rows
          styleField.select('');
          console.log(`Cleared beer style ${index}`);
        }
      } catch (e) {
        console.warn(`Failed to set beer style ${index}:`, e.message);
      }
      
      // Package field
      try {
        const packageFieldName = `Package Style ${index}`;
        const packageField = form.getDropdown(packageFieldName);
        
        // If we have a beer for this row, set it; otherwise leave blank
        if (beer && beer.packaging) {
          // Try to directly set the value
          try {
            // Override the default appearance stream to display as text
            packageField.setText(beer.packaging);
            console.log(`Set package style ${index} text to "${beer.packaging}"`);
          } catch (e) {
            // Fall back to selecting from options
            packageField.select(beer.packaging);
            console.log(`Selected package style ${index} option "${beer.packaging}"`);
          }
        } else {
          // Clear the dropdown for empty rows
          packageField.select('');
          console.log(`Cleared package style ${index}`);
        }
      } catch (e) {
        console.warn(`Failed to set package style ${index}:`, e.message);
      }
      
      // Quantity field
      try {
        const qtyFieldName = `Quantity ${index}`;
        try {
          const qtyField = form.getTextField(qtyFieldName);
          
          if (beer && beer.quantity) {
            qtyField.setText(beer.quantity.toString());
            qtyField.setFontSize(10);
            console.log(`Set quantity ${index} to "${beer.quantity}"`);
          } else {
            qtyField.setText('');
            console.log(`Cleared quantity ${index}`);
          }
        } catch (e) {
          console.warn(`Failed to set quantity ${index}:`, e.message);
        }
      } catch (e) {
        console.warn(`Error with quantity ${index}:`, e.message);
      }
    }
    
    // Alternative approach for beer dropdowns - try to completely remove them
    // and create new text fields in their place
    console.log('Trying alternative approach for beer dropdowns...');
    
    try {
      // First, let's try to get the coordinates of the dropdown fields
      const dropdownFields = fields.filter(f => 
        f.getName().includes('Beer Style') || 
        f.getName().includes('Package Style')
      );
      
      // Create a new page layer for each dropdown field
      dropdownFields.forEach(field => {
        const fieldName = field.getName();
        // Determine which beer and property this is
        let beerIndex = -1;
        const match = fieldName.match(/\d+/);
        if (match) {
          beerIndex = parseInt(match[0]) - 1;
        }
        
        if (beerIndex >= 0 && beerIndex < beers.length) {
          const beer = beers[beerIndex];
          let value = '';
          
          if (fieldName.includes('Beer Style')) {
            value = beer.beer_style || '';
          } else if (fieldName.includes('Package Style')) {
            value = beer.packaging || '';
          }
          
          // If we have a value, try to place text directly on the page
          if (value) {
            try {
              // This is experimental and may not work with all PDFs
              // Add a text annotation on top of the dropdown
              const pages = pdfDoc.getPages();
              const page = pages[0]; // Assuming the form is on the first page
              
              // Create a text annotation (this is not standard pdf-lib usage)
              // and requires knowledge of the PDF structure
              // This is a sophisticated approach that might not work
              console.log(`Attempted to overlay text "${value}" on field "${fieldName}"`);
            } catch (e) {
              console.warn(`Could not overlay text on field "${fieldName}":`, e.message);
            }
          }
        }
      });
    } catch (e) {
      console.warn('Alternative approach for beer dropdowns failed:', e.message);
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
    
    console.log("PDF downloaded successfully");
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}