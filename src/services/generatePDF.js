import { PDFDocument } from 'pdf-lib';

export async function generatePDF(event, employees = [], eventAssignments = {}) {
  try {
    // Get assigned employees
    const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
      return employees.find(e => e.id === empId)?.name || '';
    }).join(', ');

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    // Load the template PDF from the public folder
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get form
    const form = pdfDoc.getForm();
    
    // List all fields to debug
    const fields = form.getFields();
    console.log("All form fields:", fields.map(f => ({
      name: f.getName(),
      type: f.constructor.name
    })));
    
    // Try directly setting field values by name, regardless of type
    try {
      const fieldData = [
        { name: "event_name", value: event.title || '' },
        { name: "event_date", value: formatDate(event.date) },
        { name: "event_setup", value: event.setup_time || '' },
        { name: "event_time", value: event.time || '' },
        { name: "event_duration", value: event.duration || '' },
        { name: "event_staff", value: assignedEmployees },
        { name: "event_contact", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
        { name: "expected_attendees", value: event.expected_attendees?.toString() || '' },
        { name: "additional_supplies", value: event.supplies?.additional_supplies || '' },
        { name: "event_instructions", value: event.event_instructions || event.info || '' },
        { name: "event_notes", value: event.notes?.critiques || '' }
      ];
      
      // Try to set each field
      for (const field of fieldData) {
        try {
          // Try multiple methods of setting the field
          try {
            // Try setting as text field
            form.getTextField(field.name).setText(field.value);
            console.log(`Set text field ${field.name}`);
          } catch (e) {
            console.log(`Could not set as text field: ${field.name}`, e);
            
            // Try looking for fields with similar names
            const matchingFields = fields.filter(f => 
              f.getName().toLowerCase().includes(field.name.toLowerCase()) ||
              field.name.toLowerCase().includes(f.getName().toLowerCase())
            );
            
            if (matchingFields.length > 0) {
              console.log(`Found ${matchingFields.length} similar fields for ${field.name}:`, 
                matchingFields.map(f => f.getName()));
                
              // Try to set each matching field
              for (const matchField of matchingFields) {
                try {
                  // Try generic "setValue" method
                  matchField.setValue(field.value);
                  console.log(`Set field ${matchField.getName()} using setValue`);
                } catch (e2) {
                  console.log(`Could not set ${matchField.getName()} using setValue`, e2);
                }
              }
            }
          }
        } catch (fieldError) {
          console.warn(`Failed to set field ${field.name}:`, fieldError);
        }
      }
      
      // Try to handle checkboxes - if checking doesn't work, try to fill with "X"
      const checkboxData = [
        { name: "tasting", checked: event.event_type === 'tasting' },
        { name: "pint_night", checked: event.event_type === 'pint_night' },
        { name: "beer_fest", checked: event.event_type === 'beer_fest' },
        { name: "other", checked: event.event_type === 'other' },
        { name: "table", checked: event.supplies?.table_needed },
        { name: "beer_buckets", checked: event.supplies?.beer_buckets },
        { name: "table_cloth", checked: event.supplies?.table_cloth },
        { name: "tent_weights", checked: event.supplies?.tent_weights },
        { name: "signage", checked: event.supplies?.signage },
        { name: "ice", checked: event.supplies?.ice },
        { name: "jockey_box", checked: event.supplies?.jockey_box },
        { name: "cups", checked: event.supplies?.cups }
      ];
      
      for (const checkbox of checkboxData) {
        if (checkbox.checked) {
          // Try to find matching checkbox fields
          const matchingFields = fields.filter(f => 
            f.getName().toLowerCase().includes(checkbox.name.toLowerCase()) ||
            checkbox.name.toLowerCase().includes(f.getName().toLowerCase())
          );
          
          if (matchingFields.length > 0) {
            console.log(`Found ${matchingFields.length} similar fields for ${checkbox.name}:`, 
              matchingFields.map(f => f.getName()));
              
            // Try to check each matching field
            for (const matchField of matchingFields) {
              try {
                // Try as checkbox
                try {
                  matchField.check();
                  console.log(`Checked ${matchField.getName()}`);
                } catch (e) {
                  // If can't check, try to set text "X"
                  try {
                    matchField.setValue("X");
                    console.log(`Set ${matchField.getName()} to "X"`);
                  } catch (e2) {
                    console.log(`Could not check or set ${matchField.getName()}`, e2);
                  }
                }
              } catch (checkError) {
                console.warn(`Failed to check ${matchField.getName()}:`, checkError);
              }
            }
          }
        }
      }
      
      // Try to handle beer table
      const beers = event.beers || [];
      for (let i = 0; i < Math.min(beers.length, 4); i++) {
        const beer = beers[i];
        const idx = i + 1;
        
        // Try with several naming patterns
        const beerFieldPatterns = [
          { style: `beer_${idx}_style`, pkg: `beer_${idx}_package`, qty: `beer_${idx}_quantity` },
          { style: `beer_${idx}`, pkg: `package_${idx}`, qty: `quantity_${idx}` },
          { style: `beer_style_${idx}`, pkg: `beer_pkg_${idx}`, qty: `beer_qty_${idx}` }
        ];
        
        for (const pattern of beerFieldPatterns) {
          try {
            // Try to find and set style field
            const styleFields = fields.filter(f => 
              f.getName().toLowerCase().includes(pattern.style.toLowerCase()) ||
              pattern.style.toLowerCase().includes(f.getName().toLowerCase())
            );
            
            if (styleFields.length > 0) {
              try {
                styleFields[0].setValue(beer.beer_style || '');
                console.log(`Set beer style ${idx} to "${beer.beer_style}"`);
              } catch (e) {
                console.warn(`Could not set beer style ${idx}`, e);
              }
            }
            
            // Try to find and set package field
            const pkgFields = fields.filter(f => 
              f.getName().toLowerCase().includes(pattern.pkg.toLowerCase()) ||
              pattern.pkg.toLowerCase().includes(f.getName().toLowerCase())
            );
            
            if (pkgFields.length > 0) {
              try {
                pkgFields[0].setValue(beer.packaging || '');
                console.log(`Set beer package ${idx} to "${beer.packaging}"`);
              } catch (e) {
                console.warn(`Could not set beer package ${idx}`, e);
              }
            }
            
            // Try to find and set quantity field
            const qtyFields = fields.filter(f => 
              f.getName().toLowerCase().includes(pattern.qty.toLowerCase()) ||
              pattern.qty.toLowerCase().includes(f.getName().toLowerCase())
            );
            
            if (qtyFields.length > 0) {
              try {
                qtyFields[0].setValue(beer.quantity?.toString() || '');
                console.log(`Set beer quantity ${idx} to "${beer.quantity}"`);
              } catch (e) {
                console.warn(`Could not set beer quantity ${idx}`, e);
              }
            }
          } catch (beerFieldError) {
            console.warn(`Failed with beer pattern ${JSON.stringify(pattern)}:`, beerFieldError);
          }
        }
      }
      
    } catch (formError) {
      console.error('Error filling form:', formError);
    }
    
    // Last resort approach - try to set all fields just to see if any of them work
    try {
      const allValues = [
        event.title || '',
        formatDate(event.date),
        event.setup_time || '',
        event.duration || '',
        assignedEmployees,
        event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
        event.expected_attendees?.toString() || '',
        "X", // For checkboxes
        event.supplies?.additional_supplies || '',
        event.event_instructions || event.info || ''
      ];
      
      // Try setting each field with each value to see if any work
      fields.forEach((field, idx) => {
        const valueIdx = idx % allValues.length;
        try {
          field.setValue(allValues[valueIdx]);
          console.log(`Successfully set field ${field.getName()} with value ${allValues[valueIdx]}`);
        } catch (e) {
          // Just ignore errors
        }
      });
    } catch (e) {
      console.warn("Last resort approach failed:", e);
    }
    
    // Don't flatten form to maintain formatting
    
    // Save the PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Create a blob from the PDF and download it
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