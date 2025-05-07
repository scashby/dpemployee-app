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
    <div className="dp-table-container">
      <table className="dp-schedule-table">
        <thead>
          <tr>
            <th className="dp-employee-column">Employee</th>
            {dayNames.map((day) => (
              <th key={day} className="dp-day-column">
                {formatDayWithDate(day)}
              </th>
            ))}
            <th className="dp-actions-column">REMOVE</th>
          </tr>
        </thead>
        <tbody>
          {scheduledEmployeeNames.map((employeeName) => (
            <tr key={employeeName} className="dp-employee-row">
              <td className="dp-employee-cell">{employeeName}</td>
              
              {dayNames.map((day) => {
                const shifts = scheduleData[employeeName][day] || [];
                
                return (
                  <td 
                    key={day} 
                    className="dp-day-cell"
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
                      <div className="dp-add-shift">
                        + Add Shift
                      </div>
                    )}
                  </td>
                );
              })}
              
              <td className="dp-remove-cell">
                <button 
                  onClick={() => onRemoveEmployee(employeeName)}
                  className="dp-remove-button"
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