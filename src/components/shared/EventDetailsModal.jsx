import React from "react";
import { generatePDF } from "../../services/generatePDF";

const EventDetailsModal = ({ event, employees = [], eventAssignments = {}, onClose }) => {
  const assignedEmployees = (eventAssignments[event.id] || []).map(empId => {
    return employees.find(e => e.id === empId)?.name || 'Unknown Employee';
  }).join(', ');

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={() => generatePDF(
          { ...event, assignedEmployees },
          employees,
          eventAssignments
        )}
        className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 text-lg font-semibold"
      >
        Download PDF
      </button>
    </div>
  );
};

export default EventDetailsModal;