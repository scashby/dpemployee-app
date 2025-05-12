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
    
    // Get all form fields for debugging
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('PDF fields:', fieldNames);
    
    // Simple direct field mappings with exact names
    const fieldMappings = {
      // Event Information Section
      "Event Name :": event.title || '',
      "Event Date:": formatDate(event.date),
      "Event Set Up Time:": formatTime(event.setup_time),
      "Event Duration:": event.duration || '',
      "DP Staff Attending:": getAssignedEmployees(),
      "Event Contact(Name, Phone):": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "Expected # of Attendees:": event.expected_attendees?.toString() || '',
      
      // Other sections
      "Additional Supplies:": event.supplies?.additional_supplies || '',
      "Event Instructions:": event.event_instructions || event.info || '',
      "Other :": event.event_type === 'other' ? event.event_type_other || '' : ''
    };
    
    console.log('Setting basic text fields...');
    for (const [fieldName, value] of Object.entries(fieldMappings)) {
      if (fieldNames.includes(fieldName)) {
        try {
          const field = form.getTextField(fieldName);
          field.setText(value);
          console.log(`Set field "${fieldName}" to "${value}"`);
        } catch (e) {
          console.warn(`Could not set field "${fieldName}":`, e);
        }
      } else {
        console.warn(`Field "${fieldName}" not found in PDF`);
      }
    }
    
    // Set checkboxes - use exact names from FDF file
    console.log('Setting checkboxes...');
    const checkboxes = [
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
    
    for (const { name, checked } of checkboxes) {
      if (fieldNames.includes(name)) {
        try {
          const checkbox = form.getCheckBox(name);
          if (checked) {
            checkbox.check();
            console.log(`Checked "${name}"`);
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Could not set checkbox "${name}":`, e);
        }
      } else {
        console.warn(`Checkbox "${name}" not found in PDF`);
      }
    }

    // CRITICAL: Manual mapping for Beer Product table fields 
    // Don't try to be clever - use exact matches only
    const beerFieldMappings = [];
    const beers = event.beers || [];
    
    if (beers.length > 0 && beers[0]?.beer_style) {
      beerFieldMappings.push({ field: "Beer Style 1", value: beers[0].beer_style });
      beerFieldMappings.push({ field: "Pkg 1", value: beers[0].packaging || '' });
      beerFieldMappings.push({ field: "Qty 1", value: beers[0].quantity?.toString() || '' });
    }
    
    if (beers.length > 1 && beers[1]?.beer_style) {
      beerFieldMappings.push({ field: "Beer Style 2", value: beers[1].beer_style });
      beerFieldMappings.push({ field: "Pkg 2", value: beers[1].packaging || '' });
      beerFieldMappings.push({ field: "Qty 2", value: beers[1].quantity?.toString() || '' });
    }
    
    if (beers.length > 2 && beers[2]?.beer_style) {
      beerFieldMappings.push({ field: "Beer Style 3", value: beers[2].beer_style });
      beerFieldMappings.push({ field: "Pkg 3", value: beers[2].packaging || '' });
      beerFieldMappings.push({ field: "Qty 3", value: beers[2].quantity?.toString() || '' });
    }
    
    if (beers.length > 3 && beers[3]?.beer_style) {
      beerFieldMappings.push({ field: "Beer Style 4", value: beers[3].beer_style });
      beerFieldMappings.push({ field: "Pkg 4", value: beers[3].packaging || '' });
      beerFieldMappings.push({ field: "Qty 4", value: beers[3].quantity?.toString() || '' });
    }
    
    if (beers.length > 4 && beers[4]?.beer_style) {
      beerFieldMappings.push({ field: "Beer Style 5", value: beers[4].beer_style });
      beerFieldMappings.push({ field: "Pkg 5", value: beers[4].packaging || '' });
      beerFieldMappings.push({ field: "Qty 5", value: beers[4].quantity?.toString() || '' });
    }
    
    // Explicitly set beer table fields if found in the form
    console.log('Setting beer table fields...');
    for (const mapping of beerFieldMappings) {
      // Try exact name first
      if (fieldNames.includes(mapping.field)) {
        try {
          const field = form.getTextField(mapping.field);
          field.setText(mapping.value);
          console.log(`Set field "${mapping.field}" to "${mapping.value}"`);
        } catch (e) {
          console.warn(`Could not set field "${mapping.field}":`, e);
        }
      } 
      // Try other possible formats
      else {
        const variations = [
          mapping.field,
          mapping.field.replace(' ', ''),
          mapping.field.toLowerCase()
        ];
        
        let found = false;
        for (const variation of variations) {
          const possibleMatch = fieldNames.find(name => name.includes(variation));
          if (possibleMatch) {
            try {
              const field = form.getTextField(possibleMatch);
              field.setText(mapping.value);
              console.log(`Set field "${possibleMatch}" to "${mapping.value}"`);
              found = true;
              break;
            } catch (e) {
              console.warn(`Could not set field "${possibleMatch}":`, e);
            }
          }
        }
        
        if (!found) {
          console.warn(`Could not find any matching field for "${mapping.field}"`);
        }
      }
    }
    
    // Save and download the PDF
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