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
    
    // Get all form fields 
    const fields = form.getFields();
    
    // Get fields by name and fill them (use the actual field names from your PDF)
    // Event basic information
    try {
      // Main event details
      const eventFields = [
        { name: 'Event Name', value: event.title || '' },
        { name: 'Event Date', value: formatDate(event.date) },
        { name: 'Event Set Up Time', value: event.setup_time || '' },
        { name: 'Event Duration', value: event.duration || event.time || '' },
        { name: 'DP Staff Attending', value: assignedEmployees },
        { name: 'Event Contact(Name, Phone)', value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
        { name: 'Expected # of Attendees', value: event.expected_attendees?.toString() || '' }
      ];
      
      // Fill in the fields
      eventFields.forEach(field => {
        try {
          const formField = form.getTextField(field.name);
          if (formField) {
            formField.setText(field.value);
          }
        } catch (e) {
          console.warn(`Field not found: ${field.name}`);
        }
      });
      
      // Event type checkboxes
      const eventTypeCheckboxes = [
        { name: 'Tasting', checked: event.event_type === 'tasting' },
        { name: 'Pint Night', checked: event.event_type === 'pint_night' },
        { name: 'Beer Fest', checked: event.event_type === 'beer_fest' }
      ];
      
      eventTypeCheckboxes.forEach(checkbox => {
        try {
          const checkboxField = form.getCheckBox(checkbox.name);
          if (checkboxField) {
            if (checkbox.checked) {
              checkboxField.check();
            } else {
              checkboxField.uncheck();
            }
          }
        } catch (e) {
          console.warn(`Checkbox not found: ${checkbox.name}`);
        }
      });
      
      // Other checkbox and text
      if (event.event_type === 'other') {
        try {
          const otherCheckbox = form.getCheckBox('Other');
          if (otherCheckbox) {
            otherCheckbox.check();
          }
          
          // Set Other text
          const otherTextField = form.getTextField('Other Text');
          if (otherTextField && event.event_type_other) {
            otherTextField.setText(event.event_type_other);
          }
        } catch (e) {
          console.warn('Other field not found', e);
        }
      }
      
      // Supply checkboxes
      const supplyCheckboxes = [
        { name: 'Table', checked: event.supplies?.table_needed },
        { name: 'Beer buckets', checked: event.supplies?.beer_buckets },
        { name: 'Table Cloth', checked: event.supplies?.table_cloth },
        { name: 'Tent/Weights', checked: event.supplies?.tent_weights },
        { name: 'Signage', checked: event.supplies?.signage },
        { name: 'Ice', checked: event.supplies?.ice },
        { name: 'Jockey box', checked: event.supplies?.jockey_box },
        { name: 'Cups', checked: event.supplies?.cups }
      ];
      
      supplyCheckboxes.forEach(checkbox => {
        try {
          const checkboxField = form.getCheckBox(checkbox.name);
          if (checkboxField) {
            if (checkbox.checked) {
              checkboxField.check();
            } else {
              checkboxField.uncheck();
            }
          }
        } catch (e) {
          console.warn(`Checkbox not found: ${checkbox.name}`);
        }
      });
      
      // Additional supplies
      try {
        const additionalSupplies = form.getTextField('Additional Supplies');
        if (additionalSupplies) {
          additionalSupplies.setText(event.supplies?.additional_supplies || '');
        }
      } catch (e) {
        console.warn('Additional Supplies field not found');
      }
      
      // Beer products
      if (event.beers && event.beers.length > 0) {
        // Get beer table fields - these would need to match the actual field names in your PDF
        for (let i = 0; i < Math.min(event.beers.length, 5); i++) { // Limit to 5 beers or however many rows your form has
          const beer = event.beers[i];
          const row = i + 1;
          
          try {
            const styleField = form.getTextField(`Beer Style ${row}`);
            const pkgField = form.getTextField(`Pkg ${row}`);
            const qtyField = form.getTextField(`Qty ${row}`);
            
            if (styleField) styleField.setText(beer.beer_style || '');
            if (pkgField) pkgField.setText(beer.packaging || '');
            if (qtyField) qtyField.setText(beer.quantity?.toString() || '');
          } catch (e) {
            console.warn(`Beer row ${row} field not found`);
          }
        }
      }
      
      // Event instructions
      try {
        const instructionsField = form.getTextField('Event Instructions');
        if (instructionsField) {
          instructionsField.setText(event.event_instructions || event.info || '');
        }
      } catch (e) {
        console.warn('Instructions field not found');
      }
      
      // Post-event notes if they exist
      if (event.notes) {
        const noteFields = [
          { name: 'Estimated attendees', value: event.notes.estimated_attendees || '' },
          { name: 'Favorite beer', value: event.notes.favorite_beer || '' },
          { name: 'Enough product', value: event.notes.enough_product ? 'Yes' : (event.notes.enough_product === false ? 'No' : '') },
          { name: 'Adequately staffed', value: event.notes.adequately_staffed ? 'Yes' : (event.notes.adequately_staffed === false ? 'No' : '') },
          { name: 'Continue participation', value: event.notes.continue_participation ? 'Yes' : (event.notes.continue_participation === false ? 'No' : '') },
          { name: 'Critiques', value: event.notes.critiques || '' },
          { name: 'Return equipment by', value: event.notes.return_equipment_by ? formatDate(event.notes.return_equipment_by) : '' }
        ];
        
        noteFields.forEach(field => {
          try {
            const formField = form.getTextField(field.name);
            if (formField) {
              formField.setText(field.value);
            }
          } catch (e) {
            console.warn(`Note field not found: ${field.name}`);
          }
        });
      }
      
    } catch (fieldError) {
      console.error('Error filling form fields:', fieldError);
    }
    
    // Flatten form fields to make them non-editable
    form.flatten();
    
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