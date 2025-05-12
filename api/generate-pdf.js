// /api/generate-pdf.js
import { buffer } from 'micro';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the request body
    const buf = await buffer(req);
    const data = JSON.parse(buf.toString());
    
    // Format helper functions
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
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Get all fields for debugging
    const fields = form.getFields();
    const fieldNames = fields.map(f => f.getName());
    console.log('Available fields:', fieldNames);
    
    // Create a universal approach to set fields
    // This function handles all form fields consistently
    const setField = (fieldName, value) => {
      if (!fieldName || value === undefined || value === null) return;
      
      try {
        // Check if the field exists
        if (!fieldNames.includes(fieldName)) {
          console.log(`Field "${fieldName}" not found in the form`);
          return;
        }
        
        // Get field type
        const field = form.getFieldMaybe(fieldName);
        if (!field) {
          console.log(`Field "${fieldName}" could not be accessed`);
          return;
        }
        
        // Handle based on field type
        const fieldType = field.constructor.name;
        
        if (fieldType === 'PDFCheckBox') {
          // Handle checkbox
          if (value === true) {
            field.check();
          } else {
            field.uncheck();
          }
          console.log(`Set checkbox "${fieldName}" to ${value}`);
        } 
        else if (fieldType === 'PDFTextField') {
          // Handle text field - using a UNIVERSAL approach for all text fields
          
          // Step 1: Clear the field first
          field.setText('');
          
          // Step 2: Get the acroField for lower-level access 
          const acroField = field.acroField;
          
          // Step 3: Set the field value directly using the lower-level API if possible
          if (acroField) {
            // Use the context object to create a proper PDF string
            const pdfString = pdfDoc.context.string(value.toString());
            acroField.setValue(pdfString);
          } 
          // Step 4: Fallback to the standard method if needed
          else {
            field.setText(value.toString());
          }
          
          console.log(`Set text field "${fieldName}" to "${value}"`);
        }
        else {
          console.log(`Unsupported field type ${fieldType} for field "${fieldName}"`);
        }
      } catch (e) {
        console.error(`Error setting field "${fieldName}":`, e);
      }
    };
    
    // Map form data to PDF fields
    const formMappings = {
      // Basic text fields
      "Event Name": data.title || '',
      "Event Date": formatDate(data.date),
      "Event Set Up Time": formatTime(data.setup_time),
      "Event Duration": data.duration || '',
      "DP Staff Attending": data.staffAttending || '',
      "Event Contact": data.contact_name ? `${data.contact_name} ${data.contact_phone || ''}` : '',
      "Expected Attendees": data.expected_attendees?.toString() || '',
      "Other More Detail": data.event_type === 'other' ? data.event_type_other || '' : '',
      "Additional Supplies": data.supplies?.additional_supplies || '',
      "Event Instructions": data.event_instructions || data.info || '',
      
      // Checkboxes
      "Tasting": data.event_type === 'tasting',
      "Pint Night": data.event_type === 'pint_night',
      "Beer Fest": data.event_type === 'beer_fest',
      "Other": data.event_type === 'other',
      "Table": data.supplies?.table_needed,
      "Beer Buckets": data.supplies?.beer_buckets,
      "Table Cloth": data.supplies?.table_cloth,
      "Tent Weights": data.supplies?.tent_weights,
      "Signage": data.supplies?.signage,
      "Ice": data.supplies?.ice,
      "Jockey Box": data.supplies?.jockey_box,
      "Cups": data.supplies?.cups
    };
    
    // Add beer table fields
    if (data.beers && data.beers.length > 0) {
      for (let i = 0; i < data.beers.length && i < 5; i++) {
        const idx = i + 1;
        const beer = data.beers[i];
        
        if (beer) {
          formMappings[`Beer Style ${idx}`] = beer.beer_style || '';
          formMappings[`Package Style ${idx}`] = beer.packaging || '';
          formMappings[`Quantity ${idx}`] = beer.quantity?.toString() || '';
        }
      }
    }
    
    // Set all form fields using our universal approach
    for (const [fieldName, value] of Object.entries(formMappings)) {
      setField(fieldName, value);
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Send the PDF as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title || 'Event'}_Form.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error in generate-pdf API:', error);
    res.status(500).json({ error: error.message || 'Error generating PDF' });
  }
}