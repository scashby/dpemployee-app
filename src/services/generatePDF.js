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
    
    // Get all form fields
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Deep inspect all form fields to help with debugging
    console.log('Inspecting field types:');
    fields.forEach(field => {
      console.log(`Field ${field.getName()}: ${field.constructor.name}`);
      
      // If this is a beer table field, log more details
      if (field.getName().includes('Beer Style') || 
          field.getName().includes('Package') || 
          field.getName().includes('Quantity')) {
        console.log(`  Details:`, field);
      }
    });
    
    // Set checkboxes (these work fine)
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
      if (fieldNames.includes(mapping.name)) {
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
    
    // Set normal text fields (these work fine)
    console.log('Setting regular text fields...');
    const textFieldMappings = [
      { name: "Event Name", value: event.title || '' },
      { name: "Event Date", value: formatDate(event.date) },
      { name: "Event Set Up Time", value: formatTime(event.setup_time) },
      { name: "Event Duration", value: event.duration || '' },
      { name: "DP Staff Attending", value: getAssignedEmployees() },
      { name: "Event Contact", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { name: "Expected # of Attendees", value: event.expected_attendees?.toString() || '' },
      { name: "Other :", value: event.event_type === 'other' ? event.event_type_other || '' : '' },
      { name: "Additional Supplies", value: event.supplies?.additional_supplies || '' },
      { name: "Event Instructions", value: event.event_instructions || event.info || '' }
    ];
    
    textFieldMappings.forEach(mapping => {
      try {
        // Try basic variations
        const fieldVariations = [
          mapping.name,
          `${mapping.name}:`,
          mapping.name.includes(':') ? mapping.name.replace(':', '') : `${mapping.name}:`
        ];
        
        let success = false;
        for (const fieldName of fieldVariations) {
          if (fieldNames.includes(fieldName)) {
            const field = form.getTextField(fieldName);
            field.setText(mapping.value);
            console.log(`Set ${fieldName} to ${mapping.value}`);
            success = true;
            break;
          }
        }
        
        // If still not found, try looser matching
        if (!success) {
          const baseNameLower = mapping.name.toLowerCase().replace(':', '');
          const matchingField = fieldNames.find(name => 
            name.toLowerCase().includes(baseNameLower)
          );
          
          if (matchingField) {
            const field = form.getTextField(matchingField);
            field.setText(mapping.value);
            console.log(`Set ${matchingField} to ${mapping.value}`);
            success = true;
          }
        }
        
        if (!success) {
          console.warn(`Could not find field for "${mapping.name}"`);
        }
      } catch (e) {
        console.warn(`Error setting field "${mapping.name}":`, e.message);
      }
    });
    
    // Now for the problematic beer table fields, try a different approach
    console.log('Setting beer table with special handling...');
    
    const beers = event.beers || [];
    
    if (beers.length > 0) {
      // Get all beer-related fields
      const beerStyleFields = fieldNames.filter(name => 
        name.includes('Beer Style') || name.includes('BeerStyle')
      );
      const packageFields = fieldNames.filter(name => 
        name.includes('Package') || name.includes('Pkg')
      );
      const quantityFields = fieldNames.filter(name => 
        name.includes('Quantity') || name.includes('Qty')
      );
      
      console.log('Beer style fields:', beerStyleFields);
      console.log('Package fields:', packageFields);
      console.log('Quantity fields:', quantityFields);
      
      // Try Beer Style 1 - manual attempt
      if (beers[0]?.beer_style && beerStyleFields.length > 0) {
        try {
          const styleField = form.getTextField(beerStyleFields[0]);
          
          // First, try with an intermediate value like " "
          styleField.setText(" ");
          
          // Force a redraw by waiting slightly
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Now set the real value
          styleField.setText(beers[0].beer_style);
          console.log(`Set ${beerStyleFields[0]} to "${beers[0].beer_style}"`);
        } catch (e) {
          console.warn(`Error setting Beer Style 1:`, e);
        }
      }
      
      // Try Package Style 1 - manual attempt
      if (beers[0]?.packaging && packageFields.length > 0) {
        try {
          const pkgField = form.getTextField(packageFields[0]);
          
          // First, try with an intermediate value like " "
          pkgField.setText(" ");
          
          // Force a redraw by waiting slightly
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Now set the real value
          pkgField.setText(beers[0].packaging);
          console.log(`Set ${packageFields[0]} to "${beers[0].packaging}"`);
        } catch (e) {
          console.warn(`Error setting Package Style 1:`, e);
        }
      }
      
      // Try Quantity 1 - manual attempt
      if (beers[0]?.quantity && quantityFields.length > 0) {
        try {
          const qtyField = form.getTextField(quantityFields[0]);
          qtyField.setText(beers[0].quantity.toString());
          console.log(`Set ${quantityFields[0]} to "${beers[0].quantity}"`);
        } catch (e) {
          console.warn(`Error setting Quantity 1:`, e);
        }
      }
      
      // Row 2
      if (beers.length > 1) {
        // Beer Style 2 - manual attempt
        if (beers[1]?.beer_style && beerStyleFields.length > 1) {
          try {
            const styleField = form.getTextField(beerStyleFields[1]);
            
            // First, try with an intermediate value like " "
            styleField.setText(" ");
            
            // Force a redraw by waiting slightly
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Now set the real value
            styleField.setText(beers[1].beer_style);
            console.log(`Set ${beerStyleFields[1]} to "${beers[1].beer_style}"`);
          } catch (e) {
            console.warn(`Error setting Beer Style 2:`, e);
          }
        }
        
        // Package Style 2 - manual attempt
        if (beers[1]?.packaging && packageFields.length > 1) {
          try {
            const pkgField = form.getTextField(packageFields[1]);
            
            // First, try with an intermediate value like " "
            pkgField.setText(" ");
            
            // Force a redraw by waiting slightly
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Now set the real value
            pkgField.setText(beers[1].packaging);
            console.log(`Set ${packageFields[1]} to "${beers[1].packaging}"`);
          } catch (e) {
            console.warn(`Error setting Package Style 2:`, e);
          }
        }
        
        // Quantity 2 - manual attempt
        if (beers[1]?.quantity && quantityFields.length > 1) {
          try {
            const qtyField = form.getTextField(quantityFields[1]);
            qtyField.setText(beers[1].quantity.toString());
            console.log(`Set ${quantityFields[1]} to "${beers[1].quantity}"`);
          } catch (e) {
            console.warn(`Error setting Quantity 2:`, e);
          }
        }
      }
    }
    
    // Last resort: create serialized FDF data with field values
    try {
      console.log('Creating FDF data for Beer Style/Package fields...');
      
      // Create FDF entries for problematic fields
      const fdfEntries = [];
      
      if (beers[0]?.beer_style) {
        fdfEntries.push(`<</T(Beer Style 1)/V(${beers[0].beer_style})>>`);
      }
      
      if (beers[0]?.packaging) {
        fdfEntries.push(`<</T(Package Style 1)/V(${beers[0].packaging})>>`);
      }
      
      if (beers.length > 1 && beers[1]?.beer_style) {
        fdfEntries.push(`<</T(Beer Style 2)/V(${beers[1].beer_style})>>`);
      }
      
      if (beers.length > 1 && beers[1]?.packaging) {
        fdfEntries.push(`<</T(Package Style 2)/V(${beers[1].packaging})>>`);
      }
      
      console.log('FDF entries:', fdfEntries);
    } catch (e) {
      console.warn('Error creating FDF data:', e);
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