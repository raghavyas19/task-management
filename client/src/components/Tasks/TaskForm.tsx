import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Calendar, Download, Eye } from 'lucide-react';
import { Task } from '../../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';

interface TaskFormProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TaskForm: React.FC<TaskFormProps> = ({ task, isOpen, onClose }) => {
  const auth = useAuth();
  if (!auth) throw new Error('useAuth must be used within an AuthProvider');
  const { user } = auth;
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: [] as string[]
  });

  const [allUsers, setAllUsers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form with task data if editing
  useEffect(() => {
    // Fetch all users for assignment
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
  if (res.ok) setAllUsers(data.map((u: any) => ({ id: u._id, email: u.email, role: u.role })));
      } catch {}
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate.split('T')[0],
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map((u: any) => (typeof u === 'string' ? u : u._id || u.id)) : []
      });
      setExistingAttachments(task.attachments || []);
      setPendingDelete([]);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        assignedTo: user?.id ? [user.id] : []
      });
      setFiles([]);
      setExistingAttachments([]);
      setPendingDelete([]);
      setErrors({});
    }
  }, [task, user, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) <= new Date()) {
      newErrors.dueDate = 'Due date must be in the future';
    }

    if (!formData.assignedTo || formData.assignedTo.length === 0) {
      newErrors.assignedTo = 'Please assign the task to at least one user';
    }

    if (files.length + existingAttachments.length > 3) {
      newErrors.files = 'Maximum 3 files allowed (including already uploaded)';
    }

    // Validate file types (only PDFs)
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        newErrors.files = 'Only PDF files are allowed';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      addToast({
        type: 'error',
        title: 'Not Authenticated',
        message: 'You are not logged in. Please log in again to create or update a task.'
      });
      return;
    }

    setIsLoading(true);

    try {
      let res, data;
      let updatedTaskId = null;
      if (task) {
        // Update task (support both id and _id)
        const taskId = task.id || (task as any)._id;
        res = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ...formData, assignedTo: formData.assignedTo })
        });
        updatedTaskId = taskId;
      } else {
        // Create task
        res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ...formData, assignedTo: formData.assignedTo })
        });
      }
      data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save task.');

      // Handle file upload if files exist and task created/updated
      if (!task && files.length > 0 && data._id) {
        await uploadFiles(data._id);
        updatedTaskId = data._id;
      } else if (task && files.length > 0) {
        const taskId = task.id || (task as any)._id;
        await uploadFiles(taskId);
      }

      // After update, delete any attachments marked for deletion
      if (updatedTaskId && pendingDelete.length > 0) {
        for (const fileName of pendingDelete) {
          try {
            await fetch(`${API_URL}/tasks/${updatedTaskId}/attachments/${fileName}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch {}
        }
      }

      addToast({
        type: 'success',
        title: task ? 'Task updated' : 'Task created',
        message: task ? 'Task has been successfully updated.' : 'New task has been created successfully.'
      });

      onClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save task. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setUploadProgress({});
    }
  };

  // Helper to upload files to backend
  const uploadFiles = async (taskId: string) => {
    const token = localStorage.getItem('token');
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    // Only allow up to 3 files in total (existing + new)
    const allowed = Math.max(0, 3 - existingAttachments.length);
    setFiles(selectedFiles.slice(0, allowed));
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };
  // Mark an existing attachment for deletion (UI only)
  const removeExistingAttachment = (index: number) => {
    const attachment = existingAttachments[index];
  if (!attachment) return;
  setPendingDelete(prev => [...prev, attachment.fileName]);
  setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Download and preview for existing attachments
  const handleFileDownload = (attachment: any) => {
    const url = `${API_URL}/tasks/attachments/${attachment.fileName}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilePreview = (attachment: any) => {
    const url = `${API_URL}/tasks/attachments/${attachment.fileName}`;
    setPreviewUrl(url);
    setPreviewFileName(attachment.fileName);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`block w-full px-3 py-2 border ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Enter task title"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`block w-full px-3 py-2 border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Enter task description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Status and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {TASK_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {TASK_PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date and Assign To Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`block w-full px-3 py-2 border ${
                errors.dueDate ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assign To *
            </label>
            <div onClick={() => setDropdownOpen(true)} className="min-h-[42px] flex flex-wrap items-center gap-1 px-3 py-2 mb-2 border border-gray-300 rounded-md shadow-sm bg-white cursor-text focus-within:ring-blue-500 focus-within:border-blue-500 sm:text-sm">
              {(() => {
                const shown = formData.assignedTo.slice(0, 2);
                const hiddenCount = formData.assignedTo.length - 2;
                return (
                  <>
                    {shown.map(id => {
                      const u = allUsers.find(u => u.id === id);
                      return u ? (
                        <span key={id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 flex items-center">
                          {u.email}
                          <button type="button" className="ml-1 text-blue-500 hover:text-red-500" onClick={e => {e.stopPropagation(); handleInputChange('assignedTo', formData.assignedTo.filter(uid => uid !== id));}}>&times;</button>
                        </span>
                      ) : null;
                    })}
                    {hiddenCount > 0 && (
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs mr-1">+{hiddenCount} users</span>
                    )}
                  </>
                );
              })()}
              <input
                type="text"
                placeholder={formData.assignedTo.length === 0 ? 'Search users...' : ''}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="flex-1 min-w-[80px] border-none outline-none bg-transparent"
                onFocus={() => setDropdownOpen(true)}
              />
            </div>
            {dropdownOpen && (
              <div className="absolute left-0 right-0 z-10 bg-white border rounded-md max-h-40 overflow-y-auto shadow-lg">
                {allUsers
                  .filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => (
                    <label key={u.id} className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(u.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            handleInputChange('assignedTo', [...formData.assignedTo, u.id]);
                          } else {
                            handleInputChange('assignedTo', formData.assignedTo.filter(id => id !== u.id));
                          }
                        }}
                        className="mr-2"
                        disabled={user?.role !== 'admin' && !task}
                      />
                      {u.email} <span className="ml-2 text-xs text-gray-400">({u.role})</span>
                    </label>
                  ))}
                {allUsers.filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-gray-400 text-sm">No users found</div>
                )}
              </div>
            )}
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>
            )}
          </div>
        </div>

        {/* File Upload & Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="w-4 h-4 inline mr-1" />
            Attach Documents (PDF only, max 3 files)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors duration-200">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={existingAttachments.length >= 3}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF files only, up to 10MB each</p>
            </div>
          </div>
          {errors.files && (
            <p className="mt-1 text-sm text-red-600">{errors.files}</p>
          )}

          {/* Existing Attachments (for update) */}
          {existingAttachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {existingAttachments.map((attachment, index) => (
                <div key={attachment.id || attachment.fileName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleFilePreview(attachment)}
                      className="text-gray-400 hover:text-green-600 transition-colors duration-200"
                      title={`Preview ${attachment.fileName}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileDownload(attachment)}
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      title={`Download ${attachment.fileName}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Remove attachment (will be deleted after update)"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-20">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PDF Preview Modal */}
          <Modal
            isOpen={!!previewUrl}
            onClose={() => setPreviewUrl(null)}
            title={`Preview: ${previewFileName}`}
            size="xl"
          >
            {previewUrl && (
              <div className="w-full h-[70vh] flex items-center justify-center">
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full border rounded shadow"
                />
              </div>
            )}
          </Modal>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            {isLoading ? (task ? 'Updating...' : 'Creating...') : (task ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;