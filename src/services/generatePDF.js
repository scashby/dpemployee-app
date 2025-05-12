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
    
    // From the FDF file, we know the exact checkbox field names
    const knownCheckboxes = [
      "Beer Buckets", "Beer Fest", "Cups", "Ice", "Jockey Box", 
      "Other", "Pint Night", "Signage", "Table", "Table Cloth", 
      "Tasting", "Tent Weights"
    ];
    
    // SET CHECKBOXES - This part works correctly
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
      if (knownCheckboxes.includes(mapping.name)) {
        try {
          const checkbox = form.getCheckBox(mapping.name);
          if (mapping.checked) {
            checkbox.check();
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${mapping.name}":`, e.message);
        }
      }
    });
    
    // SPECIFICALLY TARGET PROBLEMATIC TEXT FIELDS
    console.log('Setting text fields...');
    
    // 1. Event Name - this field seems to work fine
    const eventNameField = fieldNames.find(name => 
      name === "Event Name :" || name === "Event Name"
    );
    if (eventNameField) {
      try {
        form.getTextField(eventNameField).setText(event.title || '');
        console.log(`Set ${eventNameField} to ${event.title}`);
      } catch (e) {
        console.warn(`Could not set Event Name: ${e.message}`);
      }
    }
    
    // 2. Event Date
    const eventDateField = fieldNames.find(name => 
      name === "Event Date:" || name === "Event Date"
    );
    if (eventDateField) {
      try {
        form.getTextField(eventDateField).setText(formatDate(event.date));
        console.log(`Set ${eventDateField} to ${formatDate(event.date)}`);
      } catch (e) {
        console.warn(`Could not set Event Date: ${e.message}`);
      }
    }
    
    // 3. Event Set Up Time
    const setupTimeField = fieldNames.find(name => 
      name === "Event Set Up Time:" || name === "Event Set Up Time"
    );
    if (setupTimeField) {
      try {
        form.getTextField(setupTimeField).setText(formatTime(event.setup_time));
        console.log(`Set ${setupTimeField} to ${formatTime(event.setup_time)}`);
      } catch (e) {
        console.warn(`Could not set Setup Time: ${e.message}`);
      }
    }
    
    // 4. Event Duration
    const durationField = fieldNames.find(name => 
      name === "Event Duration:" || name === "Event Duration"
    );
    if (durationField) {
      try {
        form.getTextField(durationField).setText(event.duration || '');
        console.log(`Set ${durationField} to ${event.duration}`);
      } catch (e) {
        console.warn(`Could not set Duration: ${e.message}`);
      }
    }
    
    // 5. DP Staff Attending
    const staffField = fieldNames.find(name => 
      name === "DP Staff Attending:" || name === "DP Staff Attending"
    );
    if (staffField) {
      try {
        form.getTextField(staffField).setText(getAssignedEmployees());
        console.log(`Set ${staffField} to ${getAssignedEmployees()}`);
      } catch (e) {
        console.warn(`Could not set Staff Attending: ${e.message}`);
      }
    }
    
    // 6. EXPLICITLY FIX: Event Contact
    const contactField = fieldNames.find(name => 
      name === "Event Contact(Name, Phone):" || 
      name === "Event Contact" ||
      name.includes("Contact")
    );
    if (contactField) {
      try {
        const contactText = event.contact_name ? 
          `${event.contact_name} ${event.contact_phone || ''}` : '';
        form.getTextField(contactField).setText(contactText);
        console.log(`Set ${contactField} to ${contactText}`);
      } catch (e) {
        console.warn(`Could not set Contact: ${e.message}`);
      }
    } else {
      console.warn("Contact field not found in any variation!");
    }
    
    // 7. EXPLICITLY FIX: Expected Attendees
    const attendeesField = fieldNames.find(name => 
      name === "Expected # of Attendees:" || 
      name === "Expected # of Attendees" ||
      name.includes("Expected") ||
      name.includes("Attendees")
    );
    if (attendeesField) {
      try {
        form.getTextField(attendeesField).setText(event.expected_attendees?.toString() || '');
        console.log(`Set ${attendeesField} to ${event.expected_attendees}`);
      } catch (e) {
        console.warn(`Could not set Expected Attendees: ${e.message}`);
      }
    } else {
      // Try all field names as a last resort
      console.warn("Expected Attendees field not found by name, trying all text fields...");
      for (const field of fields) {
        try {
          if (field.constructor.name === 'PDFTextField' && field.getText() === '') {
            if (field.getName().toLowerCase().includes('expected') || field.getName().toLowerCase().includes('attend')) {
              field.setText(event.expected_attendees?.toString() || '');
              console.log(`Set attendees using field ${field.getName()}`);
              break;
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // 8. Other Text for event type
    if (event.event_type === 'other' && event.event_type_other) {
      const otherTextField = fieldNames.find(name => 
        name === "Other :" || 
        (name.includes("Other") && name !== "Other")
      );
      if (otherTextField) {
        try {
          form.getTextField(otherTextField).setText(event.event_type_other);
          console.log(`Set ${otherTextField} to ${event.event_type_other}`);
        } catch (e) {
          console.warn(`Could not set Other Text: ${e.message}`);
        }
      }
    }
    
    // 9. Additional Supplies
    const suppliesField = fieldNames.find(name => 
      name === "Additional Supplies:" || 
      name === "Additional Supplies"
    );
    if (suppliesField) {
      try {
        form.getTextField(suppliesField).setText(event.supplies?.additional_supplies || '');
        console.log(`Set ${suppliesField} to ${event.supplies?.additional_supplies}`);
      } catch (e) {
        console.warn(`Could not set Additional Supplies: ${e.message}`);
      }
    }
    
    // 10. Event Instructions
    const instructionsField = fieldNames.find(name => 
      name === "Event Instructions:" || 
      name === "Event Instructions"
    );
    if (instructionsField) {
      try {
        form.getTextField(instructionsField).setText(event.event_instructions || event.info || '');
        console.log(`Set ${instructionsField} to ${event.event_instructions || event.info || ''}`);
      } catch (e) {
        console.warn(`Could not set Event Instructions: ${e.message}`);
      }
    }
    
    // EXPLICITLY FIX: Beer Table Fields
    console.log('Setting beer table fields...');
    const beers = event.beers || [];
    
    // Define all possible variants of beer table field names
    const beerFieldVariants = {
      style: ['Beer Style', 'BeerStyle', 'beerstyle'],
      pkg: ['Pkg', 'Package', 'pkg', 'package'],
      qty: ['Qty', 'Quantity', 'qty', 'quantity']
    };
    
    // SPECIAL HANDLING: First find ALL beer-related field names in the PDF
    const allStyleFields = fieldNames.filter(name => 
      beerFieldVariants.style.some(variant => name.includes(variant))
    );
    const allPkgFields = fieldNames.filter(name => 
      beerFieldVariants.pkg.some(variant => name.includes(variant))
    );
    const allQtyFields = fieldNames.filter(name => 
      beerFieldVariants.qty.some(variant => name.includes(variant))
    );
    
    console.log('Found beer style fields:', allStyleFields);
    console.log('Found package fields:', allPkgFields);
    console.log('Found quantity fields:', allQtyFields);
    
    // For each beer in our data, find the matching fields and set values
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      if (!beer) continue;
      
      const rowNum = i + 1;
      const numStr = rowNum.toString();
      
      // 11. EXPLICITLY FIX: Beer Style
      const styleField = allStyleFields.find(name => name.includes(numStr));
      if (styleField && beer.beer_style) {
        try {
          // Force direct raw text setting for style field
          const field = form.getTextField(styleField);
          
          // Clear any existing content first
          field.setText('');
          
          // Now set the actual value
          field.setText(beer.beer_style);
          console.log(`Set beer style ${rowNum} to "${beer.beer_style}" using field "${styleField}"`);
        } catch (e) {
          console.warn(`Could not set beer style ${rowNum}: ${e.message}`);
        }
      } else {
        console.warn(`Beer style field ${rowNum} not found!`);
      }
      
      // 12. EXPLICITLY FIX: Package Style
      const pkgField = allPkgFields.find(name => name.includes(numStr));
      if (pkgField && beer.packaging) {
        try {
          // Force direct raw text setting for package field
          const field = form.getTextField(pkgField);
          
          // Try a different approach for this problematic field
          field.setText('');
          field.setText(beer.packaging);
          console.log(`Set package ${rowNum} to "${beer.packaging}" using field "${pkgField}"`);
        } catch (e) {
          console.warn(`Could not set package ${rowNum}: ${e.message}`);
        }
      } else {
        console.warn(`Package field ${rowNum} not found!`);
      }
      
      // 13. Quantity
      const qtyField = allQtyFields.find(name => name.includes(numStr));
      if (qtyField && beer.quantity) {
        try {
          const field = form.getTextField(qtyField);
          field.setText(beer.quantity.toString());
          console.log(`Set quantity ${rowNum} to "${beer.quantity}" using field "${qtyField}"`);
        } catch (e) {
          console.warn(`Could not set quantity ${rowNum}: ${e.message}`);
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
    
    console.log('PDF downloaded successfully.');
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}