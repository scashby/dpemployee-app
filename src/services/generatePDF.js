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
    
    // Get all form fields and their types
    const fields = form.getFields();
    let fieldDetails = fields.map(f => ({
      name: f.getName(),
      type: f.constructor.name
    }));
    console.log('All form fields:', fieldDetails);
    
    // First, try to identify dropdown/choice fields
    const dropdownFields = fields.filter(f => 
      f.constructor.name.includes('Choice') || 
      f.constructor.name.includes('Combo')
    );
    console.log('Dropdown fields:', dropdownFields.map(f => f.getName()));
    
    // Specifically log field types to help with debugging
    console.log('Field types found:', 
      [...new Set(fields.map(f => f.constructor.name))].join(', ')
    );
    
    // Try to get form field options for dropdowns
    dropdownFields.forEach(field => {
      try {
        const dropdown = form.getDropdown(field.getName());
        const options = dropdown.getOptions();
        console.log(`Dropdown "${field.getName()}" options:`, options);
      } catch (e) {
        console.log(`Could not get options for "${field.getName()}":`, e.message);
      }
    });
    
    // Map the exact field names from the FDF with additional variations for text fields
    const fieldMap = [
      // Text Fields - try exact names + variations
      { names: ["Event Name", "EventName"], value: event.title || '', type: 'text' },
      { names: ["Event Date", "EventDate"], value: formatDate(event.date), type: 'text' },
      { names: ["Event Set Up Time", "EventSetUpTime", "Setup Time"], value: formatTime(event.setup_time), type: 'text' },
      { names: ["Event Duration", "EventDuration"], value: event.duration || '', type: 'text' },
      { names: ["DP Staff Attending", "DPStaffAttending", "Staff Attending"], value: getAssignedEmployees(), type: 'text' },
      { names: ["Event Contact(Name, Phone)", "EventContact", "Contact", "ContactInfo"], value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '', type: 'text' },
      { names: ["Expected # of Attendees", "ExpectedAttendees", "Expected", "Attendees"], value: event.expected_attendees?.toString() || '', type: 'text' },
      { names: ["Additional Supplies", "AdditionalSupplies"], value: event.supplies?.additional_supplies || '', type: 'text' },
      { names: ["Event Instructions", "EventInstructions", "Instructions"], value: event.event_instructions || event.info || '', type: 'text' },
      { names: ["Other Text", "OtherText", "Other Details", "other_text", "OtherSpecify"], value: event.event_type === 'other' ? event.event_type_other || '' : '', type: 'text' }
    ];
    
    // Checkboxes - use exact names from the FDF
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
    
    // Beer fields
    const beers = event.beers || [];
    
    // Process text fields with multiple name variations
    console.log('Setting text fields...');
    let textFieldsSet = 0;
    
    fieldMap.forEach(field => {
      let fieldSet = false;
      
      field.names.forEach(name => {
        if (!fieldSet) {
          try {
            // Try as text field first
            try {
              const textField = form.getTextField(name);
              textField.setText(field.value);
              textField.setFontSize(10);
              console.log(`Set text field "${name}" to "${field.value}"`);
              fieldSet = true;
              textFieldsSet++;
            } catch (e) {
              // If not a text field, try as a dropdown
              try {
                const dropdown = form.getDropdown(name);
                if (field.value && dropdown.getOptions().includes(field.value)) {
                  dropdown.select(field.value);
                  console.log(`Selected option "${field.value}" in dropdown "${name}"`);
                  fieldSet = true;
                  textFieldsSet++;
                } else {
                  console.log(`Value "${field.value}" not found in dropdown options for "${name}"`);
                }
              } catch (e2) {
                // Not a dropdown either
              }
            }
          } catch (e) {
            // Field not found or other error
          }
        }
      });
      
      if (!fieldSet) {
        console.warn(`Could not set any field for value "${field.value}" (tried names: ${field.names.join(', ')})`);
      }
    });
    
    console.log(`Set ${textFieldsSet} text fields`);
    
    // Set checkboxes
    console.log('Setting checkboxes...');
    let checkboxesSet = 0;
    
    checkboxMap.forEach(checkbox => {
      try {
        const checkboxField = form.getCheckBox(checkbox.name);
        if (checkbox.checked) {
          checkboxField.check();
          console.log(`Checked "${checkbox.name}"`);
          checkboxesSet++;
        } else {
          checkboxField.uncheck();
          console.log(`Unchecked "${checkbox.name}"`);
        }
      } catch (e) {
        console.warn(`Failed to set checkbox "${checkbox.name}":`, e.message);
      }
    });
    
    console.log(`Set ${checkboxesSet} checkboxes`);
    
    // Now try multiple approaches for beer fields
    console.log('Setting beer fields...');
    let beerFieldsSet = 0;
    
    // Approach 1: Direct field access for beer fields - we know these are in the form
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      const index = i + 1;
      
      // Set beer style dropdown
      try {
        const styleField = `Beer Style ${index}`;
        // Try as dropdown first
        try {
          const dropdown = form.getDropdown(styleField);
          const options = dropdown.getOptions();
          
          // If beer style is in the options, select it
          if (options.includes(beer.beer_style)) {
            dropdown.select(beer.beer_style);
            console.log(`Selected style "${beer.beer_style}" for beer ${index}`);
            beerFieldsSet++;
          } else {
            // If not in options, try to set it directly (may work with editable combos)
            dropdown.setSelectedOptions([beer.beer_style]);
            console.log(`Set custom style "${beer.beer_style}" for beer ${index}`);
            beerFieldsSet++;
          }
        } catch (e) {
          // If not a dropdown, try as text field
          try {
            const textField = form.getTextField(styleField);
            textField.setText(beer.beer_style || '');
            textField.setFontSize(10);
            console.log(`Set style text field "${styleField}" to "${beer.beer_style}"`);
            beerFieldsSet++;
          } catch (e2) {
            console.warn(`Could not set beer style ${index}:`, e2.message);
          }
        }
      } catch (e) {
        console.warn(`Error setting beer style ${index}:`, e.message);
      }
      
      // Set package style dropdown
      try {
        const packageField = `Package Style ${index}`;
        // Try as dropdown first
        try {
          const dropdown = form.getDropdown(packageField);
          const options = dropdown.getOptions();
          
          // If package style is in the options, select it
          if (options.includes(beer.packaging)) {
            dropdown.select(beer.packaging);
            console.log(`Selected package "${beer.packaging}" for beer ${index}`);
            beerFieldsSet++;
          } else {
            // If not in options, try to set it directly (may work with editable combos)
            dropdown.setSelectedOptions([beer.packaging]);
            console.log(`Set custom package "${beer.packaging}" for beer ${index}`);
            beerFieldsSet++;
          }
        } catch (e) {
          // If not a dropdown, try as text field
          try {
            const textField = form.getTextField(packageField);
            textField.setText(beer.packaging || '');
            textField.setFontSize(10);
            console.log(`Set package text field "${packageField}" to "${beer.packaging}"`);
            beerFieldsSet++;
          } catch (e2) {
            console.warn(`Could not set beer package ${index}:`, e2.message);
          }
        }
      } catch (e) {
        console.warn(`Error setting beer package ${index}:`, e.message);
      }
      
      // Set quantity
      try {
        const quantityField = `Quantity ${index}`;
        try {
          const textField = form.getTextField(quantityField);
          textField.setText(beer.quantity?.toString() || '');
          textField.setFontSize(10);
          console.log(`Set quantity field "${quantityField}" to "${beer.quantity}"`);
          beerFieldsSet++;
        } catch (e) {
          console.warn(`Could not set beer quantity ${index}:`, e.message);
        }
      } catch (e) {
        console.warn(`Error setting beer quantity ${index}:`, e.message);
      }
    }
    
    console.log(`Set ${beerFieldsSet} beer fields`);
    
    // Special handling for "Other Text" field if it wasn't set above
    if (event.event_type === 'other' && event.event_type_other) {
      // Try all possible field names for "Other Text"
      const otherFieldNames = [
        "Other Text", "OtherText", "other_text", "Other Details", 
        "OtherDetails", "Other Information", "OtherSpecify"
      ];
      
      let otherFieldSet = false;
      
      // Try setting the other text field with numerous name variations
      otherFieldNames.forEach(fieldName => {
        if (!otherFieldSet) {
          try {
            const textField = form.getTextField(fieldName);
            textField.setText(event.event_type_other);
            textField.setFontSize(10);
            console.log(`Set other text field "${fieldName}" to "${event.event_type_other}"`);
            otherFieldSet = true;
          } catch (e) {
            // Field not found or not a text field
          }
        }
      });
      
      // If we still can't find the field, try a more broad approach
      if (!otherFieldSet) {
        // Look for any field with "other" in the name that's not a checkbox
        const otherFields = fields.filter(f => 
          f.getName().toLowerCase().includes('other') && 
          !f.constructor.name.includes('CheckBox')
        );
        
        otherFields.forEach(field => {
          if (!otherFieldSet && field.constructor.name.includes('Text')) {
            try {
              const textField = form.getTextField(field.getName());
              textField.setText(event.event_type_other);
              textField.setFontSize(10);
              console.log(`Set other text field "${field.getName()}" to "${event.event_type_other}"`);
              otherFieldSet = true;
            } catch (e) {
              console.warn(`Could not set other text field "${field.getName()}":`, e.message);
            }
          }
        });
      }
      
      if (!otherFieldSet) {
        console.warn(`Could not find any text field for "Other" details`);
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