// /api/generate-pdf.js
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventData = req.body;
    
    // Get template path
    const templatePath = path.join(process.cwd(), 'public', 'DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf');
    
    // Use PDFtk (Node-PDFtk) or another server-side library to fill the form
    // Example with PDFtk:
    const { createPDF } = require('node-pdftk');
    
    // Create FDF data - this format matches what PDFtk expects
    const fdfData = {
      "Event Name": eventData.title || '',
      "Event Date": formatDate(eventData.date),
      // ...other fields...
    };
    
    const filledPdf = await createPDF(templatePath, fdfData);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${eventData.title || 'Event'}_Form.pdf"`);
    
    // Send the PDF
    return res.send(filledPdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Error generating PDF' });
  }
}