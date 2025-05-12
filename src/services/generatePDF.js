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
    
    // Get all form fields to identify field types and names
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Step 1: Set the event detail text fields
    // Using an array of objects to map field names to values
    const textFieldMappings = [
      { names: ["Event Name :", "Event Name", "EventName"], value: event.title || '' },
      { names: ["Event Date:", "Event Date", "EventDate"], value: formatDate(event.date) },
      { names: ["Event Set Up Time:", "Event Set Up Time", "EventSetUpTime"], value: formatTime(event.setup_time) },
      { names: ["Event Duration:", "Event Duration", "EventDuration"], value: event.duration || '' },
      { names: ["DP Staff Attending:", "DP Staff Attending", "DPStaffAttending"], value: getAssignedEmployees() },
      { names: ["Event Contact(Name, Phone):", "Event Contact", "EventContact"], value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      // Try many variations for Expected Attendees
      { names: ["Expected # of Attendees:", "Expected # of Attendees", "ExpectedAttendees", 
                "Expected#ofAttendees:", "Expected#ofAttendees", "ExpectedofAttendees",
                "Expected", "Attendees", "Expected Attendees"], value: event.expected_attendees?.toString() || '' },
      { names: ["Additional Supplies:", "Additional Supplies"], value: event.supplies?.additional_supplies || '' },
      { names: ["Event Instructions:", "Event Instructions"], value: event.event_instructions || event.info || '' }
    ];
    
    // Process event section text fields
    console.log('Setting event text fields...');
    let textFieldsSet = 0;
    
    // Try each name variation for each field
    textFieldMappings.forEach(mapping => {
      let fieldSet = false;
      
      for (const name of mapping.names) {
        if (!fieldSet && fieldNames.includes(name)) {
          try {
            const textField = form.getTextField(name);
            textField.setText(mapping.value);
            // Set a consistent font size
            try { textField.setFontSize(10); } catch (e) { /* ignore font errors */ }
            console.log(`Set field "${name}" to "${mapping.value}"`);
            fieldSet = true;
            textFieldsSet++;
          } catch (e) {
            console.warn(`Could not set field "${name}":`, e);
          }
        }
      }
      
      if (!fieldSet) {
        console.warn(`Could not find field for values: ${mapping.value} (tried names: ${mapping.names.join(', ')})`);
      }
    });
    
    // Step 1b: Special handling for Expected Attendees (if it wasn't set above)
    // Try to find the field by looking for any field that might contain "attendees" in its name
    if (!textFieldMappings[6].names.some(name => fieldNames.includes(name))) {
      console.log('Trying alternative approach for Expected Attendees...');
      
      // Look for any field with "attendee" in the name (case insensitive)
      const attendeesFields = fieldNames.filter(name => 
        name.toLowerCase().includes('attendee') || 
        name.toLowerCase().includes('expected')
      );
      
      for (const fieldName of attendeesFields) {
        try {
          const field = form.getTextField(fieldName);
          field.setText(event.expected_attendees?.toString() || '');
          try { field.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set attendees field "${fieldName}" to "${event.expected_attendees}"`);
          break; // Stop after first successful set
        } catch (e) {
          console.warn(`Could not set attendees field "${fieldName}":`, e);
        }
      }
    }
    
    // Step 2: Set checkbox fields
    console.log('Setting checkboxes...');
    const checkboxMappings = [
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
    
    checkboxMappings.forEach(mapping => {
      if (fieldNames.includes(mapping.name)) {
        try {
          const checkbox = form.getCheckBox(mapping.name);
          if (mapping.checked) {
            checkbox.check();
            console.log(`Checked "${mapping.name}"`);
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${mapping.name}":`, e);
        }
      }
    });
    
    // Step 3: If "Other" is checked, fill in the "Other" text field
    if (event.event_type === 'other' && event.event_type_other) {
      const otherTextFieldNames = [
        "Other :", "Other:", "Other Text", "OtherText"
      ];
      
      let otherFieldSet = false;
      for (const name of otherTextFieldNames) {
        if (!otherFieldSet && fieldNames.includes(name)) {
          try {
            const textField = form.getTextField(name);
            textField.setText(event.event_type_other);
            try { textField.setFontSize(10); } catch (e) { /* ignore */ }
            console.log(`Set Other text field "${name}" to "${event.event_type_other}"`);
            otherFieldSet = true;
          } catch (e) {
            console.warn(`Could not set Other text field "${name}":`, e);
          }
        }
      }
      
      // If still not set, try any field with "Other" in the name
      if (!otherFieldSet) {
        const otherFields = fieldNames.filter(name => 
          name.includes('Other') && 
          name !== 'Other' && 
          !name.endsWith('Off')
        );
        
        for (const name of otherFields) {
          if (!otherFieldSet) {
            try {
              const textField = form.getTextField(name);
              textField.setText(event.event_type_other);
              try { textField.setFontSize(10); } catch (e) { /* ignore */ }
              console.log(`Set Other text field "${name}" to "${event.event_type_other}"`);
              otherFieldSet = true;
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
    }
    
    // Step 4: Handle beer dropdowns - clear all first, then set only the ones with data
    console.log('Setting beer fields...');
    
    // First, clear all beer dropdowns to ensure empty rows stay empty
    for (let i = 1; i <= 5; i++) {
      try {
        const styleField = form.getDropdown(`Beer Style ${i}`);
        styleField.select('');  // Try to clear the selection
      } catch (e) {
        // Ignore errors
      }
      
      try {
        const packageField = form.getDropdown(`Package Style ${i}`);
        packageField.select('');  // Try to clear the selection
      } catch (e) {
        // Ignore errors
      }
      
      try {
        const qtyField = form.getTextField(`Quantity ${i}`);
        qtyField.setText('');  // Clear quantity field
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Now set only the beer rows that have data
    const beers = event.beers || [];
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      if (!beer.beer_style && !beer.packaging && !beer.quantity) {
        // Skip completely empty beer entries
        continue;
      }
      
      const index = i + 1;
      
      // Process beer style dropdown
      if (beer.beer_style) {
        try {
          const styleField = form.getDropdown(`Beer Style ${index}`);
          
          // Check if the option exists in the dropdown
          const options = styleField.getOptions();
          if (options.includes(beer.beer_style)) {
            styleField.select(beer.beer_style);
          } else {
            // If the option doesn't exist, add it
            styleField.setOptions([...options, beer.beer_style]);
            styleField.select(beer.beer_style);
          }
          console.log(`Set beer style ${index} to "${beer.beer_style}"`);
        } catch (e) {
          console.warn(`Failed to set beer style ${index}:`, e);
        }
      }
      
      // Process package dropdown
      if (beer.packaging) {
        try {
          const packageField = form.getDropdown(`Package Style ${index}`);
          
          // Check if the option exists in the dropdown
          const options = packageField.getOptions();
          if (options.includes(beer.packaging)) {
            packageField.select(beer.packaging);
          } else {
            // If the option doesn't exist, add it
            packageField.setOptions([...options, beer.packaging]);
            packageField.select(beer.packaging);
          }
          console.log(`Set package style ${index} to "${beer.packaging}"`);
        } catch (e) {
          console.warn(`Failed to set package style ${index}:`, e);
        }
      }
      
      // Process quantity field
      if (beer.quantity) {
        try {
          const qtyField = form.getTextField(`Quantity ${index}`);
          qtyField.setText(beer.quantity.toString());
          try { qtyField.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set quantity ${index} to "${beer.quantity}"`);
        } catch (e) {
          console.warn(`Failed to set quantity ${index}:`, e);
        }
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
    
    console.log("PDF downloaded successfully");
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}