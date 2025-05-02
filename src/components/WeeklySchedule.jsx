import React from 'react';

const WeeklySchedule = ({ weekLabel, days, employees, shifts }) => {
  return (
    <div className="bg-dpbg p-6 font-body text-dpblue">
      <h2 className="text-2xl font-heading mb-4 tracking-tight">
        Front of House Schedule – Week {weekLabel}
      </h2>
      <div className="overflow-auto">
        <table className="min-w-full table-fixed border border-gray-300">
          <thead className="bg-dpoffwhite text-sm uppercase font-semibold text-dpgray">
            <tr>
              <th className="p-2 border-b border-gray-300 text-left w-32">Employee</th>
              {days.map((day, idx) => (
                <th key={idx} className="p-2 border-b border-gray-300 text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-200">
                <td className="p-2 font-medium">{employee}</td>
                {shifts[rowIdx].map((shift, colIdx) => (
                  <td key={colIdx} className="p-2 text-center text-sm">
                    {shift || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklySchedule;
