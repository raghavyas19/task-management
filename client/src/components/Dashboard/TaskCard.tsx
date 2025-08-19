import React from 'react';
import { Edit, Trash2, User, Calendar, FileText, ArrowUp, ArrowDown, Minus, Paperclip } from 'lucide-react';
import { Task } from '../../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onView }) => {
  const auth = useAuth();
  const user = auth?.user;

  const canEdit = user?.role === 'admin' || task.assignedTo === user?.id;
  const statusInfo = TASK_STATUSES.find(s => s.value === task.status);
  const priorityInfo = TASK_PRIORITIES.find(p => p.value === task.priority);

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'high':
        return <ArrowUp className="w-4 h-4" />;
      case 'low':
        return <ArrowDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`, color: 'text-yellow-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  const dueDate = formatDate(task.dueDate);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onView(task)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {task.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {task.description}
          </p>
        </div>
        
        {canEdit && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Status and Priority */}
      <div className="flex items-center space-x-3 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
          {statusInfo?.label}
        </span>
        <div className={`flex items-center space-x-1 ${priorityInfo?.color}`} title={`${priorityInfo?.label} priority`}>
          {getPriorityIcon()}
          <span className="text-xs font-medium">{priorityInfo?.label}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {/* Due Date */}
        <div className="flex items-center text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span className={dueDate.color}>{dueDate.text}</span>
        </div>

        {/* Assigned User */}
        {task.assignedUser && (
          <div className="flex items-center text-gray-500">
            <User className="w-4 h-4 mr-2" />
            {Array.isArray(task.assignedUser)
              ? task.assignedUser.map((u, idx) => (
                  <span key={u.id || idx} className={idx > 0 ? 'ml-2' : ''}>{u.email}</span>
                ))
              : <span>{task.assignedUser.email}</span>
            }
          </div>
        )}

        {/* Assigned By (Admin) */}
        {task.createdBy && typeof task.createdBy === 'object' && task.createdBy.role === 'admin' && (
          <div className="flex items-center text-gray-500">
            <User className="w-4 h-4 mr-2" />
            <span>Assigned by: {task.createdBy.email}</span>
          </div>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="flex items-center text-gray-500">
            <Paperclip className="w-4 h-4 mr-2" />
            <span>{task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Created Date */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-400">
          <FileText className="w-3 h-3 mr-1" />
          Created {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;