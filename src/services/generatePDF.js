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
    
    // Set checkboxes - these work fine
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
    
    for (const mapping of checkboxMappings) {
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
    }
    
    // EXACT FIELD MAPPINGS ONLY - No clever name matching algorithms
    console.log('Setting text fields with EXACT name matching only...');
    
    // List of fields from the log inspection - use EXACT names only
    const textFieldValues = {
      "Event Name": event.title || '',
      "Event Date": formatDate(event.date),
      "Event Set Up Time": formatTime(event.setup_time),
      "Event Duration": event.duration || '',
      "DP Staff Attending": getAssignedEmployees(),
      "Event Contact": event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '',
      "Expected Attendees": event.expected_attendees?.toString() || '',
      "Other More Detail": event.event_type === 'other' ? event.event_type_other || '' : '',
      "Additional Supplies": event.supplies?.additional_supplies || '',
      "Event Instructions": event.event_instructions || event.info || '',
      
      // CRITICAL: Ensure the beer fields use exact field names and values
      // DO NOT use the wrong beer for the wrong field
      "Beer Style 1": event.beers?.[0]?.beer_style || '',
      "Package Style 1": event.beers?.[0]?.packaging || '',
      "Quantity 1": event.beers?.[0]?.quantity?.toString() || '',
      
      "Beer Style 2": event.beers?.[1]?.beer_style || '',
      "Package Style 2": event.beers?.[1]?.packaging || '',
      "Quantity 2": event.beers?.[1]?.quantity?.toString() || ''
    };
    
    // Only set fields that EXACTLY match the names in our mapping
    for (const [fieldName, fieldValue] of Object.entries(textFieldValues)) {
      if (fieldNames.includes(fieldName)) {
        try {
          const field = form.getTextField(fieldName);
          field.setText(fieldValue);
          console.log(`Set ${fieldName} to "${fieldValue}"`);
        } catch (e) {
          console.warn(`Error setting ${fieldName}:`, e);
        }
      } else {
        console.warn(`Field "${fieldName}" does not exist in the PDF`);
      }
    }
    
    // Try to solve the plus sign problem
    try {
      // Access the problematic fields directly and try to set values with different technique
      if (fieldNames.includes("Beer Style 1") && event.beers?.[0]?.beer_style) {
        const field = form.getTextField("Beer Style 1");
        
        // Clear first
        field.setText("");
        
        // Then set value
        field.setText(event.beers[0].beer_style);
        console.log(`Reset Beer Style 1 to "${event.beers[0].beer_style}"`);
      }
      
      if (fieldNames.includes("Beer Style 2") && event.beers?.[1]?.beer_style) {
        const field = form.getTextField("Beer Style 2");
        
        // Clear first
        field.setText("");
        
        // Then set value
        field.setText(event.beers[1].beer_style);
        console.log(`Reset Beer Style 2 to "${event.beers[1].beer_style}"`);
      }
      
      if (fieldNames.includes("Package Style 1") && event.beers?.[0]?.packaging) {
        const field = form.getTextField("Package Style 1");
        
        // Clear first
        field.setText("");
        
        // Then set value
        field.setText(event.beers[0].packaging);
        console.log(`Reset Package Style 1 to "${event.beers[0].packaging}"`);
      }
      
      if (fieldNames.includes("Package Style 2") && event.beers?.[1]?.packaging) {
        const field = form.getTextField("Package Style 2");
        
        // Clear first
        field.setText("");
        
        // Then set value
        field.setText(event.beers[1].packaging);
        console.log(`Reset Package Style 2 to "${event.beers[1].packaging}"`);
      }
    } catch (e) {
      console.warn("Failed special handling for beer fields:", e);
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