// api/generate-pdf.js
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get data from request body
    const data = req.body;
    console.log('Received data:', JSON.stringify(data).substring(0, 100) + '...');

    // Load the PDF template
    console.log('Loading PDF template...');
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    
    // Make sure the file exists
    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath);
      return res.status(500).json({ error: 'PDF template file not found' });
    }
    
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF document
    console.log('Parsing PDF document...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Log all form field names for debugging
    console.log('Available form fields:');
    form.getFields().forEach(field => {
      console.log(`- ${field.getName()} (${field.constructor.name})`);
    });
    
    // Enhanced field setters with better error handling
    const setTextField = (name, value) => {
      if (!value) return;
      try {
        console.log(`Setting text field "${name}" to "${value}"`);
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        console.error(`Error setting field ${name}: ${e.message}`);
      }
    };
    
    const setCheckBox = (name, checked) => {
      try {
        console.log(`Setting checkbox "${name}" to ${checked ? 'checked' : 'unchecked'}`);
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.error(`Error setting checkbox ${name}: ${e.message}`);
      }
    };
    
    // Fill in form fields
    console.log('Filling form fields...');
    
    // Event details
    setTextField("Event Name", data.title);
    setTextField("Event Date", data.date);
    setTextField("Event Set Up Time", data.setup_time);
    setTextField("Event Duration", data.duration);
    setTextField("DP Staff Attending", data.staffAttending);
    setTextField("Event ContactName Phone", data.contact_name ? 
      `${data.contact_name}${data.contact_phone ? ` (${data.contact_phone})` : ''}` : '');
    setTextField("Expected # of Attendees", data.expected_attendees?.toString());
    
    // Event type
    setCheckBox("Tasting", data.event_type === 'tasting');
    setCheckBox("Pint Night", data.event_type === 'pint_night');
    setCheckBox("Beer Fest", data.event_type === 'beer_fest');
    setCheckBox("Other", data.event_type === 'other');
    
    // If Other is selected, populate the Other Details field 
    if (data.event_type === 'other' && data.event_type_other) {
      setTextField("Other Details", data.event_type_other);
    }
    
    // Beer products - Fill in the table with detailed logging
    if (data.beers && data.beers.length > 0) {
      console.log(`Processing ${data.beers.length} beers`);
      
      // Process each beer row
      for (let i = 0; i < Math.min(data.beers.length, 5); i++) {
        const beer = data.beers[i];
        const rowNum = i + 1;
        
        if (beer) {
          console.log(`Beer ${rowNum}:`, beer);
          
          // Set beer style field
          const styleField = `${getOrdinal(rowNum)} Beer Style`;
          setTextField(styleField, beer.beer_style);
          
          // Set beer packaging field
          const packagingField = `${getOrdinal(rowNum)} Beer Packaging`;
          setTextField(packagingField, beer.packaging || '');
          
          // Set beer quantity field
          const quantityField = `${getOrdinal(rowNum)} Beer Quantity`;
          setTextField(quantityField, beer.quantity?.toString() || '1');
        }
      }
    } else {
      console.log('No beers to process');
    }
    
    // Supplies checkboxes - using exact field names from the form
    setCheckBox("Table", data.supplies?.table_needed);
    setCheckBox("Table Cloth", data.supplies?.table_cloth);
    setCheckBox("Signage", data.supplies?.signage);
    setCheckBox("Jockey Box", data.supplies?.jockey_box);
    setCheckBox("Cups", data.supplies?.cups);
    setCheckBox("Beer buckets", data.supplies?.beer_buckets);
    setCheckBox("Tent and Weights", data.supplies?.tent_weights);
    setCheckBox("Ice", data.supplies?.ice);
    
    // Additional supplies and instructions
    setTextField("Additional Supplies", data.supplies?.additional_supplies || '');
    setTextField("Event Instructions", data.event_instructions || data.info || '');
    
    // For the estimated attendees field
    setTextField("EstimatedAttendees", data.notes?.estimated_attendees?.toString() || '');
    
    // Post-event notes are now in a single field
    if (data.notes) {
      let notesText = '';
      if (data.notes.favorite_beer) {
        notesText += `Favorite beer: ${data.notes.favorite_beer}\n`;
      }
      if (data.notes.enough_product !== undefined) {
        notesText += `Enough product: ${data.notes.enough_product ? 'Yes' : 'No'}\n`;
      }
      if (data.notes.adequately_staffed !== undefined) {
        notesText += `Adequately staffed: ${data.notes.adequately_staffed ? 'Yes' : 'No'}\n`;
      }
      if (data.notes.continue_participation !== undefined) {
        notesText += `Continue participation: ${data.notes.continue_participation ? 'Yes' : 'No'}\n`;
      }
      if (data.notes.critiques) {
        notesText += `Critiques: ${data.notes.critiques}`;
      }
      
      setTextField("Post Event Notes", notesText);
    }
    
    // The return equipment by field
    setTextField("RETURN EQUIPMENT BY", data.notes?.return_equipment_by || '');
    
    // Save the PDF
    console.log('Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    
    // Send the PDF as a response
    console.log('Sending PDF response...');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title || 'Event'}_Form.pdf"`);
    res.send(Buffer.from(pdfBytes));
    
    console.log('PDF generation completed successfully.');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message || 'Error generating PDF' });
  }
}

// Helper function to get ordinal (First, Second, etc.)
function getOrdinal(num) {
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
  return ordinals[num - 1] || `${num}th`;
}