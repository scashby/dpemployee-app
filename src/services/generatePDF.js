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
    
    // DIAGNOSTIC: Get detailed information about all fields
    console.log('DIAGNOSTIC: Examining all form fields...');
    const fields = form.getFields();
    
    // Detailed field examination
    fields.forEach(field => {
      // Get field type and name
      const fieldType = field.constructor.name;
      const fieldName = field.getName();
      
      // Get detailed field properties
      try {
        const acroField = field.acroField;
        const hasAppearances = !!acroField?.getAppearances();
        const dictionary = acroField?.dict;
        const dictEntries = dictionary ? Object.keys(dictionary.dict) : [];
        
        console.log(`Field "${fieldName}" (${fieldType}):`);
        console.log(`  Has appearances: ${hasAppearances}`);
        console.log(`  Dictionary entries: ${dictEntries.join(', ')}`);
        
        // If this is one of our problematic fields, log even more details
        if (fieldName.includes('Beer Style') || fieldName.includes('Package Style')) {
          console.log(`  DETAILED ANALYSIS FOR "${fieldName}":`);
          if (acroField) {
            console.log(`  Field value: ${acroField.getValueAsString()}`);
            
            // Check if it has options (like a dropdown would)
            const options = acroField.getOptions?.() || [];
            if (options.length > 0) {
              console.log(`  Has ${options.length} options`);
            }
            
            // Other properties that might be relevant
            console.log(`  Field flags: ${acroField.getFlags?.() || 'N/A'}`);
          }
        }
      } catch (e) {
        console.log(`  Error examining field: ${e.message}`);
      }
    });
    
    // Create a universal text field setter that logs everything
    console.log('Setting text fields...');
    const setTextField = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      try {
        console.log(`Setting field "${name}" to "${value}"...`);
        
        const field = form.getTextField(name);
        const originalValue = field.getText();
        console.log(`  Original value: "${originalValue}"`);
        
        // Try to clear the field first
        field.setText('');
        console.log(`  Cleared field`);
        
        // Now set the actual value
        field.setText(String(value).trim());
        const newValue = field.getText();
        console.log(`  New value: "${newValue}"`);
        
        if (newValue !== String(value).trim()) {
          console.log(`  WARNING: Field value doesn't match what we set!`);
          // Try alternate setting method for problematic fields
          try {
            const acroField = field.acroField;
            if (acroField) {
              console.log(`  Trying alternate method via acroField...`);
              // Use the string encoder from pdfDoc
              const pdfString = pdfDoc.context.string(String(value).trim());
              acroField.setValue(pdfString);
              console.log(`  Set via alternate method`);
            }
          } catch (e2) {
            console.log(`  Alternate method failed: ${e2.message}`);
          }
        }
      } catch (e) {
        console.error(`Error setting ${name}:`, e);
      }
    };
    
    // Set normal fields - these work fine
    setTextField("Event Name", event.title);
    setTextField("Event Date", formatDate(event.date));
    setTextField("Event Set Up Time", formatTime(event.setup_time));
    setTextField("Event Duration", event.duration);
    setTextField("DP Staff Attending", getAssignedEmployees());
    setTextField("Event Contact", event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '');
    setTextField("Expected Attendees", event.expected_attendees);
    setTextField("Event Instructions", event.event_instructions || event.info);
    setTextField("Additional Supplies", event.supplies?.additional_supplies);
    
    if (event.event_type === 'other') {
      setTextField("Other More Detail", event.event_type_other);
    }
    
    // FOCUS ON PROBLEMATIC FIELDS
    console.log('SPECIAL FOCUS: Setting beer table fields...');
    if (event.beers && event.beers.length > 0) {
      // Beer 1
      if (event.beers[0]) {
        // Try multiple different ways to set these problematic fields
        // 1. Standard approach
        setTextField("Beer Style 1", event.beers[0].beer_style);
        setTextField("Package Style 1", event.beers[0].packaging);
        setTextField("Quantity 1", event.beers[0].quantity);
        
        // 2. Try force-removing any default appearance and then setting
        try {
          console.log("Trying to forcibly override appearances for Beer Style 1...");
          const field = form.getTextField("Beer Style 1");
          const acroField = field.acroField;
          
          if (acroField) {
            // Try to force-clear any appearance streams
            acroField.dict.set('AP', pdfDoc.context.obj({}));
            field.setText(event.beers[0].beer_style);
            console.log("Applied appearance override for Beer Style 1");
          }
        } catch (e) {
          console.log("Appearance override failed:", e);
        }
      }
      
      // Beer 2 (if any)
      if (event.beers.length > 1 && event.beers[1]) {
        setTextField("Beer Style 2", event.beers[1].beer_style);
        setTextField("Package Style 2", event.beers[1].packaging);
        setTextField("Quantity 2", event.beers[1].quantity);
      }
    }
    
    // Set checkboxes normally
    console.log('Setting checkboxes...');
    const setCheckbox = (name, checked) => {
      try {
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.error(`Error setting checkbox ${name}:`, e);
      }
    };
    
    setCheckbox("Tasting", event.event_type === 'tasting');
    setCheckbox("Pint Night", event.event_type === 'pint_night');
    setCheckbox("Beer Fest", event.event_type === 'beer_fest');
    setCheckbox("Other", event.event_type === 'other');
    
    setCheckbox("Table", event.supplies?.table_needed);
    setCheckbox("Beer Buckets", event.supplies?.beer_buckets);
    setCheckbox("Table Cloth", event.supplies?.table_cloth);
    setCheckbox("Tent Weights", event.supplies?.tent_weights);
    setCheckbox("Signage", event.supplies?.signage);
    setCheckbox("Ice", event.supplies?.ice);
    setCheckbox("Jockey Box", event.supplies?.jockey_box);
    setCheckbox("Cups", event.supplies?.cups);
    
    // Save and download the PDF
    console.log('Saving PDF...');
    const modifiedPdfBytes = await pdfDoc.save();
    
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