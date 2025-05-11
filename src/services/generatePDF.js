
import { PDFDocument } from 'pdf-lib';

export async function generatePDF(event, employees = [], eventAssignments = {}) {
  const existingPdfBytes = await fetch('/pdfs/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  // Field mapping
  form.getTextField('event_name').setText(event.title || '');
  form.getTextField('event_date').setText(event.date || '');
  form.getTextField('event_location').setText(event.location || '');
  form.getTextField('event_time').setText(event.time || '');
  form.getTextField('event_duration').setText(event.duration || '');
  form.getTextField('event_setup').setText(event.setup || '');
  form.getTextField('event_staff').setText(event.staff_attending || '');
  form.getTextField('event_type').setText(event.event_type || '');
  form.getTextField('event_notes').setText(event.notes || '');

  // Additional beer information if present
  event.beers?.forEach((beer, i) => {
    const index = i + 1;
    form.getTextField(`beer_${index}_name`).setText(beer.beer_name || '');
    form.getTextField(`beer_${index}_style`).setText(beer.beer_style || '');
    form.getTextField(`beer_${index}_packaging`).setText(beer.package_style || '');
    form.getTextField(`beer_${index}_quantity`).setText(beer.quantity || '');
  });
  if (event.beers?.length) {
    event.beers.forEach((beer, index) => {
      const i = index + 1;
      form.getTextField(`beer_${i}_name`)?.setText(beer.name || '');
      form.getTextField(`beer_${i}_style`)?.setText(beer.beer_style || '');
      form.getTextField(`beer_${i}_package`)?.setText(beer.package_style || '');
      form.getTextField(`beer_${i}_quantity`)?.setText(beer.quantity || '');
    });
  }

  // Generate PDF and trigger download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title || 'event'}-form.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
