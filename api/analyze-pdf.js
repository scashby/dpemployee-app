// api/analyze-pdf.js
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Load the PDF template
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Get all fields
    const fields = form.getFields();
    
    // Analyze fields
    const fieldAnalysis = {};
    
    fields.forEach(field => {
      try {
        const name = field.getName();
        const type = field.constructor.name;
        
        // Get the underlying acroField
        const acroField = field.acroField;
        const dict = acroField?.dict;
        
        const properties = {
          type: type,
          dictKeys: dict ? Array.from(dict.keys()).map(k => k.toString()) : []
        };
        
        // Extract important dictionary entries
        if (dict) {
          // Check for field flags
          if (dict.has('Ff')) {
            properties.fieldFlags = dict.get(dict.context.obj('Ff')).toString();
          }
          
          // Default appearance string
          if (dict.has('DA')) {
            properties.defaultAppearance = dict.get(dict.context.obj('DA')).toString();
          }
          
          // Check for default value
          if (dict.has('DV')) {
            properties.defaultValue = dict.get(dict.context.obj('DV')).toString();
          }
          
          // Check for appearance stream
          if (dict.has('AP')) {
            properties.hasAppearanceStream = true;
          }
        }
        
        fieldAnalysis[name] = properties;
      } catch (e) {
        console.error(`Error analyzing field: ${e.message}`);
      }
    });
    
    // Group fields by type
    const fieldTypes = {};
    for (const [name, props] of Object.entries(fieldAnalysis)) {
      const type = props.type;
      if (!fieldTypes[type]) {
        fieldTypes[type] = [];
      }
      fieldTypes[type].push(name);
    }
    
    // Send analysis
    res.status(200).json({
      totalFields: fields.length,
      fieldsByType: fieldTypes,
      fieldDetails: fieldAnalysis
    });
    
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    res.status(500).json({ error: error.message || 'Error analyzing PDF' });
  }
}