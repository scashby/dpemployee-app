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
    
    // Get all form fields and log their names for debugging
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Debug by logging field types
    const fieldTypes = {};
    fields.forEach(field => {
      fieldTypes[field.getName()] = field.constructor.name;
    });
    console.log('Field types:', fieldTypes);
    
    // Define all possible field name variations for important fields
    const exactFieldMappings = {
      // Event section - try many variations for each field
      "Event Name :": event.title || '',
      "Event Name": event.title || '',
      "EventName": event.title || '',
      
      "Event Date:": formatDate(event.date),
      "Event Date": formatDate(event.date),
      "EventDate": formatDate(event.date),
      
      "Event Set Up Time:": formatTime(event.setup_time),
      "Event Set Up Time": formatTime(event.setup_time),
      "EventSetUpTime": formatTime(event.setup_time),
      
      "Event Duration:": event.duration || '',
      "Event Duration": event.duration || '',
      "EventDuration": event.duration || '',
      
      "DP Staff Attending:": getAssignedEmployees(),
      "DP Staff Attending": getAssignedEmployees(),
      "DPStaffAttending": getAssignedEmployees(),
      
      // For Contact field - try many variations
      "Event Contact(Name, Phone):": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "Event Contact(Name, Phone)": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "EventContact": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "Event Contact": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "Contact": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      
      // For Expected Attendees - try many variations
      "Expected # of Attendees:": event.expected_attendees?.toString() || '',
      "Expected # of Attendees": event.expected_attendees?.toString() || '',
      "ExpectedAttendees": event.expected_attendees?.toString() || '',
      "Expected": event.expected_attendees?.toString() || '',
      "Attendees": event.expected_attendees?.toString() || '',
      
      // Other sections
      "Additional Supplies:": event.supplies?.additional_supplies || '',
      "Additional Supplies": event.supplies?.additional_supplies || '',
      
      "Event Instructions:": event.event_instructions || event.info || '',
      "Event Instructions": event.event_instructions || event.info || '',
      
      // Other text field variations
      "Other :": event.event_type === 'other' ? event.event_type_other || '' : '',
      "Other Text": event.event_type === 'other' ? event.event_type_other || '' : '',
      "OtherText": event.event_type === 'other' ? event.event_type_other || '' : ''
    };
    
    // Set all text fields with exact matches
    console.log('Setting text fields...');
    let textFieldsSet = 0;
    
    // Try to set fields with all possible name variations
    for (const fieldName in exactFieldMappings) {
      if (fieldNames.includes(fieldName)) {
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(exactFieldMappings[fieldName]);
          
          // Try to set consistent font size
          try { textField.setFontSize(10); } catch (e) { /* ignore */ }
          
          console.log(`Set field "${fieldName}" to "${exactFieldMappings[fieldName]}"`);
          textFieldsSet++;
        } catch (e) {
          console.warn(`Could not set field "${fieldName}":`, e);
        }
      }
    }
    
    // If the expected # of attendees wasn't set, do a broader search
    if (!Object.keys(exactFieldMappings).some(key => key.includes('Expected') && fieldNames.includes(key))) {
      // Try any field with "expect" or "attend" in the name (case insensitive)
      const attendeesFields = fieldNames.filter(name => 
        name.toLowerCase().includes('expect') || 
        name.toLowerCase().includes('attend')
      );
      
      for (const fieldName of attendeesFields) {
        try {
          const field = form.getTextField(fieldName);
          field.setText(event.expected_attendees?.toString() || '');
          try { field.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set attendees field "${fieldName}" to "${event.expected_attendees}"`);
          textFieldsSet++;
          break; // Stop after first successful set
        } catch (e) {
          console.warn(`Could not set attendees field "${fieldName}":`, e);
        }
      }
    }
    
    // Set checkboxes
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
    
    let checkboxesSet = 0;
    checkboxMappings.forEach(mapping => {
      if (fieldNames.includes(mapping.name)) {
        try {
          const checkbox = form.getCheckBox(mapping.name);
          if (mapping.checked) {
            checkbox.check();
            console.log(`Checked "${mapping.name}"`);
            checkboxesSet++;
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${mapping.name}":`, e);
        }
      }
    });
    
    // Handle beer table fields - now they should be text fields
    console.log('Setting beer table fields...');
    const beers = event.beers || [];
    
    // Clear all beer fields first
    for (let i = 1; i <= 5; i++) {
      // Try various versions of the field names
      const styleFieldNames = [`Beer Style ${i}`, `BeerStyle${i}`, `beer_style_${i}`];
      const packageFieldNames = [`Package Style ${i}`, `Pkg ${i}`, `PackageStyle${i}`, `package_${i}`];
      const quantityFieldNames = [`Quantity ${i}`, `Qty ${i}`, `quantity_${i}`];
      
      // Try to clear beer style
      for (const fieldName of styleFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            form.getTextField(fieldName).setText('');
            break;
          } catch (e) {
            // Ignore errors
          }
        }
      }
      
      // Try to clear package style
      for (const fieldName of packageFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            form.getTextField(fieldName).setText('');
            break;
          } catch (e) {
            // Ignore errors
          }
        }
      }
      
      // Try to clear quantity
      for (const fieldName of quantityFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            form.getTextField(fieldName).setText('');
            break;
          } catch (e) {
            // Ignore errors
          }
        }
      }
    }
    
    // Now set only beer rows that have data
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      if (!beer || (!beer.beer_style && !beer.packaging && !beer.quantity)) {
        continue;
      }
      
      const index = i + 1;
      
      // For beer style - try different field name formats
      if (beer.beer_style) {
        const styleFieldNames = [`Beer Style ${index}`, `BeerStyle${index}`, `beer_style_${index}`];
        let styleSet = false;
        
        for (const fieldName of styleFieldNames) {
          if (!styleSet && fieldNames.includes(fieldName)) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(beer.beer_style);
              try { field.setFontSize(10); } catch (e) { /* ignore */ }
              console.log(`Set beer style ${index} to "${beer.beer_style}" using field "${fieldName}"`);
              styleSet = true;
            } catch (e) {
              console.warn(`Could not set beer style ${index} using field "${fieldName}":`, e);
            }
          }
        }
      }
      
      // For package style - try different field name formats
      if (beer.packaging) {
        // Fix for package style fields
        // First try the exact field names
        const packageFieldNames = [`Package Style ${index}`, `Pkg ${index}`, `PackageStyle${index}`, `package_${index}`];
        let packageSet = false;
        
        for (const fieldName of packageFieldNames) {
          if (!packageSet && fieldNames.includes(fieldName)) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(beer.packaging);
              try { field.setFontSize(10); } catch (e) { /* ignore */ }
              console.log(`Set package style ${index} to "${beer.packaging}" using field "${fieldName}"`);
              packageSet = true;
            } catch (e) {
              console.warn(`Could not set package style ${index} using field "${fieldName}":`, e);
            }
          }
        }
        
        // If exact field names didn't work, try to find fields by name pattern
        if (!packageSet) {
          // Look for fields with "pkg" in the name (case insensitive)
          const pkgFields = fieldNames.filter(name => 
            name.toLowerCase().includes('pkg')
          );
          
          if (pkgFields.length > i) {
            try {
              const field = form.getTextField(pkgFields[i]);
              field.setText(beer.packaging);
              try { field.setFontSize(10); } catch (e) { /* ignore */ }
              console.log(`Set package style ${index} to "${beer.packaging}" using alternate field "${pkgFields[i]}"`);
              packageSet = true;
            } catch (e) {
              console.warn(`Could not set package style ${index} using alternate field:`, e);
            }
          }
        }
      }
      
      // For quantity - try different field name formats
      if (beer.quantity) {
        const quantityFieldNames = [`Quantity ${index}`, `Qty ${index}`, `quantity_${index}`];
        let qtySet = false;
        
        for (const fieldName of quantityFieldNames) {
          if (!qtySet && fieldNames.includes(fieldName)) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(beer.quantity.toString());
              try { field.setFontSize(10); } catch (e) { /* ignore */ }
              console.log(`Set quantity ${index} to "${beer.quantity}" using field "${fieldName}"`);
              qtySet = true;
            } catch (e) {
              console.warn(`Could not set quantity ${index} using field "${fieldName}":`, e);
            }
          }
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
    
    console.log(`PDF downloaded successfully. Set ${textFieldsSet} text fields and ${checkboxesSet} checkboxes.`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}