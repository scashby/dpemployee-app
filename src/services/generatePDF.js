
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// Register Calibri fonts from public folder
Font.register({
  family: 'Calibri',
  fonts: [
    { src: '/fonts/calibri-regular.ttf' },
    { src: '/fonts/calibri-bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Calibri',
    fontSize: 11,
    padding: 40,
    lineHeight: 1.4,
    flexDirection: 'column',
  },
  section: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
});

const EventPDFDocument = ({ event }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>Devil's Purse Event Form</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Event:</Text>
          <Text>{event.title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text>{event.date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text>{event.location}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text>{event.event_type}</Text>
        </View>
        {/* Add more fields as needed */}
      </View>
    </Page>
  </Document>
);

// Main function to generate and download PDF
export async function generatePDF(event, employees, eventAssignments) {
  const blob = await pdf(<EventPDFDocument event={event} />).toBlob();
  saveAs(blob, `DPBC_Event_${event.title.replace(/\s+/g, '_')}.pdf`);
}
