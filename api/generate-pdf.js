// api/generate-pdf.js
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const data = req.body;
    
    // Helper functions
    const getAssignedEmployees = () => {
      return data.staffAttending || '';
    };

    // Load the template PDF
    console.log('Loading PDF template...');
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Basic text field setter - absolute minimum approach
    const setTextField = (name, value) => {
      if (!value) return;
      try {
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        // Silent error handling to prevent crashes
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
        // Silent error handling
      }
    };
    
    // Set all fields with minimal code
    // Event info
    setTextField("Event Name", data.title);
    setTextField("Event Date", data.date);
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
    
    // Very important: DO NOT FLATTEN
    
    // Save the PDF without flattening
    console.log('Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    
    // Send the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title || 'Event'}_Form.pdf"`);
    res.send(Buffer.from(pdfBytes));
    
    console.log('PDF generated and sent successfully.');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message || 'Error generating PDF' });
  }
}