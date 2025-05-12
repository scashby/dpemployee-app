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

    // Load the updated template PDF
    console.log('Loading PDF template...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all form fields to identify available fields
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Step 1: Set the event details text fields
    console.log('Setting event text fields...');
    const textFieldMappings = [
      { names: ["Event Name :", "Event Name"], value: event.title || '' },
      { names: ["Event Date:", "Event Date"], value: formatDate(event.date) },
      { names: ["Event Set Up Time:", "Event Set Up Time"], value: formatTime(event.setup_time) },
      { names: ["Event Duration:", "Event Duration"], value: event.duration || '' },
      { names: ["DP Staff Attending:", "DP Staff Attending"], value: getAssignedEmployees() },
      { names: ["Event Contact(Name, Phone):", "Event Contact(Name, Phone)"], value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { names: ["Expected # of Attendees:", "Expected # of Attendees"], value: event.expected_attendees?.toString() || '' },
      { names: ["Additional Supplies:", "Additional Supplies"], value: event.supplies?.additional_supplies || '' },
      { names: ["Event Instructions:", "Event Instructions"], value: event.event_instructions || event.info || '' }
    ];
    
    // Try each name variation for each field
    textFieldMappings.forEach(mapping => {
      let fieldSet = false;
      
      for (const name of mapping.names) {
        if (!fieldSet && fieldNames.includes(name)) {
          try {
            const textField = form.getTextField(name);
            textField.setText(mapping.value);
            // Set consistent font size
            try { textField.setFontSize(10); } catch (e) { /* ignore font errors */ }
            console.log(`Set field "${name}" to "${mapping.value}"`);
            fieldSet = true;
          } catch (e) {
            console.warn(`Could not set field "${name}":`, e);
          }
        }
      }
      
      if (!fieldSet) {
        console.warn(`Could not find field for: ${mapping.names.join(', ')}`);
      }
    });
    
    // Step 2: Set checkbox fields
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
            console.log(`Checked "${mapping.name}"`);
          } else {
            checkbox.uncheck();
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${mapping.name}":`, e);
        }
      }
    });
    
    // Step 3: If "Other" is checked, set the "Other" text field
    if (event.event_type === 'other' && event.event_type_other) {
      const otherTextFieldNames = ["Other :", "Other :"];
      
      let otherFieldSet = false;
      for (const name of otherTextFieldNames) {
        if (!otherFieldSet && fieldNames.includes(name)) {
          try {
            const textField = form.getTextField(name);
            textField.setText(event.event_type_other);
            try { textField.setFontSize(10); } catch (e) { /* ignore */ }
            console.log(`Set Other text field "${name}" to "${event.event_type_other}"`);
            otherFieldSet = true;
          } catch (e) {
            console.warn(`Could not set Other text field "${name}":`, e);
          }
        }
      }
    }
    
    // Step 4: Set beer table fields - now they should be text fields in the updated template
    console.log('Setting beer table fields...');
    const beers = event.beers || [];
    
    // First, clear all beer fields to ensure empty rows stay empty
    for (let i = 1; i <= 5; i++) {
      try {
        // Clear beer style field
        if (fieldNames.includes(`Beer Style ${i}`)) {
          const textField = form.getTextField(`Beer Style ${i}`);
          textField.setText('');
        }
        
        // Clear package style field
        if (fieldNames.includes(`Package Style ${i}`)) {
          const textField = form.getTextField(`Package Style ${i}`);
          textField.setText('');
        }
        
        // Clear quantity field
        if (fieldNames.includes(`Quantity ${i}`)) {
          const textField = form.getTextField(`Quantity ${i}`);
          textField.setText('');
        }
      } catch (e) {
        console.warn(`Error clearing beer row ${i}:`, e);
      }
    }
    
    // Now set only beer rows that have data
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      // Skip empty beer entries
      if (!beer || (!beer.beer_style && !beer.packaging && !beer.quantity)) {
        continue;
      }
      
      const index = i + 1;
      
      // Set beer style
      if (beer.beer_style && fieldNames.includes(`Beer Style ${index}`)) {
        try {
          const textField = form.getTextField(`Beer Style ${index}`);
          textField.setText(beer.beer_style);
          try { textField.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set beer style ${index} to "${beer.beer_style}"`);
        } catch (e) {
          console.warn(`Failed to set beer style ${index}:`, e);
        }
      }
      
      // Set package style
      if (beer.packaging && fieldNames.includes(`Package Style ${index}`)) {
        try {
          const textField = form.getTextField(`Package Style ${index}`);
          textField.setText(beer.packaging);
          try { textField.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set package style ${index} to "${beer.packaging}"`);
        } catch (e) {
          console.warn(`Failed to set package style ${index}:`, e);
        }
      }
      
      // Set quantity
      if (beer.quantity && fieldNames.includes(`Quantity ${index}`)) {
        try {
          const textField = form.getTextField(`Quantity ${index}`);
          textField.setText(beer.quantity.toString());
          try { textField.setFontSize(10); } catch (e) { /* ignore */ }
          console.log(`Set quantity ${index} to "${beer.quantity}"`);
        } catch (e) {
          console.warn(`Failed to set quantity ${index}:`, e);
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
    
    console.log("PDF downloaded successfully");
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}