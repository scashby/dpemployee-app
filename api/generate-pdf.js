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
    console.log('Received data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');

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
    
    // Fill in form fields
    console.log('Filling form fields...');
    
    // Event details
    setTextField("Event Name", data.title);
    setTextField("Event Date", data.date);
    setTextField("Event Set Up Time", data.setup_time);
    setTextField("Event Duration", data.duration);
    setTextField("DP Staff Attending", data.staffAttending);
    setTextField("Event Contact(Name, Phone)", data.contact_name ? 
      `${data.contact_name}${data.contact_phone ? ` (${data.contact_phone})` : ''}` : '');
    setTextField("Expected # of Attendees", data.expected_attendees?.toString());
    
    // Event type
    setCheckBox("Tasting", data.event_type === 'tasting');
    setCheckBox("Pint Night", data.event_type === 'pint_night');
    setCheckBox("Beer Fest", data.event_type === 'beer_fest');
    setCheckBox("Other", data.event_type === 'other');
    
    // If Other is selected, populate the Other field with the specific type
    if (data.event_type === 'other' && data.event_type_other) {
      // There may be an Other field to populate with the specific type
      try {
        setTextField("Other", data.event_type_other);
      } catch (e) {
        console.log("No separate Other field found");
      }
    }
    
    // Beer products - Fill in the table
    if (data.beers && data.beers.length > 0) {
      // The PDF template has 5 rows for beers
      for (let i = 0; i < Math.min(data.beers.length, 5); i++) {
        const beer = data.beers[i];
        if (beer && beer.beer_style) {
          setTextField(`Beer Style ${i+1}`, beer.beer_style);
          setTextField(`Pkg ${i+1}`, beer.packaging || '');
          setTextField(`Qty ${i+1}`, beer.quantity?.toString() || '1');
        }
      }
    }
    
    // Supplies checkboxes
    setCheckBox("Table", data.supplies?.table_needed);
    setCheckBox("Table Cloth", data.supplies?.table_cloth);
    setCheckBox("Signage", data.supplies?.signage);
    setCheckBox("Jockey box", data.supplies?.jockey_box);
    setCheckBox("Cups", data.supplies?.cups);
    setCheckBox("Beer buckets", data.supplies?.beer_buckets);
    setCheckBox("Tent/Weights", data.supplies?.tent_weights);
    setCheckBox("Ice", data.supplies?.ice);
    
    // Additional supplies and instructions
    setTextField("Additional Supplies", data.supplies?.additional_supplies || '');
    setTextField("Event Instructions", data.event_instructions || data.info || '');
    
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