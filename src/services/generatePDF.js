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

    // Load the template PDF
    console.log('Loading PDF template...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Get all field names to verify which ones are available
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Set text fields - these weren't in the FDF but must exist in the form
    // We'll try common naming patterns based on the field labels in the form
    const textFields = [
      { name: "Event Name", value: event.title || '' },
      { name: "Event Date", value: formatDate(event.date) },
      { name: "Event Set Up Time", value: event.setup_time || '' },
      { name: "Event Duration", value: event.duration || '' },
      { name: "DP Staff Attending", value: getAssignedEmployees() },
      { name: "Event Contact(Name, Phone)", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { name: "Expected # of Attendees", value: event.expected_attendees?.toString() || '' },
      { name: "Additional Supplies", value: event.supplies?.additional_supplies || '' },
      { name: "Event Instructions", value: event.event_instructions || event.info || '' },
      { name: "Other Text", value: event.event_type === 'other' ? event.event_type_other || '' : '' }
    ];
    
    // Try to set each text field with variations
    console.log('Setting text fields...');
    textFields.forEach(field => {
      // Try variations of the field name
      const variations = [
        field.name,
        field.name.replace(/\s/g, ''),
        field.name.replace(/\s/g, '_'),
        field.name + ':',
        field.name.toLowerCase(),
        field.name.toUpperCase()
      ];
      
      let fieldSet = false;
      variations.forEach(variation => {
        if (!fieldSet && fieldNames.includes(variation)) {
          try {
            const textField = form.getTextField(variation);
            textField.setText(field.value);
            textField.setFontSize(10); // Set consistent font size
            console.log(`Set field "${variation}" to "${field.value}"`);
            fieldSet = true;
          } catch (e) {
            console.warn(`Failed to set field "${variation}":`, e.message);
          }
        }
      });
      
      if (!fieldSet) {
        console.warn(`Could not find field for "${field.name}"`);
      }
    });
    
    // Set checkbox fields - these are from the FDF
    const checkboxFields = [
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
    
    // Set checkboxes based on the exact field names from FDF
    console.log('Setting checkboxes...');
    checkboxFields.forEach(checkbox => {
      if (fieldNames.includes(checkbox.name)) {
        try {
          const checkboxField = form.getCheckBox(checkbox.name);
          if (checkbox.checked) {
            checkboxField.check();
            console.log(`Checked "${checkbox.name}"`);
          } else {
            checkboxField.uncheck();
            console.log(`Unchecked "${checkbox.name}"`);
          }
        } catch (e) {
          console.warn(`Failed to set checkbox "${checkbox.name}":`, e.message);
        }
      } else {
        console.warn(`Checkbox "${checkbox.name}" not found in form`);
      }
    });
    
    // Set beer fields - these are from the FDF
    const beers = event.beers || [];
    console.log('Setting beer fields...');
    
    // Process up to 5 beers (maximum from FDF)
    for (let i = 0; i < Math.min(beers.length, 5); i++) {
      const beer = beers[i];
      const styleField = `Beer Style ${i+1}`;
      const packageField = `Package Style ${i+1}`;
      
      // Set beer style
      if (fieldNames.includes(styleField)) {
        try {
          const textField = form.getTextField(styleField);
          textField.setText(beer.beer_style || '');
          textField.setFontSize(10);
          console.log(`Set "${styleField}" to "${beer.beer_style}"`);
        } catch (e) {
          console.warn(`Failed to set "${styleField}":`, e.message);
        }
      }
      
      // Set package style
      if (fieldNames.includes(packageField)) {
        try {
          const textField = form.getTextField(packageField);
          textField.setText(beer.packaging || '');
          textField.setFontSize(10);
          console.log(`Set "${packageField}" to "${beer.packaging}"`);
        } catch (e) {
          console.warn(`Failed to set "${packageField}":`, e.message);
        }
      }
      
      // Set quantity (not shown in FDF, but must exist)
      const quantityField = `Quantity ${i+1}`;
      if (fieldNames.includes(quantityField)) {
        try {
          const textField = form.getTextField(quantityField);
          textField.setText(beer.quantity?.toString() || '');
          textField.setFontSize(10);
          console.log(`Set "${quantityField}" to "${beer.quantity}"`);
        } catch (e) {
          console.warn(`Failed to set "${quantityField}":`, e.message);
        }
      }
    }
    
    // Save the PDF without flattening to maintain formatting
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