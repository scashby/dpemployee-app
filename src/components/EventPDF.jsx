// EventPDF.jsx
import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

import { pdf } from '@react-pdf/renderer';

// Register Calibri fonts — use local path in src folder
Font.register({
  family: 'Calibri',
  fonts: [
    {
      src: require('./fonts/calibri-regular.ttf'),
      fontWeight: 'normal',
    },
    {
      src: require('./fonts/calibri-bold.ttf'),
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Calibri',
    fontSize: 11,
    padding: 40,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
  },
  text: {},
});

export const generatePDF = async (event) => {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.label}>Event Name: </Text>
          <Text>{event.title || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Event Date: </Text>
          <Text>{event.date || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Event Set Up Time: </Text>
          <Text>{event.setup_time || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Event Duration: </Text>
          <Text>{event.duration || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>DP Staff Attending: </Text>
          <Text>{event.staff_attending || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Event Contact(Name, Phone): </Text>
          <Text>{event.contact_name || ''} {event.contact_phone || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Expected # of Attendees: </Text>
          <Text>{event.expected_attendees || ''}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Event Instructions: </Text>
          <Text>{event.event_instructions || ''}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DPBC_Event_Form_${event.title || 'Event'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
