// api/generate-pdf.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
    
    // Get the first page
    const page = pdfDoc.getPages()[0];
    
    // Define the font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Field coordinates (these will need to be adjusted to match your form template)
    // format: [x, y, fontSize]
    const fieldPositions = {
      "Event Name": [700, 700, 10],
      "Event Date": [700, 670, 10],
      "Event Set Up Time": [700, 640, 10],
      "Event Duration": [700, 610, 10],
      "DP Staff Attending": [700, 580, 10],
      "Event Contact": [700, 550, 10],
      "Expected Attendees": [600, 520, 10],
      "Other More Detail": [600, 490, 10],
      "Additional Supplies": [700, 450, 10],
      "Event Instructions": [700, 420, 10],
      // Beer table positions - you'll need to adjust these
      "Beer Style 1": [580, 380, 10], 
      "Package Style 1": [680, 380, 10],
      "Quantity 1": [750, 380, 10],
      "Beer Style 2": [580, 360, 10],
      "Package Style 2": [680, 360, 10],
      "Quantity 2": [750, 360, 10]
    };
    
    // Checkbox positions (these will need to be adjusted)
    // format: [x, y, isChecked]
    const checkboxPositions = {
      "Tasting": [530, 500, data.event_type === 'tasting'],
      "Pint Night": [530, 480, data.event_type === 'pint_night'],
      "Beer Fest": [530, 460, data.event_type === 'beer_fest'],
      "Other": [530, 440, data.event_type === 'other'],
      "Table": [800, 380, data.supplies?.table_needed],
      "Beer Buckets": [800, 360, data.supplies?.beer_buckets],
      "Table Cloth": [800, 340, data.supplies?.table_cloth],
      "Tent Weights": [800, 320, data.supplies?.tent_weights],
      "Signage": [800, 300, data.supplies?.signage],
      "Ice": [800, 280, data.supplies?.ice],
      "Jockey Box": [800, 260, data.supplies?.jockey_box],
      "Cups": [800, 240, data.supplies?.cups]
    };
    
    // Draw text directly on the page
    for (const [fieldName, value] of Object.entries({
      "Event Name": data.title,
      "Event Date": data.date,
      "Event Set Up Time": data.setup_time,
      "Event Duration": data.duration,
      "DP Staff Attending": getAssignedEmployees(),
      "Event Contact": data.contact_name ? `${data.contact_name} ${data.contact_phone || ''}` : '',
      "Expected Attendees": data.expected_attendees,
      "Other More Detail": data.event_type === 'other' ? data.event_type_other : '',
      "Additional Supplies": data.supplies?.additional_supplies,
      "Event Instructions": data.event_instructions || data.info
    })) {
      if (!value) continue;
      
      if (fieldPositions[fieldName]) {
        const [x, y, fontSize] = fieldPositions[fieldName];
        page.drawText(String(value), {
          x: x,
          y: y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
      }
    }
    
    // Draw beer table fields
    if (data.beers && data.beers.length > 0) {
      for (let i = 0; i < Math.min(data.beers.length, 5); i++) {
        const idx = i + 1;
        const beer = data.beers[i];
        if (beer) {
          const beerStyleField = `Beer Style ${idx}`;
          const packageStyleField = `Package Style ${idx}`;
          const quantityField = `Quantity ${idx}`;
          
          if (fieldPositions[beerStyleField] && beer.beer_style) {
            const [x, y, fontSize] = fieldPositions[beerStyleField];
            page.drawText(beer.beer_style, {
              x: x,
              y: y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0)
            });
          }
          
          if (fieldPositions[packageStyleField] && beer.packaging) {
            const [x, y, fontSize] = fieldPositions[packageStyleField];
            page.drawText(beer.packaging, {
              x: x,
              y: y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0)
            });
          }
          
          if (fieldPositions[quantityField] && beer.quantity) {
            const [x, y, fontSize] = fieldPositions[quantityField];
            page.drawText(String(beer.quantity), {
              x: x,
              y: y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0)
            });
          }
        }
      }
    }
    
    // Draw checkboxes
    for (const [checkboxName, [x, y, isChecked]] of Object.entries(checkboxPositions)) {
      if (isChecked) {
        // Draw a filled square for checked
        page.drawRectangle({
          x: x,
          y: y,
          width: 10,
          height: 10,
          color: rgb(0, 0, 0)
        });
      }
    }
    
    // Save without any form manipulation
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