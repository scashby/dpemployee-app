
import { PDFDocument } from 'pdf-lib';

export async function generatePDF(event) {
  const existingPdfBytes = await fetch('/DPBC EVENT FORM WIP - EVENT NAME - TEMPLATE.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  try {
    // Text fields
    form.getTextField('Event Name').setText(event.title || '');
    form.getTextField('Event Date').setText(event.date || '');
    form.getTextField('Event Set Up Time').setText(event.setup_time || '');
    form.getTextField('Event Duration').setText(event.duration || '');
    form.getTextField('DP Staff Attending').setText(event.staff_attending || '');
    form.getTextField('Event Contact').setText(event.contact || '');
    form.getTextField('Expected Attendees').setText(event.expected_attendees || '');
    form.getTextField('RETURN EQUIPMENT BY').setText(event.return_equipm || '');
    form.getTextField('Other More Detail').setText(event.other_details || '');
    form.getTextField('Quantity 1').setText(event.quantity1 || '');
    form.getTextField('Quantity 2').setText(event.quantity2 || '');
    form.getTextField('Quantity 3').setText(event.quantity3 || '');
    form.getTextField('Quantity 4').setText(event.quantity4 || '');
    form.getTextField('Quantity 5').setText(event.quantity5 || '');
    form.getTextField('Additional Supplies').setText(event.additional_supplies || '');
    form.getTextField('Event Instructions').setText(event.instructions || '');
    form.getTextField('Estimated Attendees').setText(event.estimated_att || '');
    form.getTextField('Favorite Beer Style').setText(event.favorite_beer || '');
    form.getTextField('Enough Product').setText(event.enough_prod || '');
    form.getTextField('Adequate Staffing').setText(event.adequately_st || '');
    form.getTextField('Continued Participation').setText(event.continue_part || '');
    form.getTextField('Critiques').setText(event.critiques || '');

    // Dropdowns
    form.getDropdown('Beer Style 1').select(event.beer_style_1 || '');
    form.getDropdown('Beer Style 2').select(event.beer_style_2 || '');
    form.getDropdown('Beer Style 3').select(event.beer_style_3 || '');
    form.getDropdown('Beer Style 4').select(event.beer_style_4 || '');
    form.getDropdown('Beer Style 5').select(event.beer_style_5 || '');
    form.getDropdown('Package Style 1').select(event.package_style_1 || '');
    form.getDropdown('Package Style 2').select(event.package_style_2 || '');
    form.getDropdown('Package Style 3').select(event.package_style_3 || '');
    form.getDropdown('Package Style 4').select(event.package_style_4 || '');
    form.getDropdown('Package Style 5').select(event.package_style_5 || '');

    // Checkboxes
    if (event.pint_night) form.getCheckBox('Pint Night').check();
    if (event.beer_fest) form.getCheckBox('Beer Fest').check();
    if (event.tasting) form.getCheckBox('Tasting').check();
    if (event.other) form.getCheckBox('Other').check();
    if (event.jockey_box) form.getCheckBox('Jockey Box').check();
    if (event.cups) form.getCheckBox('Cups').check();
    if (event.table) form.getCheckBox('Table').check();
    if (event.table_cloth) form.getCheckBox('Table Cloth').check();
    if (event.signage) form.getCheckBox('Signage').check();
    if (event.beer_buckets) form.getCheckBox('Beer Buckets').check();
    if (event.tent_weights) form.getCheckBox('Tent Weights').check();
    if (event.ice) form.getCheckBox('Ice').check();

  } catch (err) {
    console.error("PDF generation error:", err);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'DPBC_Filled_Event_Form.pdf';
  link.click();
}
