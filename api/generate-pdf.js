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
    
    // Format helper functions (copied from client-side)
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
    
    // Log the data received for debugging
    console.log('Received data:', data);
    
    // Load the template PDF
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Fill form fields - using direct field access
    // Basic fields
    try {
      form.getTextField("Event Name").setText(data.title || '');
      form.getTextField("Event Date").setText(formatDate(data.date));
      form.getTextField("Event Set Up Time").setText(formatTime(data.setup_time));
      form.getTextField("Event Duration").setText(data.duration || '');
      form.getTextField("DP Staff Attending").setText(data.staffAttending || '');
      form.getTextField("Event Contact").setText(data.contact_name ? `${data.contact_name} ${data.contact_phone || ''}` : '');
      form.getTextField("Expected Attendees").setText(data.expected_attendees?.toString() || '');
      
      if (data.event_type === 'other') {
        form.getTextField("Other More Detail").setText(data.event_type_other || '');
      }
      
      form.getTextField("Additional Supplies").setText(data.supplies?.additional_supplies || '');
      form.getTextField("Event Instructions").setText(data.event_instructions || data.info || '');
    } catch (e) {
      console.error('Error setting text fields:', e);
    }
    
    // Set checkboxes
    try {
      if (data.event_type === 'tasting') form.getCheckBox("Tasting").check();
      else form.getCheckBox("Tasting").uncheck();
      
      if (data.event_type === 'pint_night') form.getCheckBox("Pint Night").check();
      else form.getCheckBox("Pint Night").uncheck();
      
      if (data.event_type === 'beer_fest') form.getCheckBox("Beer Fest").check();
      else form.getCheckBox("Beer Fest").uncheck();
      
      if (data.event_type === 'other') form.getCheckBox("Other").check();
      else form.getCheckBox("Other").uncheck();
      
      if (data.supplies?.table_needed) form.getCheckBox("Table").check();
      else form.getCheckBox("Table").uncheck();
      
      if (data.supplies?.beer_buckets) form.getCheckBox("Beer Buckets").check();
      else form.getCheckBox("Beer Buckets").uncheck();
      
      if (data.supplies?.table_cloth) form.getCheckBox("Table Cloth").check();
      else form.getCheckBox("Table Cloth").uncheck();
      
      if (data.supplies?.tent_weights) form.getCheckBox("Tent Weights").check();
      else form.getCheckBox("Tent Weights").uncheck();
      
      if (data.supplies?.signage) form.getCheckBox("Signage").check();
      else form.getCheckBox("Signage").uncheck();
      
      if (data.supplies?.ice) form.getCheckBox("Ice").check();
      else form.getCheckBox("Ice").uncheck();
      
      if (data.supplies?.jockey_box) form.getCheckBox("Jockey Box").check();
      else form.getCheckBox("Jockey Box").uncheck();
      
      if (data.supplies?.cups) form.getCheckBox("Cups").check();
      else form.getCheckBox("Cups").uncheck();
    } catch (e) {
      console.error('Error setting checkboxes:', e);
    }
    
    // Fill beer table
    if (data.beers && data.beers.length > 0) {
      try {
        // Beer 1
        if (data.beers[0]) {
          form.getTextField("Beer Style 1").setText(data.beers[0].beer_style || '');
          form.getTextField("Package Style 1").setText(data.beers[0].packaging || '');
          form.getTextField("Quantity 1").setText(data.beers[0].quantity?.toString() || '');
        }
        
        // Beer 2
        if (data.beers.length > 1 && data.beers[1]) {
          form.getTextField("Beer Style 2").setText(data.beers[1].beer_style || '');
          form.getTextField("Package Style 2").setText(data.beers[1].packaging || '');
          form.getTextField("Quantity 2").setText(data.beers[1].quantity?.toString() || '');
        }
        
        // Beer 3-5 (similar pattern)
        // ...
      } catch (e) {
        console.error('Error setting beer table fields:', e);
        
        // Fallback - try drawing text directly for beer fields
        try {
          // Get the first page
          const pages = pdfDoc.getPages();
          const page = pages[0];
          
          // Define coordinates for beer table fields (approximate)
          const fieldCoordinates = {
            "Beer Style 1": { x: 610, y: 705 },
            "Package Style 1": { x: 770, y: 705 },
            "Beer Style 2": { x: 610, y: 675 },
            "Package Style 2": { x: 770, y: 675 }
            // Add more as needed
          };
          
          // Draw beer 1
          if (data.beers[0]) {
            if (data.beers[0].beer_style) {
              page.drawText(data.beers[0].beer_style, {
                x: fieldCoordinates["Beer Style 1"].x,
                y: fieldCoordinates["Beer Style 1"].y,
                size: 10
              });
            }
            
            if (data.beers[0].packaging) {
              page.drawText(data.beers[0].packaging, {
                x: fieldCoordinates["Package Style 1"].x,
                y: fieldCoordinates["Package Style 1"].y,
                size: 10
              });
            }
          }
          
          // Draw beer 2
          if (data.beers.length > 1 && data.beers[1]) {
            if (data.beers[1].beer_style) {
              page.drawText(data.beers[1].beer_style, {
                x: fieldCoordinates["Beer Style 2"].x,
                y: fieldCoordinates["Beer Style 2"].y,
                size: 10
              });
            }
            
            if (data.beers[1].packaging) {
              page.drawText(data.beers[1].packaging, {
                x: fieldCoordinates["Package Style 2"].x,
                y: fieldCoordinates["Package Style 2"].y,
                size: 10
              });
            }
          }
        } catch (drawError) {
          console.error('Error drawing text directly:', drawError);
        }
      }
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