import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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

    // COMPLETELY NEW APPROACH: Draw on top of the PDF instead of using form fields
    
    // Load the template PDF
    console.log('Loading PDF template...');
    const pdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => 
      res.arrayBuffer()
    );
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Register fontkit and a standard font
    pdfDoc.registerFontkit(fontkit);
    
    // Load a standard font for text fields
    // This ensures consistent fonts across all text fields
    const fontBytes = await fetch('/Helvetica.ttf').then(res => res.arrayBuffer())
      .catch(() => {
        console.log('Standard font not available, using built-in font');
        return null;
      });
    
    let font;
    try {
      if (fontBytes) {
        font = await pdfDoc.embedFont(fontBytes);
      } else {
        font = await pdfDoc.embedFont('Helvetica');
      }
    } catch (e) {
      console.warn('Failed to embed custom font, using standard font');
      font = await pdfDoc.embedFont('Helvetica');
    }
    
    // Get the first page of the PDF
    const pages = pdfDoc.getPages();
    const page = pages[0];
    
    // Get all form fields
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Handle checkboxes normally as they work fine
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
    
    // For text fields, try using the form fields first
    console.log('Setting text fields using form fields...');
    const textFieldMappings = [
      { name: "Event Name", value: event.title || '' },
      { name: "Event Date", value: formatDate(event.date) },
      { name: "Event Set Up Time", value: formatTime(event.setup_time) },
      { name: "Event Duration", value: event.duration || '' },
      { name: "DP Staff Attending", value: getAssignedEmployees() },
      { name: "Event Contact", value: event.contact_name ? `${event.contact_name} ${event.contact_phone || ''}` : '' },
      { name: "Expected Attendees", value: event.expected_attendees?.toString() || '' },
      { name: "Additional Supplies", value: event.supplies?.additional_supplies || '' },
      { name: "Event Instructions", value: event.event_instructions || event.info || '' }
    ];
    
    if (event.event_type === 'other') {
      textFieldMappings.push({
        name: "Other More Detail",
        value: event.event_type_other || ''
      });
    }
    
    // Try to use form fields for regular text fields
    for (const mapping of textFieldMappings) {
      try {
        // Try different variations of the field name
        const fieldVariations = [
          mapping.name,
          `${mapping.name}:`,
          ...fieldNames.filter(name => name.toLowerCase().includes(mapping.name.toLowerCase()))
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
        
        if (!success) {
          console.warn(`Could not find field for "${mapping.name}"`);
        }
      } catch (e) {
        console.warn(`Error setting field "${mapping.name}":`, e.message);
      }
    }
    
    // BYPASS FORM FIELDS FOR PROBLEMATIC BEER TABLE
    console.log('Using direct text drawing for beer table fields...');
    
    // Attempt to flatten the form to avoid field issues
    // This makes the form non-editable but fixes appearance
    form.flatten();
    
    // Find the coordinates for the beer table cells
    // These would need to be adjusted based on your actual PDF layout
    const beerTableX = 620;  // X-coordinate for beer table
    const beerTable = [
      { y: 704, style: 'Handline Kolsch', pkg: '1/6 Barrel Keg', qty: '1' }, // Row 1
      { y: 676, style: 'Stonehorse Citra IPA', pkg: 'Case - 16 oz', qty: '1' } // Row 2
    ];
    
    // Draw the beer table values directly on the page
    if (event.beers && event.beers.length > 0) {
      for (let i = 0; i < Math.min(event.beers.length, 2); i++) {
        const beer = event.beers[i];
        if (!beer) continue;
        
        const row = beerTable[i];
        
        if (beer.beer_style) {
          // Draw beer style
          page.drawText(beer.beer_style, {
            x: 555,
            y: row.y,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        }
        
        if (beer.packaging) {
          // Draw package type
          page.drawText(beer.packaging, {
            x: 726,
            y: row.y,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        }
        
        if (beer.quantity) {
          // Draw quantity
          page.drawText(beer.quantity.toString(), {
            x: 810,
            y: row.y,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        }
      }
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