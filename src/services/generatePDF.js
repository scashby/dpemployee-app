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
    
    // List all fields to debug field names
    const fields = form.getFields();
    console.log("Available PDF form fields:", fields.map(f => f.getName()));
    
    // APPROACH 1: Try setting fields by exact field names from the form
    try {
      // Map field names to values
      const fieldMappings = [
        { name: 'Event Name :', value: event.title || '' },
        { name: 'Event Date:', value: formatDate(event.date) },
        { name: 'Event Set Up Time:', value: event.setup_time || '' },
        { name: 'Event Duration:', value: event.duration || event.time || '' },
        { name: 'DP Staff Attending:', value: assignedEmployees },
        { name: 'Event Contact(Name, Phone):', value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
        { name: 'Expected # of Attendees:', value: event.expected_attendees?.toString() || '' },
        { name: 'Additional Supplies:', value: event.supplies?.additional_supplies || '' },
        { name: 'Event Instructions:', value: event.event_instructions || event.info || '' }
      ];
      
      // Fill in the fields
      for (const mapping of fieldMappings) {
        try {
          const textField = form.getTextField(mapping.name);
          textField.setText(mapping.value);
          console.log(`Successfully set field "${mapping.name}" to "${mapping.value}"`);
        } catch (e) {
          console.warn(`Could not set field "${mapping.name}": ${e.message}`);
        }
      }
      
      // APPROACH 2: Try using field indices if names don't work
      if (fields.length > 0) {
        // Assuming fields are in a specific order, try to set them by index
        try {
          // Set event title (typically first field)
          fields[0].setText(event.title || '');
          
          // Set date (typically second field)
          fields[1].setText(formatDate(event.date));
          
          // Set setup time
          fields[2].setText(event.setup_time || '');
          
          // Set duration
          fields[3].setText(event.duration || event.time || '');
          
          // Set staff
          fields[4].setText(assignedEmployees);
          
          // Set contact
          fields[5].setText(event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '');
          
          // Set attendees
          fields[6].setText(event.expected_attendees?.toString() || '');
          
          console.log("Set fields by index approach");
        } catch (e) {
          console.warn("Error setting fields by index:", e);
        }
      }
      
      // Try event type checkboxes with different naming patterns
      const possibleCheckboxNames = [
        // Common PDF field naming patterns
        ['Tasting', 'Pint Night', 'Beer Fest', 'Other'],
        ['Tasting:', 'Pint Night:', 'Beer Fest :', 'Other :'],
        ['tasting', 'pint_night', 'beer_fest', 'other']
      ];
      
      let eventTypeSet = false;
      for (const nameSet of possibleCheckboxNames) {
        try {
          const checkboxName = nameSet[
            event.event_type === 'tasting' ? 0 :
            event.event_type === 'pint_night' ? 1 :
            event.event_type === 'beer_fest' ? 2 : 3
          ];
          
          const checkbox = form.getCheckBox(checkboxName);
          checkbox.check();
          eventTypeSet = true;
          console.log(`Successfully checked "${checkboxName}"`);
          break;
        } catch (e) {
          console.warn(`Could not set checkbox group ${nameSet.join(', ')}`);
        }
      }
      
      // If event type is "other", try to fill in the other text field
      if (event.event_type === 'other' && event.event_type_other) {
        const possibleOtherFieldNames = ['Other', 'Other :', 'other_text', 'Other Text'];
        for (const fieldName of possibleOtherFieldNames) {
          try {
            const otherField = form.getTextField(fieldName);
            otherField.setText(event.event_type_other);
            console.log(`Set other text field "${fieldName}" to "${event.event_type_other}"`);
            break;
          } catch (e) {
            console.warn(`Could not set other text field "${fieldName}"`);
          }
        }
      }
      
      // Try setting supply checkboxes with various naming patterns
      const supplyItems = [
        { property: 'table_needed', names: ['Table', 'Table:', 'table'] },
        { property: 'beer_buckets', names: ['Beer buckets', 'Beer buckets:', 'beer_buckets'] },
        { property: 'table_cloth', names: ['Table Cloth', 'Table Cloth:', 'table_cloth'] },
        { property: 'tent_weights', names: ['Tent/Weights', 'Tent/Weights:', 'tent_weights'] },
        { property: 'signage', names: ['Signage', 'Signage:', 'signage'] },
        { property: 'ice', names: ['Ice', 'Ice:', 'ice'] },
        { property: 'jockey_box', names: ['Jockey box', 'Jockey box:', 'jockey_box'] },
        { property: 'cups', names: ['Cups', 'Cups:', 'cups'] }
      ];
      
      for (const supplyItem of supplyItems) {
        const isChecked = event.supplies?.[supplyItem.property];
        if (isChecked) {
          for (const name of supplyItem.names) {
            try {
              const checkbox = form.getCheckBox(name);
              checkbox.check();
              console.log(`Successfully checked "${name}"`);
              break;
            } catch (e) {
              console.warn(`Could not check "${name}"`);
            }
          }
        }
      }
      
      // Try beer table fields with various naming patterns
      const beers = event.beers || [];
      if (beers.length > 0) {
        // This structured approach tries multiple naming patterns
        const beerTablePatterns = [
          { style: 'Beer Style {}', pkg: 'Pkg {}', qty: 'Qty {}' },
          { style: 'beer_style_{}', pkg: 'package_{}', qty: 'quantity_{}' },
          { style: 'beer_{}_style', pkg: 'beer_{}_package', qty: 'beer_{}_quantity' }
        ];
        
        for (let i = 0; i < Math.min(beers.length, 4); i++) {
          const beer = beers[i];
          const row = i + 1;
          
          let beerFieldsSet = false;
          for (const pattern of beerTablePatterns) {
            try {
              const styleField = form.getTextField(pattern.style.replace('{}', row));
              const pkgField = form.getTextField(pattern.pkg.replace('{}', row));
              const qtyField = form.getTextField(pattern.qty.replace('{}', row));
              
              styleField.setText(beer.beer_style || '');
              pkgField.setText(beer.packaging || '');
              qtyField.setText(beer.quantity?.toString() || '');
              
              beerFieldsSet = true;
              console.log(`Set beer row ${row} using pattern: ${JSON.stringify(pattern)}`);
              break;
            } catch (e) {
              console.warn(`Could not set beer row ${row} with pattern: ${JSON.stringify(pattern)}`);
            }
          }
          
          // If we couldn't set the fields using patterns, try just setting text fields by index
          if (!beerFieldsSet) {
            // Calculate index for beer fields (this will depend on your specific PDF)
            const baseIndex = 15 + (i * 3); // Adjust this based on your PDF structure
            try {
              fields[baseIndex].setText(beer.beer_style || '');
              fields[baseIndex + 1].setText(beer.packaging || '');
              fields[baseIndex + 2].setText(beer.quantity?.toString() || '');
              console.log(`Set beer row ${row} using index approach`);
            } catch (e) {
              console.warn(`Could not set beer row ${row} using index approach: ${e.message}`);
            }
          }
        }
      }
      
      // Try to set post-event notes if they exist
      if (event.notes) {
        const noteFieldMappings = [
          { name: 'Estimated attendees', value: event.notes.estimated_attendees?.toString() || '' },
          { name: 'Estimated attendees:', value: event.notes.estimated_attendees?.toString() || '' },
          { name: 'Was there a favorite style of beer offered?', value: event.notes.favorite_beer || '' },
          { name: 'Did you have enough product?', value: event.notes.enough_product ? 'Yes' : 'No' },
          { name: 'Were you adequately staffed for the event/tasting?', value: event.notes.adequately_staffed ? 'Yes' : 'No' },
          { name: 'Should we continue to participate in this event?', value: event.notes.continue_participation ? 'Yes' : 'No' },
          { name: 'Any critiques?', value: event.notes.critiques || '' },
          { name: 'RETURN EQUIPMENT BY:', value: event.notes.return_equipment_by ? formatDate(event.notes.return_equipment_by) : '' }
        ];
        
        for (const mapping of noteFieldMappings) {
          try {
            const textField = form.getTextField(mapping.name);
            textField.setText(mapping.value);
            console.log(`Set note field "${mapping.name}" to "${mapping.value}"`);
          } catch (e) {
            console.warn(`Could not set note field "${mapping.name}": ${e.message}`);
          }
        }
      }
      
    } catch (fieldError) {
      console.error('Error filling form fields:', fieldError);
    }
    
    // Don't flatten form to keep field sizing intact
    // form.flatten();
    
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