import React, { useState, useRef, useEffect } from 'react';
// Subcomponent for admin assigned users popup
type AssignedUsersPopupProps = {
  assignedTo: any[];
};

const AssignedUsersPopup = ({ assignedTo }: AssignedUsersPopupProps) => {
  const shown = assignedTo.slice(0, 2);
  const hidden = assignedTo.slice(2);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPopup) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopup]);

  return (
    <div className="flex items-center flex-wrap gap-2">
      {shown.map((u: any) => (
        <div key={u._id || u.id || u} className="flex items-center bg-blue-50 rounded px-2 py-1 mr-1">
          <User className="w-4 h-4 text-blue-600 mr-1" />
          <span className="text-xs font-medium text-gray-900">{u.email || u}</span>
          {u.role && <span className="ml-1 text-xs text-gray-500 capitalize">({u.role})</span>}
        </div>
      ))}
      {hidden.length > 0 && (
        <button
          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium hover:bg-gray-300 focus:outline-none"
          onClick={() => setShowPopup(true)}
        >
          +{hidden.length} more
        </button>
      )}
      {showPopup && (
        <div ref={popupRef} className="absolute z-20 top-10 left-0 bg-white border border-gray-300 rounded shadow-lg p-4 min-w-[220px]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-800 text-sm">All Assigned Users</span>
            <button className="text-gray-400 hover:text-red-500" onClick={() => setShowPopup(false)}>&times;</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {assignedTo.map((u: any) => (
              <div key={u._id || u.id || u} className="flex items-center">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-xs font-medium text-gray-900">{u.email || u}</span>
                {u.role && <span className="ml-1 text-xs text-gray-500 capitalize">({u.role})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import { Edit, Trash2, Download, Eye, Calendar, User, Clock, FileText, Paperclip } from 'lucide-react';
import { Task } from '../../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../UI/Modal';

interface TaskDetailsProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, isOpen, onClose, onEdit, onDelete }) => {
  const auth = useAuth();
  const user = auth?.user;
  const canEdit = user?.role === 'admin' || task.assignedTo === user?.id;
  const statusInfo = TASK_STATUSES.find(s => s.value === task.status);
  const priorityInfo = TASK_PRIORITIES.find(p => p.value === task.priority);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getDueDateStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600 bg-red-50' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600 bg-orange-50' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`, color: 'text-yellow-600 bg-yellow-50' };
    } else {
      return { text: `Due in ${diffDays} days`, color: 'text-green-600 bg-green-50' };
    }
  };

  const dueDateStatus = getDueDateStatus(task.dueDate);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');

  const handleFileDownload = (attachment: any) => {
    const url = `${API_URL}/tasks/attachments/${attachment.fileName}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;
  const handleFilePreview = (attachment: any) => {
    const url = `${API_URL}/tasks/attachments/${attachment.fileName}`;
    if (isMobile()) {
      window.open(url, '_blank');
    } else {
      setPreviewUrl(url);
      setPreviewFileName(attachment.fileName);
    }
  };

  return (

    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium ${statusInfo?.color}`}>
                {statusInfo?.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium ${priorityInfo?.color} bg-opacity-10`}>
                {priorityInfo?.label} Priority
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium ${dueDateStatus.color}`}>
                {dueDateStatus.text}
              </span>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center space-x-2 mt-2 sm:mt-0 ml-0 sm:ml-4">
              <button
                onClick={onEdit}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Description</h3>
          <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap">{task.description}</p>
        </div>

  {/* Details Grid */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-1 sm:mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-xs sm:text-sm font-medium text-gray-900">Due Date</h4>
            </div>
            <p className="text-base sm:text-lg font-semibold text-gray-700">{formatDate(task.dueDate)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 relative">
            <div className="flex items-center mb-1 sm:mb-2">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-xs sm:text-sm font-medium text-gray-900">Assigned To</h4>
            </div>
            {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
              user?.role === 'admin' ? (
                <AssignedUsersPopup assignedTo={task.assignedTo} />
              ) : (
                (() => {
                  let self = null;
                  if (Array.isArray(task.assignedTo)) {
                    self = task.assignedTo.find((u: any) => {
                      if (typeof u === 'object') {
                        return u._id === user?.id || u.id === user?.id;
                      }
                      return u === user?.id;
                    });
                  }
                  if (self) {
                    return (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          {typeof self === 'object' ? (
                            <>
                              <p className="text-xs sm:text-sm font-medium text-gray-900">{(self as any).email || user?.email}</p>
                              {(self as any).role && <p className="text-xs text-gray-500 capitalize">{(self as any).role}</p>}
                            </>
                          ) : (
                            <p className="text-xs sm:text-sm font-medium text-gray-900">{user?.email}</p>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    return <p className="text-xs sm:text-sm text-gray-500">Not assigned</p>;
                  }
                })()
              )
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">No users assigned</p>
            )}

            {/* Assigned By (Admin) */}
            {task.createdBy && typeof task.createdBy === 'object' && task.createdBy.role === 'admin' && (
              <div className="flex items-center mt-2">
                <User className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-xs sm:text-sm text-green-700">Assigned by: {task.createdBy.email}</span>
              </div>
            )}
          </div>

          {/* Created */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-1 sm:mb-2">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-xs sm:text-sm font-medium text-gray-900">Created</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(task.createdAt)}</p>
          </div>

          {/* Last Updated */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-1 sm:mb-2">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-xs sm:text-sm font-medium text-gray-900">Last Updated</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-700">{formatDateTime(task.updatedAt)}</p>
          </div>
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Paperclip className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Attachments</h4>
              <span className="ml-2 text-sm text-gray-500">({task.attachments.length})</span>
            </div>
            <div className="space-y-3">
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id || attachment.fileName}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB 
                        Uploaded {formatDateTime(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFilePreview(attachment)}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                      title={`Preview ${attachment.fileName}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFileDownload(attachment)}
                      className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      title={`Download ${attachment.fileName}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Modal
              isOpen={!!previewUrl}
              onClose={() => setPreviewUrl(null)}
              title={`Preview: ${previewFileName}`}
              size="md"
            >
              {previewUrl && (
                <div className="w-full max-w-full flex items-center justify-center">
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    className="w-full border rounded shadow"
                    style={{ minHeight: '60vh', height: '60vh', maxHeight: '80vh' }}
                  />
                </div>
              )}
            </Modal>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskDetails;