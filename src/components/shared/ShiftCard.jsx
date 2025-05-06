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
  
  return (
    <div 
      className={`p-2 rounded mb-1 relative ${shiftClass} ${className}`}
    >
      <div className="flex justify-between">
        <span>
          {title}
          <br />
          {subtitle}
          {shift.event_info && (
            <span className="block text-xs mt-1 text-white opacity-90">
              {shift.event_info?.length > 50 
                ? `${shift.event_info.substring(0, 50)}...` 
                : shift.event_info}
            </span>
          )}
        </span>
        
        {showActions && (
          <div className="flex space-x-1">
            <button 
              onClick={handleEdit}
              className="text-white hover:text-gray-200"
              aria-label={isEvent ? "View event details" : "Edit shift"}
              title={isEvent ? "View event details" : "Edit shift"}
            >
              ✎
            </button>
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="text-white hover:text-gray-200"
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