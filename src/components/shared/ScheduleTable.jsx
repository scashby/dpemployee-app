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
    <div 
      className={`dp-shift ${shiftClass} ${className}`}
      onClick={shift.event_id ? handleEventClick : undefined}
      data-event-type={shift.event_type}
    >
      <div className="dp-shift-content">
        <span>
          <div className="dp-shift-title">{title}</div>
          <div className="dp-shift-time">{subtitle}</div>
          {shift.event_info && !shift.event_id && (
            <span className="dp-shift-info">
              {shift.event_info?.length > 50 
                ? `${shift.event_info.substring(0, 50)}...` 
                : shift.event_info}
            </span>
          )}
        </span>
        
        {showActions && !shift.event_id && (
          <div className="dp-shift-actions">
            <button 
              onClick={handleEdit}
              className="dp-shift-action dp-shift-edit"
              aria-label={isEvent ? "View event details" : "Edit shift"}
              title={isEvent ? "View event details" : "Edit shift"}
            >
              ✎
            </button>
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="dp-shift-action dp-shift-delete"
                aria-label={isEvent ? "Remove from event" : "Delete shift"}
                title={isEvent ? "Remove from event" : "Delete shift"}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTable;