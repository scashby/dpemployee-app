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
    
    // From the FDF file, we know the exact checkbox field names
    // These are the field names from the FDF file you provided
    const knownCheckboxFields = [
      "Beer Buckets", "Beer Fest", "Cups", "Ice", "Jockey Box", 
      "Other", "Pint Night", "Signage", "Table", "Table Cloth", 
      "Tasting", "Tent Weights"
    ];
    
    // Set the checkboxes using the known field names from FDF
    console.log('Setting checkboxes using FDF field names...');
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
      if (knownCheckboxFields.includes(mapping.name)) {
        try {
          const checkbox = form.getCheckBox(mapping.name);
          if (mapping.checked) {
            checkbox.check();
            console.log(`Checked "${mapping.name}"`);
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${mapping.name}":`, e.message);
        }
      }
    });
    
    // For the text fields, we'll try common names for PDF forms
    console.log('Setting text fields...');
    const textFieldAttempts = [
      { fieldNames: ["Event Name :", "Event Name"], value: event.title || '' },
      { fieldNames: ["Event Date:", "Event Date"], value: formatDate(event.date) },
      { fieldNames: ["Event Set Up Time:", "Event Set Up Time"], value: formatTime(event.setup_time) },
      { fieldNames: ["Event Duration:", "Event Duration"], value: event.duration || '' },
      { fieldNames: ["DP Staff Attending:", "DP Staff Attending"], value: getAssignedEmployees() },
      { fieldNames: ["Event Contact(Name, Phone):", "Event Contact(Name, Phone)"], 
        value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { fieldNames: ["Expected # of Attendees:", "Expected # of Attendees"], 
        value: event.expected_attendees?.toString() || '' },
      { fieldNames: ["Additional Supplies:", "Additional Supplies"], 
        value: event.supplies?.additional_supplies || '' },
      { fieldNames: ["Event Instructions:", "Event Instructions"], 
        value: event.event_instructions || event.info || '' }
    ];
    
    // Find and set Other field if event_type is 'other'
    if (event.event_type === 'other' && event.event_type_other) {
      for (const fieldName of fieldNames) {
        if (fieldName.includes("Other") && fieldName !== "Other") {
          try {
            const field = form.getTextField(fieldName);
            field.setText(event.event_type_other);
            console.log(`Set Other text field "${fieldName}" to "${event.event_type_other}"`);
            break;
          } catch (e) {
            console.warn(`Could not set Other text field "${fieldName}":`, e);
          }
        }
      }
    }
    
    // For each text field attempt, try all possible field names
    textFieldAttempts.forEach(attempt => {
      for (const fieldName of attempt.fieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            const field = form.getTextField(fieldName);
            field.setText(attempt.value);
            console.log(`Set text field "${fieldName}" to "${attempt.value}"`);
            break; // Stop after finding first matching field
          } catch (e) {
            console.warn(`Could not set text field "${fieldName}":`, e);
          }
        }
      }
    });
    
    // Handle beer table rows - try different variations for field names
    console.log('Setting beer table...');
    const beers = event.beers || [];
    
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      if (!beer) continue;
      
      const rowNum = i + 1;
      
      // Try to find beer style field
      const styleFieldNames = [`Beer Style ${rowNum}`, `BeerStyle${rowNum}`];
      for (const fieldName of styleFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            const field = form.getTextField(fieldName);
            field.setText(beer.beer_style || '');
            console.log(`Set beer style ${rowNum} to "${beer.beer_style}"`);
            break;
          } catch (e) {
            console.warn(`Could not set beer style ${rowNum}:`, e);
          }
        }
      }
      
      // Try to find quantity field
      const qtyFieldNames = [`Qty ${rowNum}`, `Quantity ${rowNum}`];
      for (const fieldName of qtyFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            const field = form.getTextField(fieldName);
            field.setText(beer.quantity?.toString() || '');
            console.log(`Set quantity ${rowNum} to "${beer.quantity}"`);
            break;
          } catch (e) {
            console.warn(`Could not set quantity ${rowNum}:`, e);
          }
        }
      }

      // Try to find package field
      // For this field, we need to be very careful as it's causing the plus sign issue
      const pkgFieldNames = [`Pkg ${rowNum}`, `Package ${rowNum}`];
      for (const fieldName of pkgFieldNames) {
        if (fieldNames.includes(fieldName)) {
          try {
            // For packaging field, try a simpler approach - just setting the text directly
            const field = form.getTextField(fieldName);
            
            // First ensure the field is empty to avoid interference with existing content
            field.setText('');
            
            // Now set the packaging value
            if (beer.packaging) {
              field.setText(beer.packaging);
              console.log(`Set package ${rowNum} to "${beer.packaging}"`);
            }
            break;
          } catch (e) {
            console.warn(`Could not set package ${rowNum}:`, e);
          }
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