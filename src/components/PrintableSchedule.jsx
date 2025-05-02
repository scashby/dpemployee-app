import React from 'react';

const PrintableSchedule = ({ userName, weekLabel, days, shifts }) => {
  return (
    <div className="bg-white text-dpblue font-body p-6 print:p-0">
      <h2 className="text-2xl font-heading mb-2">{userName}'s Schedule – {weekLabel}</h2>
      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-dpoffwhite uppercase text-dpgray">
          <tr>
            {days.map((day, i) => (
              <th key={i} className="border p-2 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {shifts.map((shift, i) => (
              <td key={i} className="border p-2 text-center">{shift || "-"}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PrintableSchedule;
