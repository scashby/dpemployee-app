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
    
    // Log all field names to help with debugging
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Step 1: Set the checkboxes (this part works fine)
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
    
    // Step 2: Map all text fields we want to set
    console.log('Setting text fields...');
    
    // Map all known text fields to values
    const textFieldMappings = [
      { name: "Event Name", value: event.title || '' },
      { name: "Event Date", value: formatDate(event.date) },
      { name: "Event Set Up Time", value: formatTime(event.setup_time) },
      { name: "Event Duration", value: event.duration || '' },
      { name: "DP Staff Attending", value: getAssignedEmployees() },
      { name: "Event Contact", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { name: "Expected Attendees", value: event.expected_attendees?.toString() || '' },
      { name: "Other More Detail", value: event.event_type === 'other' ? event.event_type_other || '' : '' },
      { name: "Additional Supplies", value: event.supplies?.additional_supplies || '' },
      { name: "Event Instructions", value: event.event_instructions || event.info || '' }
    ];
    
    // Special handling for beer fields - these are problematic
    const beerFieldMappings = [];
    
    if (event.beers && event.beers.length > 0) {
      // Beer Style 1
      beerFieldMappings.push({ 
        name: "Beer Style 1", 
        value: event.beers[0]?.beer_style || '' 
      });
      
      // Package Style 1 - problematic
      beerFieldMappings.push({ 
        name: "Package Style 1", 
        value: event.beers[0]?.packaging || '' 
      });
      
      // Quantity 1
      beerFieldMappings.push({ 
        name: "Quantity 1", 
        value: event.beers[0]?.quantity?.toString() || '' 
      });
      
      if (event.beers.length > 1) {
        // Beer Style 2 - problematic
        beerFieldMappings.push({ 
          name: "Beer Style 2", 
          value: event.beers[1]?.beer_style || '' 
        });
        
        // Package Style 2 - problematic
        beerFieldMappings.push({ 
          name: "Package Style 2", 
          value: event.beers[1]?.packaging || '' 
        });
        
        // Quantity 2
        beerFieldMappings.push({ 
          name: "Quantity 2", 
          value: event.beers[1]?.quantity?.toString() || '' 
        });
      }
    }
    
    // Set regular text fields
    for (const mapping of textFieldMappings) {
      try {
        // Try to find the field with exact name or with colon
        let fieldName = mapping.name;
        
        if (!fieldNames.includes(fieldName) && fieldNames.includes(`${fieldName}:`)) {
          fieldName = `${fieldName}:`;
        }
        
        if (!fieldNames.includes(fieldName)) {
          // Try to find a field that contains this name
          fieldName = fieldNames.find(name => 
            name.toLowerCase().includes(mapping.name.toLowerCase())
          );
        }
        
        if (fieldName && fieldNames.includes(fieldName)) {
          const field = form.getTextField(fieldName);
          field.setText(mapping.value);
          console.log(`Set ${fieldName} to ${mapping.value}`);
        }
      } catch (e) {
        console.warn(`Could not set "${mapping.name}":`, e.message);
      }
    }
    
    // Special handling for beer fields - let's try a different approach for these
    console.log('Setting beer fields...');
    
    // Get all fields related to beer products
    const beerStyleFields = fieldNames.filter(name => 
      name.includes('Beer Style') || name.includes('BeerStyle')
    );
    
    const packageFields = fieldNames.filter(name => 
      name.includes('Package') || name.includes('Pkg')
    );
    
    const quantityFields = fieldNames.filter(name => 
      name.includes('Quantity') || name.includes('Qty')
    );
    
    console.log('Found beer style fields:', beerStyleFields);
    console.log('Found package fields:', packageFields);
    console.log('Found quantity fields:', quantityFields);
    
    // Set beer fields using the actual field names found in the PDF
    for (const mapping of beerFieldMappings) {
      try {
        // For beer style fields
        if (mapping.name.includes('Beer Style')) {
          const number = mapping.name.match(/\d+/)[0];
          const styleField = beerStyleFields.find(name => name.includes(number));
          
          if (styleField) {
            const field = form.getTextField(styleField);
            field.setText(mapping.value);
            console.log(`Set ${styleField} to ${mapping.value}`);
          }
        }
        
        // For package fields - PROBLEMATIC
        else if (mapping.name.includes('Package')) {
          const number = mapping.name.match(/\d+/)[0];
          const pkgField = packageFields.find(name => name.includes(number));
          
          if (pkgField) {
            const field = form.getTextField(pkgField);
            
            // ATTEMPT #1: Standard approach
            field.setText(mapping.value);
            console.log(`Set ${pkgField} to ${mapping.value}`);
          }
        }
        
        // For quantity fields
        else if (mapping.name.includes('Quantity')) {
          const number = mapping.name.match(/\d+/)[0];
          const qtyField = quantityFields.find(name => name.includes(number));
          
          if (qtyField) {
            const field = form.getTextField(qtyField);
            field.setText(mapping.value);
            console.log(`Set ${qtyField} to ${mapping.value}`);
          }
        }
      } catch (e) {
        console.warn(`Could not set "${mapping.name}":`, e.message);
      }
    }
    
    // Create a modified version that directly modifies these problematic fields
    if (event.beers && event.beers.length > 0) {
      try {
        console.log('Attempting emergency direct modification of problematic fields...');
        
        // EMERGENCY TECHNIQUE: For each of the problematic fields, try a different approach
        
        // 1. Beer Style 2
        if (event.beers.length > 1 && event.beers[1]?.beer_style) {
          const styleField2 = beerStyleFields.find(name => name.includes('2'));
          if (styleField2) {
            // Try setting the value in multiple passes
            const field = form.getTextField(styleField2);
            field.setText('');  // Clear first
            field.setText(event.beers[1].beer_style);
            console.log(`Emergency reset of ${styleField2} to ${event.beers[1].beer_style}`);
          }
        }
        
        // 2. Package Style 1
        if (event.beers[0]?.packaging) {
          const pkgField1 = packageFields.find(name => name.includes('1'));
          if (pkgField1) {
            // Try setting the value in multiple passes
            const field = form.getTextField(pkgField1);
            field.setText('');  // Clear first
            field.setText(event.beers[0].packaging);
            console.log(`Emergency reset of ${pkgField1} to ${event.beers[0].packaging}`);
          }
        }
        
        // 3. Package Style 2
        if (event.beers.length > 1 && event.beers[1]?.packaging) {
          const pkgField2 = packageFields.find(name => name.includes('2'));
          if (pkgField2) {
            // Try setting the value in multiple passes
            const field = form.getTextField(pkgField2);
            field.setText('');  // Clear first
            field.setText(event.beers[1].packaging);
            console.log(`Emergency reset of ${pkgField2} to ${event.beers[1].packaging}`);
          }
        }
      } catch (e) {
        console.warn('Emergency field modification failed:', e);
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