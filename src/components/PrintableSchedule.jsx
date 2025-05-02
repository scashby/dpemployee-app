import React from 'react';

const PrintableSchedule = ({ weekLabel, days, employees, shifts }) => {
  const getCellClass = (eventType) => {
    if (eventType === 'in-house') return 'bg-green-100 text-green-800';
    if (eventType === 'off-prem') return 'bg-blue-100 text-blue-800';
    return '';
  };

  return (
    <div className="p-4 text-black font-body print:bg-white print:text-black print:p-0">
      <h2 className="text-xl font-bold mb-4">Printable Weekly Schedule – Week {weekLabel}</h2>
      <table className="min-w-full table-fixed border border-black text-sm">
        <thead className="bg-gray-200 font-semibold">
          <tr>
            <th className="border border-black px-2 py-1 text-left w-32">Employee</th>
            {days.map((day, idx) => (
              <th key={idx} className="border border-black px-2 py-1 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee, rowIdx) => (
            <tr key={rowIdx}>
              <td className="border border-black px-2 py-1 font-medium">{employee}</td>
              {shifts[rowIdx].map((shift, colIdx) => {
                const shiftValue = shift ?? '';
                const display = typeof shiftValue === 'object' ? shiftValue.shift : shiftValue;
                const eventType = typeof shiftValue === 'object' ? shiftValue.event_type : null;
                const cellClass = getCellClass(eventType);

                return (
                  <td
                    key={colIdx}
                    className={`border border-black px-2 py-1 text-center ${cellClass}`}
                  >
                    {display || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableSchedule;
