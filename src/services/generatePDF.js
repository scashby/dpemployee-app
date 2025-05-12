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
      // Try multiple naming formats for each field
      { names: ["Event Name :", "Event Name", "EventName"], value: event.title || '' },
      { names: ["Event Date:", "Event Date", "EventDate"], value: formatDate(event.date) },
      { names: ["Event Set Up Time:", "Event Set Up Time", "EventSetUpTime"], value: formatTime(event.setup_time) },
      { names: ["Event Duration:", "Event Duration", "EventDuration"], value: event.duration || '' },
      { names: ["DP Staff Attending:", "DP Staff Attending", "DPStaffAttending"], value: getAssignedEmployees() },
      { names: ["Event Contact(Name, Phone):", "Event Contact", "EventContact"], value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { names: ["Expected # of Attendees:", "Expected # of Attendees", "ExpectedAttendees"], value: event.expected_attendees?.toString() || '' },
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
    
    // Step 2: Set checkbox fields - we know these work from the FDF
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
    
    // Step 3: If "Other" is checked, try to find a field for the "Other" text
    if (event.event_type === 'other' && event.event_type_other) {
      // First try to find a field for Other text
      const otherTextFieldNames = [
        `Other :`,
        `Other:`,
        `Other Text`,
        `OtherText`
      ];
      
      let otherFieldSet = false;
      for (const name of otherTextFieldNames) {
        if (!otherFieldSet && fieldNames.includes(name)) {
          try {
            const textField = form.getTextField(name);
            textField.setText(event.event_type_other);
            try { textField.setFontSize(10); } catch (e) { /* ignore font errors */ }
            console.log(`Set Other text field "${name}" to "${event.event_type_other}"`);
            otherFieldSet = true;
          } catch (e) {
            console.warn(`Could not set Other text field "${name}":`, e);
          }
        }
      }
      
      // If we couldn't find a specific field, look for any field with "Other" in the name
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
              try { textField.setFontSize(10); } catch (e) { /* ignore font errors */ }
              console.log(`Set Other text field "${name}" to "${event.event_type_other}"`);
              otherFieldSet = true;
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
    }
    
    // Step 4: Handle beer table fields
    console.log('Setting beer fields...');
    const beers = event.beers || [];
    
    // For each beer row (up to 5 rows)
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      const index = i + 1;
      
      // Process beer style field (dropdown)
      if (beer.beer_style) {
        const styleFieldName = `Beer Style ${index}`;
        if (fieldNames.includes(styleFieldName)) {
          try {
            const styleField = form.getDropdown(styleFieldName);
            // Attempt to select the value
            styleField.select(beer.beer_style);
            console.log(`Set beer style ${index} to "${beer.beer_style}"`);
          } catch (e) {
            // If selecting fails, try alternative approach
            console.warn(`Failed to set beer style ${index}:`, e);
            
            // Try as a text field instead
            try {
              const textField = form.getTextField(styleFieldName);
              textField.setText(beer.beer_style);
              console.log(`Set beer style ${index} as text to "${beer.beer_style}"`);
            } catch (e2) {
              console.warn(`Also failed to set beer style ${index} as text:`, e2);
            }
          }
        }
      }
      
      // Process package style field (dropdown)
      if (beer.packaging) {
        const packageFieldName = `Package Style ${index}`;
        if (fieldNames.includes(packageFieldName)) {
          try {
            const packageField = form.getDropdown(packageFieldName);
            // Attempt to select the value
            packageField.select(beer.packaging);
            console.log(`Set package style ${index} to "${beer.packaging}"`);
          } catch (e) {
            // If selecting fails, try alternative approach
            console.warn(`Failed to set package style ${index}:`, e);
            
            // Try as a text field instead
            try {
              const textField = form.getTextField(packageFieldName);
              textField.setText(beer.packaging);
              console.log(`Set package style ${index} as text to "${beer.packaging}"`);
            } catch (e2) {
              console.warn(`Also failed to set package style ${index} as text:`, e2);
            }
          }
        }
      }
      
      // Process quantity field (text field)
      const qtyFieldName = `Quantity ${index}`;
      if (fieldNames.includes(qtyFieldName)) {
        try {
          const qtyField = form.getTextField(qtyFieldName);
          qtyField.setText(beer.quantity?.toString() || '');
          try { qtyField.setFontSize(10); } catch (e) { /* ignore font errors */ }
          console.log(`Set quantity ${index} to "${beer.quantity}"`);
        } catch (e) {
          console.warn(`Failed to set quantity ${index}:`, e);
        }
      }
    }
    
    // Step 5: For beer styles and packages that weren't set, attempt a more direct approach
    // This handles the case where the PDF doesn't let us directly modify dropdowns
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
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