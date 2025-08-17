import React from 'react';
import { Edit, Trash2, Download, Calendar, User, Clock, FileText, Paperclip } from 'lucide-react';
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

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, isOpen, onClose, onEdit, onDelete }) => {
  const { user } = useAuth();

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

  const handleFileDownload = (attachment: any) => {
    // Simulate file download
    console.log('Downloading file:', attachment.fileName);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
                {statusInfo?.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityInfo?.color} bg-opacity-10`}>
                {priorityInfo?.label} Priority
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dueDateStatus.color}`}>
                {dueDateStatus.text}
              </span>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Due Date */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Due Date</h4>
            </div>
            <p className="text-lg font-semibold text-gray-700">{formatDate(task.dueDate)}</p>
          </div>

          {/* Assigned User */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Assigned To</h4>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{task.assignedUser?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{task.assignedUser?.role}</p>
              </div>
            </div>
          </div>

          {/* Created */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Created</h4>
            </div>
            <p className="text-sm text-gray-700">{formatDateTime(task.createdAt)}</p>
          </div>

          {/* Last Updated */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Last Updated</h4>
            </div>
            <p className="text-sm text-gray-700">{formatDateTime(task.updatedAt)}</p>
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
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB • 
                        Uploaded {formatDateTime(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFileDownload(attachment)}
                    className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    title={`Download ${attachment.fileName}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline (placeholder for future enhancement) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Activity</h4>
          <div className="text-sm text-gray-500">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              Task created on {formatDateTime(task.createdAt)}
            </div>
            {task.createdAt !== task.updatedAt && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Task updated on {formatDateTime(task.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetails;