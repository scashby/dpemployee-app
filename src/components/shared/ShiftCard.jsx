import React from 'react';
import { getShiftClass, formatShiftDisplay, isEventShift } from '../../utils/shiftUtils';

/**
 * A reusable component for displaying a shift in the schedule
 * 
 * @param {object} shift - The shift data
 * @param {function} onEdit - Function to handle shift edit
 * @param {function} onDelete - Function to handle shift delete
 * @param {boolean} showActions - Whether to show edit/delete actions
 * @param {string} className - Additional CSS classes
 */
const ShiftCard = ({
  shift,
  onEdit = null,
  onDelete = null,
  showActions = true,
  className = ''
}) => {
  const shiftClass = getShiftClass(shift.event_type);
  const { title, subtitle } = formatShiftDisplay(shift);
  const isEvent = isEventShift(shift);
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(shift);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(shift.id);
  };
  const handleEventClick = () => {
    if (shift.event_id) {
      window.location.href = `/admin/events/edit/${shift.event_id}`;
    }
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
          {shift.event_info && (
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

export default ShiftCard;