
import jsPDF from 'jspdf';

export function generatePDF(event) {
  const doc = new jsPDF();

  // Embed Calibri from public/fonts
  const calibriPath = window.location.origin + '/fonts/calibri.ttf';
  const calibriFontName = 'calibri';

  // Load Calibri font
  fetch(calibriPath)
    .then(res => res.arrayBuffer())
    .then(fontBuffer => {
      doc.addFileToVFS("calibri.ttf", btoa(
        new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      ));
      doc.addFont("calibri.ttf", calibriFontName, "normal");
      doc.setFont(calibriFontName);
      doc.setFontSize(12);

      // Header
      doc.setFontSize(16);
      doc.text("Devil's Purse Event Form", 20, 20);

      // Event Information
      doc.setFontSize(12);
      doc.text(`Event: ${event.title || ''}`, 20, 35);
      doc.text(`Date: ${event.date || ''}`, 20, 45);
      doc.text(`Location: ${event.location || ''}`, 20, 55);
      doc.text(`Type: ${event.event_type || ''}`, 20, 65);
      doc.text(`Duration: ${event.duration || ''}`, 20, 75);
      doc.text(`Staff Attending: ${event.staff_attending || ''}`, 20, 85);

      // Save PDF
      const safeTitle = (event.title || 'event_form').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`DPBC_${safeTitle}.pdf`);
    })
    .catch(err => {
      console.error("Error loading Calibri font or generating PDF:", err);
    });
}
