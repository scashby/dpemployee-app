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
    console.log(`Found ${fields.length} fields in the form`);
    
    // Analyze fields
    const fieldAnalysis = {};
    
    for (const field of fields) {
      const name = field.getName();
      const type = field.constructor.name;
      
      // Get the underlying acroField for deep analysis
      const acroField = field.acroField;
      const dict = acroField?.dict;
      
      // Collect properties
      const properties = {
        type: type,
        value: field.isCheckBox() ? field.isChecked() : 
               field.isTextField() ? field.getText() : 
               'unknown',
        dictEntries: {},
        fullDetails: {}
      };
      
      // Extract all dictionary entries
      if (dict) {
        for (const [key, value] of Object.entries(dict.entries())) {
          try {
            const keyStr = key.toString();
            const valueStr = typeof value.toString === 'function' ? 
                            value.toString() : 
                            JSON.stringify(value);
            properties.dictEntries[keyStr] = valueStr;
          } catch (e) {
            properties.dictEntries[key.toString()] = 'Error extracting value';
          }
        }
        
        // Special property checks
        if (dict.has('DA')) {
          properties.defaultAppearance = dict.get(pdfDoc.context.obj('DA')).toString();
        }
        
        if (dict.has('DV')) {
          properties.defaultValue = dict.get(pdfDoc.context.obj('DV')).toString();
        }
        
        if (dict.has('AP')) {
          properties.hasAppearanceStream = true;
          properties.appearanceStreamDetails = {};
          
          const ap = dict.get(pdfDoc.context.obj('AP'));
          if (ap && ap.dict) {
            for (const [apKey, apValue] of Object.entries(ap.dict.entries())) {
              properties.appearanceStreamDetails[apKey.toString()] = 
                typeof apValue.toString === 'function' ? 
                apValue.toString() : 
                'Complex appearance stream';
            }
          }
        }
        
        // Check for field flags
        if (dict.has('Ff')) {
          const flags = dict.get(pdfDoc.context.obj('Ff'));
          properties.fieldFlags = flags.toString();
          
          // Decode common field flags
          const flagsNum = parseInt(flags.toString());
          if (!isNaN(flagsNum)) {
            const decodedFlags = {
              readOnly: (flagsNum & 1) !== 0,
              required: (flagsNum & 2) !== 0,
              noExport: (flagsNum & 4) !== 0,
              multiline: (flagsNum & 4096) !== 0,
              password: (flagsNum & 8192) !== 0,
              fileSelect: (flagsNum & 1048576) !== 0,
              doNotSpellCheck: (flagsNum & 4194304) !== 0,
              doNotScroll: (flagsNum & 8388608) !== 0,
              comb: (flagsNum & 16777216) !== 0,
              richText: (flagsNum & 33554432) !== 0,
            };
            properties.decodedFlags = decodedFlags;
          }
        }
      }
      
      // Store full analysis for this field
      fieldAnalysis[name] = properties;
    }
    
    // Create comparison between problematic and working fields
    const comparisons = {
      beerStyleFields: {},
      workingFields: {},
      differences: {}
    };
    
    // Find beer style and package style fields
    for (const [name, props] of Object.entries(fieldAnalysis)) {
      if (name.includes('Beer Style') || name.includes('Package Style')) {
        comparisons.beerStyleFields[name] = props;
      } else if (props.type === 'PDFTextField' && 
                !name.includes('Quantity') &&
                Object.keys(props.dictEntries).length > 0) {
        // Use other text fields as comparison
        comparisons.workingFields[name] = props;
      }
    }
    
    // Find differences between beer fields and working fields
    const sampleWorkingField = Object.values(comparisons.workingFields)[0] || {};
    const sampleBeerField = Object.values(comparisons.beerStyleFields)[0] || {};
    
    if (sampleWorkingField && sampleBeerField) {
      const differences = {
        missingInBeerFields: [],
        missingInWorkingFields: [],
        differentValues: {}
      };
      
      // Check for properties in working fields missing in beer fields
      for (const [key, value] of Object.entries(sampleWorkingField.dictEntries)) {
        if (!sampleBeerField.dictEntries[key]) {
          differences.missingInBeerFields.push(key);
        } else if (sampleBeerField.dictEntries[key] !== value) {
          differences.differentValues[key] = {
            working: value,
            beer: sampleBeerField.dictEntries[key]
          };
        }
      }
      
      // Check for properties in beer fields missing in working fields
      for (const [key, value] of Object.entries(sampleBeerField.dictEntries)) {
        if (!sampleWorkingField.dictEntries[key]) {
          differences.missingInWorkingFields.push(key);
        }
      }
      
      comparisons.differences = differences;
    }
    
    // Send the analysis as a response
    res.status(200).json({
      summary: {
        totalFields: fields.length,
        textFields: fields.filter(f => f.constructor.name === 'PDFTextField').length,
        checkboxFields: fields.filter(f => f.constructor.name === 'PDFCheckBox').length,
        beerStyleFields: Object.keys(comparisons.beerStyleFields).length,
        workingTextFields: Object.keys(comparisons.workingFields).length
      },
      beerStyleFieldDetails: comparisons.beerStyleFields,
      workingFieldExample: Object.values(comparisons.workingFields)[0],
      keyDifferences: comparisons.differences,
      allFields: fieldAnalysis
    });
    
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    res.status(500).json({ error: error.message || 'Error analyzing PDF' });
  }
}