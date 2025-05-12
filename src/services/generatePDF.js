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
    
    // List all form fields to see their actual names
    const fields = form.getFields();
    console.log("PDF form fields:", fields.map(f => ({ name: f.getName(), type: f.constructor.name })));
    
    try {
      // DIRECT FIELD MAPPING APPROACH - Map each field individually
      
      // Step 1: Get each text field directly by index to ensure correct order
      const textFields = fields.filter(field => field.constructor.name === 'PDFTextField');
      console.log("Text fields:", textFields.map(f => f.getName()));
      
      // Step 2: Get each checkbox directly by index
      const checkboxFields = fields.filter(field => field.constructor.name === 'PDFCheckBox');
      console.log("Checkbox fields:", checkboxFields.map(f => f.getName()));
      
      // Map values to correct text fields by index
      const textFieldValues = [
        event.title || '',                         // Event Name (field 0)
        formatDate(event.date),                    // Event Date (field 1)
        event.setup_time || '',                    // Event Set Up Time (field 2)
        event.duration || event.time || '',        // Event Duration (field 3)
        assignedEmployees,                         // DP Staff Attending (field 4)
        event.contact_name ? 
          `${event.contact_name} ${event.contact_phone || ''}` : '',  // Event Contact (field 5)
        event.expected_attendees?.toString() || '' // Expected # of Attendees (field 6)
      ];
      
      // Fill text fields in the correct order
      textFieldValues.forEach((value, index) => {
        if (index < textFields.length) {
          try {
            textFields[index].setText(value);
            console.log(`Set field #${index} to "${value}"`);
          } catch (e) {
            console.warn(`Failed to set field #${index}:`, e);
          }
        }
      });
      
      // Event type checkboxes (field indices may vary - adjust based on console output)
      const eventTypeIndex = {
        'tasting': 0,      // Index of Tasting checkbox
        'pint_night': 1,   // Index of Pint Night checkbox
        'beer_fest': 2,    // Index of Beer Fest checkbox
        'other': 3         // Index of Other checkbox
      };
      
      // Check the appropriate event type checkbox
      const eventTypeCheckboxIndex = eventTypeIndex[event.event_type] || 3;
      if (eventTypeCheckboxIndex < checkboxFields.length) {
        try {
          checkboxFields[eventTypeCheckboxIndex].check();
          console.log(`Checked event type checkbox #${eventTypeCheckboxIndex}`);
        } catch (e) {
          console.warn(`Failed to check event type checkbox #${eventTypeCheckboxIndex}:`, e);
        }
      }
      
      // Set other text if applicable
      if (event.event_type === 'other' && event.event_type_other) {
        // Other text field is typically after the main fields
        const otherTextField = textFields[7]; // Adjust this index if needed
        if (otherTextField) {
          try {
            otherTextField.setText(event.event_type_other);
            console.log(`Set other text to "${event.event_type_other}"`);
          } catch (e) {
            console.warn('Failed to set other text:', e);
          }
        }
      }
      
      // Supply checkboxes (these will be after the event type checkboxes)
      const supplyCheckboxes = [
        { name: 'Table', checked: event.supplies?.table_needed, index: 4 },
        { name: 'Beer buckets', checked: event.supplies?.beer_buckets, index: 5 },
        { name: 'Table Cloth', checked: event.supplies?.table_cloth, index: 6 },
        { name: 'Tent/Weights', checked: event.supplies?.tent_weights, index: 7 },
        { name: 'Signage', checked: event.supplies?.signage, index: 8 },
        { name: 'Ice', checked: event.supplies?.ice, index: 9 },
        { name: 'Jockey box', checked: event.supplies?.jockey_box, index: 10 },
        { name: 'Cups', checked: event.supplies?.cups, index: 11 }
      ];
      
      supplyCheckboxes.forEach(supply => {
        if (supply.checked && supply.index < checkboxFields.length) {
          try {
            checkboxFields[supply.index].check();
            console.log(`Checked ${supply.name} checkbox #${supply.index}`);
          } catch (e) {
            console.warn(`Failed to check ${supply.name} checkbox #${supply.index}:`, e);
          }
        }
      });
      
      // Additional supplies text field
      const additionalSuppliesIndex = 8; // Adjust based on your form
      if (additionalSuppliesIndex < textFields.length) {
        try {
          textFields[additionalSuppliesIndex].setText(event.supplies?.additional_supplies || '');
          console.log(`Set additional supplies text`);
        } catch (e) {
          console.warn('Failed to set additional supplies text:', e);
        }
      }
      
      // Event instructions text field
      const eventInstructionsIndex = 9; // Adjust based on your form
      if (eventInstructionsIndex < textFields.length) {
        try {
          textFields[eventInstructionsIndex].setText(event.event_instructions || event.info || '');
          console.log(`Set event instructions text`);
        } catch (e) {
          console.warn('Failed to set event instructions text:', e);
        }
      }
      
      // Beer table (assuming these are additional text fields)
      const beers = event.beers || [];
      const beerFieldStartIndex = 10; // Adjust based on your form
      
      for (let i = 0; i < Math.min(beers.length, 4); i++) { // Limit to 4 beers or however many rows your form has
        const beer = beers[i];
        const styleIndex = beerFieldStartIndex + (i * 3);
        const pkgIndex = styleIndex + 1;
        const qtyIndex = styleIndex + 2;
        
        try {
          if (styleIndex < textFields.length) {
            textFields[styleIndex].setText(beer.beer_style || '');
            console.log(`Set beer ${i+1} style to "${beer.beer_style}"`);
          }
          
          if (pkgIndex < textFields.length) {
            textFields[pkgIndex].setText(beer.packaging || '');
            console.log(`Set beer ${i+1} packaging to "${beer.packaging}"`);
          }
          
          if (qtyIndex < textFields.length) {
            textFields[qtyIndex].setText(beer.quantity?.toString() || '');
            console.log(`Set beer ${i+1} quantity to "${beer.quantity}"`);
          }
        } catch (e) {
          console.warn(`Failed to set beer ${i+1} fields:`, e);
        }
      }
      
      // Post-event notes
      const postEventFieldStartIndex = beerFieldStartIndex + 12; // Adjust based on your form
      if (event.notes) {
        const noteFields = [
          { name: 'Estimated attendees', value: event.notes.estimated_attendees?.toString() || '', index: postEventFieldStartIndex },
          { name: 'Favorite beer', value: event.notes.favorite_beer || '', index: postEventFieldStartIndex + 1 },
          { name: 'Critiques', value: event.notes.critiques || '', index: postEventFieldStartIndex + 5 },
          { name: 'Return equipment by', value: event.notes.return_equipment_by ? formatDate(event.notes.return_equipment_by) : '', index: postEventFieldStartIndex + 6 }
        ];
        
        noteFields.forEach(note => {
          if (note.index < textFields.length) {
            try {
              textFields[note.index].setText(note.value);
              console.log(`Set ${note.name} to "${note.value}"`);
            } catch (e) {
              console.warn(`Failed to set ${note.name}:`, e);
            }
          }
        });
      }
      
    } catch (fieldError) {
      console.error('Error filling form fields:', fieldError);
    }
    
    // Font sizing issues - don't flatten the form
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