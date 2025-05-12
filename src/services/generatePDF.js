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

    // Create field variations to try different naming patterns
    const fieldVariations = (baseName) => [
      baseName, 
      `${baseName}:`,
      baseName.replace(/\s/g, '_').toLowerCase()
    ];

    // Load the template PDF from the public folder
    console.log('Loading template PDF...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all field names for reference
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('PDF form fields:', fieldNames);
    
    // ====== 1. Set text fields ======
    const textFieldData = [
      { base: "Event Name", value: event.title || '' },
      { base: "Event Date", value: formatDate(event.date) },
      { base: "Event Set Up Time", value: event.setup_time || '' },
      { base: "Event Duration", value: event.duration || '' },
      { base: "DP Staff Attending", value: getAssignedEmployees() },
      { base: "Event Contact", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { base: "Expected # of Attendees", value: event.expected_attendees?.toString() || '' },
      { base: "Additional Supplies", value: event.supplies?.additional_supplies || '' },
      { base: "Event Instructions", value: event.event_instructions || event.info || '' }
    ];
    
    // Try to set each text field with all its variations
    console.log('Setting text fields...');
    let textFieldsSet = 0;
    textFieldData.forEach(field => {
      fieldVariations(field.base).forEach(fieldName => {
        if (fieldNames.includes(fieldName)) {
          try {
            const textField = form.getTextField(fieldName);
            textField.setText(field.value);
            console.log(`Successfully set field "${fieldName}" to "${field.value}"`);
            textFieldsSet++;
          } catch (e) {
            console.warn(`Failed to set field "${fieldName}":`, e.message);
          }
        }
      });
    });
    console.log(`Set ${textFieldsSet} text fields`);
    
    // ====== 2. Set checkboxes ======
    const checkboxData = [
      // Event type checkboxes
      { base: "Tasting", checked: event.event_type === 'tasting' },
      { base: "Pint Night", checked: event.event_type === 'pint_night' },
      { base: "Beer Fest", checked: event.event_type === 'beer_fest' },
      { base: "Other", checked: event.event_type === 'other' },
      
      // Supply checkboxes - we know some of these work
      { base: "Table", checked: event.supplies?.table_needed },
      { base: "Beer buckets", checked: event.supplies?.beer_buckets },
      { base: "Table Cloth", checked: event.supplies?.table_cloth },
      { base: "Tent/Weights", checked: event.supplies?.tent_weights },
      { base: "Signage", checked: event.supplies?.signage },
      { base: "Ice", checked: event.supplies?.ice },
      { base: "Jockey box", checked: event.supplies?.jockey_box },
      { base: "Cups", checked: event.supplies?.cups }
    ];
    
    // Try to check each checkbox with all its variations
    console.log('Setting checkboxes...');
    let checkboxesSet = 0;
    checkboxData.forEach(checkbox => {
      if (checkbox.checked) {
        fieldVariations(checkbox.base).forEach(fieldName => {
          if (fieldNames.includes(fieldName)) {
            try {
              const checkboxField = form.getCheckBox(fieldName);
              checkboxField.check();
              console.log(`Successfully checked "${fieldName}"`);
              checkboxesSet++;
            } catch (e) {
              console.warn(`Failed to check "${fieldName}":`, e.message);
            }
          }
        });
      }
    });
    console.log(`Set ${checkboxesSet} checkboxes`);
    
    // ====== 3. Set beer table fields ======
    console.log('Setting beer table fields...');
    const beers = event.beers || [];
    let beerFieldsSet = 0;
    
    // Try different pattern variations for beer table fields
    const beerTablePatterns = [
      { style: "Beer Style {}", pkg: "Pkg {}", qty: "Qty {}" },
      { style: "beer_{}_style", pkg: "beer_{}_pkg", qty: "beer_{}_qty" },
      { style: "beer_style_{}", pkg: "pkg_{}", qty: "qty_{}" }
    ];
    
    beers.forEach((beer, index) => {
      const rowNum = index + 1;
      
      beerTablePatterns.forEach(pattern => {
        const styleField = pattern.style.replace("{}", rowNum);
        const pkgField = pattern.pkg.replace("{}", rowNum);
        const qtyField = pattern.qty.replace("{}", rowNum);
        
        // Check if any of these fields exist in our form
        if (fieldNames.includes(styleField)) {
          try {
            form.getTextField(styleField).setText(beer.beer_style || '');
            console.log(`Set beer style ${rowNum} to "${beer.beer_style}"`);
            beerFieldsSet++;
          } catch (e) {
            console.warn(`Could not set beer style ${rowNum}:`, e.message);
          }
        }
        
        if (fieldNames.includes(pkgField)) {
          try {
            form.getTextField(pkgField).setText(beer.packaging || '');
            console.log(`Set beer packaging ${rowNum} to "${beer.packaging}"`);
            beerFieldsSet++;
          } catch (e) {
            console.warn(`Could not set beer packaging ${rowNum}:`, e.message);
          }
        }
        
        if (fieldNames.includes(qtyField)) {
          try {
            form.getTextField(qtyField).setText(beer.quantity?.toString() || '');
            console.log(`Set beer quantity ${rowNum} to "${beer.quantity}"`);
            beerFieldsSet++;
          } catch (e) {
            console.warn(`Could not set beer quantity ${rowNum}:`, e.message);
          }
        }
      });
    });
    console.log(`Set ${beerFieldsSet} beer fields`);
    
    // ====== 4. Fallback approach - try to infer field purpose from name ======
    if (textFieldsSet === 0) {
      console.log('Using fallback approach for text fields...');
      
      // Try to infer field purpose from field name
      fields.forEach(field => {
        const fieldName = field.getName().toLowerCase();
        let value = null;
        
        // Map field name to appropriate value based on keywords
        if (fieldName.includes('name') && !fieldName.includes('contact')) {
          value = event.title || '';
        } else if (fieldName.includes('date')) {
          value = formatDate(event.date);
        } else if (fieldName.includes('setup') || fieldName.includes('set up')) {
          value = event.setup_time || '';
        } else if (fieldName.includes('duration')) {
          value = event.duration || '';
        } else if (fieldName.includes('staff')) {
          value = getAssignedEmployees();
        } else if (fieldName.includes('contact')) {
          value = event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '';
        } else if (fieldName.includes('attendee')) {
          value = event.expected_attendees?.toString() || '';
        } else if (fieldName.includes('additional') && fieldName.includes('suppl')) {
          value = event.supplies?.additional_supplies || '';
        } else if (fieldName.includes('instruction')) {
          value = event.event_instructions || event.info || '';
        }
        // Beer fields based on patterns
        else if (fieldName.includes('beer') && fieldName.includes('style')) {
          const match = fieldName.match(/\d+/);
          const index = match ? parseInt(match[0]) - 1 : 0;
          value = event.beers && event.beers[index] ? event.beers[index].beer_style || '' : '';
        } else if (fieldName.includes('pkg') || fieldName.includes('package')) {
          const match = fieldName.match(/\d+/);
          const index = match ? parseInt(match[0]) - 1 : 0;
          value = event.beers && event.beers[index] ? event.beers[index].packaging || '' : '';
        } else if (fieldName.includes('qty') || fieldName.includes('quantity')) {
          const match = fieldName.match(/\d+/);
          const index = match ? parseInt(match[0]) - 1 : 0;
          value = event.beers && event.beers[index] ? event.beers[index].quantity?.toString() || '' : '';
        }
        
        if (value !== null) {
          try {
            // Try as text field first
            try {
              const textField = form.getTextField(field.getName());
              textField.setText(value);
              console.log(`Set ${field.getName()} = ${value}`);
            } catch (e) {
              // Try generic setValue as fallback
              try {
                field.setValue(value);
                console.log(`Set ${field.getName()} = ${value} using setValue`);
              } catch (e2) {
                console.warn(`Could not set value for ${field.getName()}:`, e2.message);
              }
            }
          } catch (e) {
            console.warn(`Failed to process field ${field.getName()}:`, e.message);
          }
        }
      });
    }
    
    // ====== 5. Try using generic field names for text fields ======
    if (textFieldsSet === 0) {
      console.log('Trying generic field names...');
      
      // Try common generic field names like "Text1", "Text2", etc.
      const genericValues = [
        event.title || '',                      // Text1
        formatDate(event.date),                 // Text2
        event.setup_time || '',                 // Text3
        event.duration || '',                   // Text4
        getAssignedEmployees(),                 // Text5
        event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '', // Text6
        event.expected_attendees?.toString() || '',   // Text7
        event.event_type === 'other' ? event.event_type_other || '' : '',  // Text8
        event.supplies?.additional_supplies || '',    // Text9
        event.event_instructions || event.info || ''  // Text10
      ];
      
      // Beer values for Text11-Text22
      event.beers?.forEach(beer => {
        genericValues.push(beer.beer_style || '');
        genericValues.push(beer.packaging || '');
        genericValues.push(beer.quantity?.toString() || '');
      });
      
      // Try to set generic text fields
      for (let i = 1; i <= genericValues.length; i++) {
        const possibleNames = [`Text${i}`, `TextField${i}`, `Field${i}`];
        
        possibleNames.forEach(name => {
          if (fieldNames.includes(name)) {
            try {
              form.getTextField(name).setText(genericValues[i-1]);
              console.log(`Set generic field ${name} to "${genericValues[i-1]}"`);
            } catch (e) {
              console.warn(`Failed to set generic field ${name}:`, e.message);
            }
          }
        });
      }
    }
    
    // Save the PDF without flattening to maintain field formatting
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