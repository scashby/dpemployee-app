// api/generate-pdf.js
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const data = req.body;
    
    // Get assigned employees
    const getAssignedEmployees = () => {
      if (!data.staffAttending) return '';
      return data.staffAttending;
    };

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return dateString;
    };

    // Load the template PDF
    console.log('Loading PDF template...');
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // STEP 1: Fill the form without flattening
    console.log('Step 1: Filling form fields without flattening...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Basic text field setter - no font manipulation
    const setTextField = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      try {
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        console.log(`Error setting field ${name}:`, e.message);
      }
    };
    
    // Set checkboxes
    const setCheckbox = (name, checked) => {
      try {
        const checkbox = form.getCheckBox(name);
        if (checked) {
          checkbox.check();
        } else {
          checkbox.uncheck();
        }
      } catch (e) {
        console.log(`Error setting checkbox ${name}:`, e.message);
      }
    };
    
    // Set text fields
    console.log('Setting text fields...');
    setTextField("Event Name", data.title);
    setTextField("Event Date", formatDate(data.date));
    setTextField("Event Set Up Time", data.setup_time);
    setTextField("Event Duration", data.duration);
    setTextField("DP Staff Attending", getAssignedEmployees());
    setTextField("Event Contact", data.contact_name ? `${data.contact_name} ${data.contact_phone || ''}` : '');
    setTextField("Expected Attendees", data.expected_attendees);
    setTextField("Event Instructions", data.event_instructions || data.info || '');
    setTextField("Additional Supplies", data.supplies?.additional_supplies || '');
    
    if (data.event_type === 'other') {
      setTextField("Other More Detail", data.event_type_other || '');
    }
    
    // Beer table fields
    console.log('Setting beer table fields...');
    if (data.beers && data.beers.length > 0) {
      for (let i = 0; i < Math.min(data.beers.length, 5); i++) {
        const idx = i + 1;
        const beer = data.beers[i];
        if (beer) {
          setTextField(`Beer Style ${idx}`, beer.beer_style || '');
          setTextField(`Package Style ${idx}`, beer.packaging || '');
          setTextField(`Quantity ${idx}`, beer.quantity?.toString() || '');
        }
      }
    }
    
    // Set checkboxes
    console.log('Setting checkboxes...');
    setCheckbox("Tasting", data.event_type === 'tasting');
    setCheckbox("Pint Night", data.event_type === 'pint_night');
    setCheckbox("Beer Fest", data.event_type === 'beer_fest');
    setCheckbox("Other", data.event_type === 'other');
    
    setCheckbox("Table", data.supplies?.table_needed);
    setCheckbox("Beer Buckets", data.supplies?.beer_buckets);
    setCheckbox("Table Cloth", data.supplies?.table_cloth);
    setCheckbox("Tent Weights", data.supplies?.tent_weights);
    setCheckbox("Signage", data.supplies?.signage);
    setCheckbox("Ice", data.supplies?.ice);
    setCheckbox("Jockey Box", data.supplies?.jockey_box);
    setCheckbox("Cups", data.supplies?.cups);
    
    // Save the filled (but unflattened) PDF
    console.log('Saving intermediate filled PDF...');
    const filledBytes = await pdfDoc.save();
    
    // STEP 2: Create a new PDF document from the filled PDF and flatten it
    console.log('Step 2: Loading filled PDF and flattening...');
    const flattenDoc = await PDFDocument.load(filledBytes);
    const flattenForm = flattenDoc.getForm();
    
    // Flatten the form
    console.log('Flattening form...');
    flattenForm.flatten();
    
    // Save the flattened PDF
    console.log('Saving flattened PDF...');
    const flattenedBytes = await flattenDoc.save();
    
    // Send the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title || 'Event'}_Form.pdf"`);
    res.send(Buffer.from(flattenedBytes));
    
    console.log('PDF generated and sent successfully.');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message || 'Error generating PDF' });
  }
}