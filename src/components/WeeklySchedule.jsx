import React from 'react';

const WeeklySchedule = ({ weekLabel, days, employees, shifts, editable = false, onShiftChange }) => {
  const getCellClass = (eventType) => {
    if (eventType === 'in-house') return 'bg-green-100 text-green-800';
    if (eventType === 'off-prem') return 'bg-blue-100 text-blue-800';
    return '';
  };

  return (
    <div className="bg-dpbg p-6 font-body text-dpblue">
      <h2 className="text-2xl font-heading mb-4 tracking-tight">
        Weekly Schedule – Week {weekLabel}
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
                {shifts[rowIdx].map((shift, colIdx) => {
                  const shiftValue = shift ?? '';
                  const display = typeof shiftValue === 'object' ? shiftValue.shift : shiftValue;
                  const eventType = typeof shiftValue === 'object' ? shiftValue.event_type : null;
                  const cellClass = getCellClass(eventType);

                  return (
                    <td key={colIdx} className={`p-2 text-center text-sm ${cellClass}`}>
                      {editable ? (
                        <input
                          type="text"
                          defaultValue={display || ''}
                          onChange={(e) => onShiftChange?.(rowIdx, colIdx, e.target.value)}
                          className="w-full text-center border rounded-sm px-1"
                        />
                      ) : (
                        display || '-'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklySchedule;
