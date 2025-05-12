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

    // The FDF file shows these field names are definitely present as checkboxes
    const knownFieldsFromFDF = [
      "Beer Buckets", "Beer Fest", "Cups", "Ice", "Jockey Box", 
      "Other", "Pint Night", "Signage", "Table", "Table Cloth", 
      "Tasting", "Tent Weights"
    ];
    
    // Try to infer the rest of the field structure from known fields
    console.log('Known fields from FDF:', knownFieldsFromFDF);
    console.log('Actual fields in PDF:', fieldNames);
    
    // Special handling specifically for the expected # of attendees field
    // Look for a field that might hold a number and is near/related to "attendees"
    const attendeesField = fieldNames.find(name => 
      name.includes('Expected') || 
      name.includes('Attendees') || 
      name.includes('attendees') ||
      name.startsWith('Expected #')
    );
    
    if (attendeesField) {
      console.log('Found attendees field:', attendeesField);
      try {
        const field = form.getTextField(attendeesField);
        field.setText(event.expected_attendees?.toString() || '');
        console.log(`Set ${attendeesField} to ${event.expected_attendees}`);
      } catch (e) {
        console.warn(`Error setting attendees field:`, e);
      }
    } else {
      console.warn('Could not find Expected # of Attendees field');
    }
    
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
      
      // Additional sections
      "Additional Supplies:": event.supplies?.additional_supplies || '',
      "Additional Supplies": event.supplies?.additional_supplies || '',
      
      "Event Instructions:": event.event_instructions || event.info || '',
      "Event Instructions": event.event_instructions || event.info || '',
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
    
    // Special handling for the "Other" text field
    if (event.event_type === 'other' && event.event_type_other) {
      // Try to find the Other text field by looking for fields with similar names
      const otherTextField = fieldNames.find(name => 
        name.includes('Other :') ||
        name.includes('Other Text') ||
        (name.includes('Other') && !knownFieldsFromFDF.includes(name))
      );
      
      if (otherTextField) {
        try {
          const field = form.getTextField(otherTextField);
          field.setText(event.event_type_other);
          console.log(`Set Other text field ${otherTextField} to ${event.event_type_other}`);
        } catch (e) {
          console.warn(`Error setting Other text field:`, e);
        }
      }
    }
    
    // Set checkboxes - use the exact names from the FDF file
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
    
    // Handle beer table fields - special handling for package style fields
    console.log('Setting beer table fields...');
    const beers = event.beers || [];
    
    // Find all potential table cells for beers
    const beerStyleFields = fieldNames.filter(name => name.includes('Beer Style') || name.includes('BeerStyle'));
    const pkgFields = fieldNames.filter(name => name.includes('Pkg') || name.includes('Package'));
    const qtyFields = fieldNames.filter(name => name.includes('Qty') || name.includes('Quantity'));
    
    console.log('Found Beer Style fields:', beerStyleFields);
    console.log('Found Package fields:', pkgFields);
    console.log('Found Quantity fields:', qtyFields);
    
    // Clear all beer fields first
    [...beerStyleFields, ...pkgFields, ...qtyFields].forEach(fieldName => {
      try {
        const field = form.getTextField(fieldName);
        field.setText('');
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Set beer values - Carefully handle the package fields which have the + sign issue
    for (let i = 0; i < Math.min(beers.length, beerStyleFields.length); i++) {
      const beer = beers[i];
      if (!beer || (!beer.beer_style && !beer.packaging && !beer.quantity)) {
        continue;
      }
      
      // Set beer style
      if (beer.beer_style && i < beerStyleFields.length) {
        try {
          const field = form.getTextField(beerStyleFields[i]);
          field.setText(beer.beer_style);
          console.log(`Set beer style ${i+1} to "${beer.beer_style}"`);
        } catch (e) {
          console.warn(`Error setting beer style ${i+1}:`, e);
        }
      }
      
      // Set package - CRITICAL FIX for + sign issue
      if (beer.packaging && i < pkgFields.length) {
        try {
          const field = form.getTextField(pkgFields[i]);
          
          // Directly set the package field value, avoiding any automatic formatting
          // and make sure it actually overrides any pre-existing content
          field.setText('');  // Clear first
          field.setFontSize(10);  // Set font size
          
          // Force it to update with the package value
          setTimeout(() => {
            field.setText(beer.packaging);
            console.log(`Set package ${i+1} to "${beer.packaging}"`);
          }, 0);
        } catch (e) {
          console.warn(`Error setting package ${i+1}:`, e);
        }
      }
      
      // Set quantity
      if (beer.quantity && i < qtyFields.length) {
        try {
          const field = form.getTextField(qtyFields[i]);
          field.setText(beer.quantity.toString());
          console.log(`Set quantity ${i+1} to "${beer.quantity}"`);
        } catch (e) {
          console.warn(`Error setting quantity ${i+1}:`, e);
        }
      }
    }
    
    // Force flatten to lock in the values - might help with the package field issue
    try {
      // Form not flattened so user can still edit fields
      console.log('Finalizing PDF...');
    } catch (e) {
      console.warn('Error finalizing form:', e);
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