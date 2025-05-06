import React from 'react';
import { formatDateForDisplay } from '../../utils/dateUtils';
import ShiftCard from '../shared/ShiftCard';

/**
 * A reusable component for displaying and editing the weekly schedule
 */
const ScheduleTable = ({
  scheduleData,
  employees,
  dayNames,
  getDateForDay,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onRemoveEmployee
}) => {
  // Get the scheduled employees (those who have shifts in the current schedule)
  const scheduledEmployeeNames = Object.keys(scheduleData);

  // Format day with date
  const formatDayWithDate = (day) => {
    const date = getDateForDay(day);
    if (!date) return day;
    return `${day} (${formatDateForDisplay(date)})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-4 border-b">Employee</th>
            {dayNames.map((day) => (
              <th key={day} className="py-2 px-4 border-b text-center">
                {formatDayWithDate(day)}
              </th>
            ))}
            <th className="py-2 px-4 border-b text-center">REMOVE</th>
          </tr>
        </thead>
        <tbody>
          {scheduledEmployeeNames.map((employeeName) => (
            <tr key={employeeName} className="border-b">
              <td className="py-3 px-4">{employeeName}</td>
              
              {dayNames.map((day) => {
                const shifts = scheduleData[employeeName][day] || [];
                
                return (
                  <td 
                    key={day} 
                    className="py-2 px-2 align-top min-w-[100px] cursor-pointer"
                    onClick={() => shifts.length === 0 && onAddShift(employeeName, day)}
                  >
                    {shifts.map((shift, index) => (
                      <ShiftCard 
                        key={index}
                        shift={shift}
                        onEdit={() => onEditShift(shift)}
                        onDelete={onDeleteShift}
                      />
                    ))}
                    
                    {shifts.length === 0 && (
                      <div className="h-10 w-full flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 rounded">
                        + Add Shift
                      </div>
                    )}
                  </td>
                );
              })}
              
              <td className="py-3 px-4 text-center">
                <button 
                  onClick={() => onRemoveEmployee(employeeName)}
                  className="text-black hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;