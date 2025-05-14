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
    
    // Simple field setters with error handling
    const setTextField = (name, value) => {
      if (!value) return;
      try {
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        console.log(`Warning: Could not set field ${name}: ${e.message}`);
      }
    };
    
    const setCheckBox = (name, checked) => {
      try {
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.log(`Warning: Could not set checkbox ${name}: ${e.message}`);
      }
    };
    
    // Fill in form fields using exact field names from Adobe
    console.log('Filling form fields...');
    
    // Event details
    setTextField("Event Name", data.title);
    setTextField("Event Date", data.date);
    setTextField("Event Set Up Time", data.setup_time);
    setTextField("Event Duration", data.duration);
    setTextField("DP Staff Attending", data.staffAttending);
    setTextField("Event ContactName Phone", data.contact_name ? 
      `${data.contact_name}${data.contact_phone ? ` (${data.contact_phone})` : ''}` : '');
    setTextField("Expected Attendees", data.expected_attendees?.toString());
    
    // Event type
    setCheckBox("Tasting", data.event_type === 'tasting');
    setCheckBox("Pint Night", data.event_type === 'pint_night');
    setCheckBox("Beer Fest", data.event_type === 'beer_fest');
    setCheckBox("Other", data.event_type === 'other');
    
    // If Other is selected, populate the Other Details field 
    if (data.event_type === 'other' && data.event_type_other) {
      setTextField("Other Details", data.event_type_other);
    }
    
    // Beer products - using exact field names from Adobe field panel
    if (data.beers && data.beers.length > 0) {
      // Process beer 1
      if (data.beers[0]) {
        setTextField("First Beer Style", data.beers[0].beer_style);
        setTextField("First Beer Package Style", data.beers[0].packaging || '');
        setTextField("First Beer Quantity", data.beers[0].quantity?.toString() || '1');
      }
      
      // Process beer 2
      if (data.beers[1]) {
        setTextField("Second Beer Style", data.beers[1].beer_style);
        setTextField("Second Beer Package Style", data.beers[1].packaging || '');
        setTextField("Second Beer Quantity", data.beers[1].quantity?.toString() || '1');
      }
      
      // Process beer 3
      if (data.beers[2]) {
        setTextField("Third Beer Style", data.beers[2].beer_style);
        setTextField("Third Beer Package Style", data.beers[2].packaging || '');
        setTextField("Third Beer Quantity", data.beers[2].quantity?.toString() || '1');
      }
      
      // Process beer 4
      if (data.beers[3]) {
        setTextField("Fourth Beer Style", data.beers[3].beer_style);
        setTextField("Fourth Beer Package Style", data.beers[3].packaging || '');
        setTextField("Fourth Beer Quantity", data.beers[3].quantity?.toString() || '1');
      }
      
      // Process beer 5
      if (data.beers[4]) {
        setTextField("Fifth Beer Style", data.beers[4].beer_style);
        setTextField("Fifth Beer Package Style", data.beers[4].packaging || '');
        setTextField("Fifth Beer Quantity", data.beers[4].quantity?.toString() || '1');
      }
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
    
    // For the estimated attendees field - using exact field name from Adobe
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
    
    // The return equipment by field - using exact field name from Adobe
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