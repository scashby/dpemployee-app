// api/generate-pdf.js
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const data = req.body;
    
    // Helper functions...
    
    // Load the template PDF
    console.log('Loading PDF template...');
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // Step 1: Fill the form without flattening
    console.log('Step 1: Filling form fields without flattening...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Get all fields to normalize their appearance before filling
    const fields = form.getFields();
    
    // First pass: Standardize the default appearance for ALL text fields
    console.log('Normalizing font sizes to 10pt...');
    for (const field of fields) {
      try {
        // Only process text fields
        if (field.constructor.name !== 'PDFTextField') continue;
        
        // Get the acroField
        const acroField = field.acroField;
        if (!acroField || !acroField.dict) continue;
        
        // Directly set the default appearance string to use 10pt Helvetica
        // The format is "/FontName size Tf R G B rg"
        const da = '/Helv 10 Tf 0 g';
        
        // Check if the field has a DA entry and replace it
        if (acroField.dict.has('DA')) {
          // Get the existing DA value as a string
          const existingDA = acroField.dict.get(pdfDoc.context.obj('DA'));
          
          // Replace it with our standard font size
          // This is a safer approach than trying to create new PDFString objects
          if (existingDA) {
            // Replace any font size in the existing appearance string with 10
            const newDA = existingDA.toString().replace(/\/[A-Za-z]+ \d+ Tf/, '/Helv 10 Tf');
            acroField.dict.set(pdfDoc.context.obj('DA'), pdfDoc.context.obj(newDA));
          }
        }
      } catch (e) {
        console.log(`Error standardizing field appearance:`, e.message);
      }
    }
    
    // Now fill in the fields with our normal field setter
    // This won't modify the appearance strings we just set
    const setTextField = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      try {
        const field = form.getTextField(name);
        field.setText(String(value));
      } catch (e) {
        console.log(`Error setting field ${name}:`, e.message);
      }
    };
    
    // Set checkboxes (unchanged)
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
    
    // Fill in all form fields...
    // [SAME FIELD FILLING CODE AS BEFORE]
    
    // Save the filled (but unflattened) PDF
    console.log('Saving intermediate filled PDF...');
    const filledBytes = await pdfDoc.save();
    
    // Step 2: Load and flatten
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