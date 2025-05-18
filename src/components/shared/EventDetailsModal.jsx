import React from "react";
import { generatePDF } from "../../services/generatePDF";
import { useNavigate } from "react-router-dom";

const EventDetailsModal = ({ event, employees = [], eventAssignments = {}, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative flex flex-col items-center">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <button
          onClick={() => generatePDF(event, employees, eventAssignments)}
          className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 mt-16 text-lg font-semibold"
        >
          Download PDF
        </button>
        <button
          onClick={() => navigate("/admin-events")}
          className="mt-8 text-blue-700 underline text-lg hover:text-blue-900 bg-transparent border-none"
        >
          Go to Admin Events
        </button>
      </div>
    </div>
  );
};

export default EventDetailsModal;