import { useState } from 'react';
import { formatDateForDB } from '../utils/dateUtils';

/**
 * Hook for managing modal states in admin components
 * Handles showing/hiding modals and their associated data
 * 
 * @returns {Object} Modal states and functions
 */
export const useModalState = () => {
  // Modal visibility states
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  
  // Modal data states
  const [modalData, setModalData] = useState({
    employeeName: '',
    day: '',
    date: '',
    shift: '11-Close',
    event_id: null,
    event_name: null,
    id: null
  });
  
  const [templateData, setTemplateData] = useState({
    name: '',
    overwriteExisting: false,
    existingTemplateId: ''
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Shift modal handlers
  const openAddShiftModal = (employeeName, day, date) => {
    const formattedDate = date ? formatDateForDB(date) : '';
    
    setModalData({
      employeeName,
      day,
      date: formattedDate,
      shift: '11-Close',
      event_id: null,
      event_name: null,
      id: null
    });
    
    setShowShiftModal(true);
  };
  
  const openEditShiftModal = (shift) => {
    setModalData({
      employeeName: shift.employee_name,
      day: shift.day,
      date: shift.date,
      shift: shift.shift,
      event_name: shift.event_name,
      event_id: shift.event_id,
      id: shift.id
    });
    
    setShowShiftModal(true);
  };
  
  const closeShiftModal = () => {
    setShowShiftModal(false);
  };
  
  // Employee modal handlers
  const openAddEmployeeModal = () => {
    setShowAddEmployeeModal(true);
  };
  
  const closeAddEmployeeModal = () => {
    setShowAddEmployeeModal(false);
  };
  
  // Template modal handlers
  const openTemplateModal = () => {
    setSelectedTemplate(null);
    setShowTemplateModal(true);
  };
  
  const closeTemplateModal = () => {
    setShowTemplateModal(false);
  };
  
  // Save as template modal handlers
  const openSaveAsTemplateModal = () => {
    setTemplateData({
      name: '',
      overwriteExisting: false,
      existingTemplateId: ''
    });
    setShowSaveAsTemplateModal(true);
  };
  
  const closeSaveAsTemplateModal = () => {
    setShowSaveAsTemplateModal(false);
  };
  
  // Input change handlers
  const handleShiftInputChange = (e) => {
    const { name, value } = e.target;
    setModalData({
      ...modalData,
      [name]: value
    });
  };
  
  const handleTemplateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setTemplateData({
      ...templateData,
      [name]: newValue
    });
  };
  
  return {
    // Modal visibility
    showShiftModal,
    showAddEmployeeModal,
    showTemplateModal,
    showSaveAsTemplateModal,
    
    // Modal data
    modalData,
    templateData,
    selectedTemplate,
    
    // Shift modal functions
    openAddShiftModal,
    openEditShiftModal,
    closeShiftModal,
    
    // Employee modal functions
    openAddEmployeeModal,
    closeAddEmployeeModal,
    
    // Template modal functions
    openTemplateModal,
    closeTemplateModal,
    setSelectedTemplate,
    
    // Save as template modal functions
    openSaveAsTemplateModal,
    closeSaveAsTemplateModal,
    
    // Input handlers
    handleShiftInputChange,
    handleTemplateInputChange
  };
};

export default useModalState;