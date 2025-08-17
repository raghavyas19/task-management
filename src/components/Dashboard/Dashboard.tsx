import React, { useState, useMemo } from 'react';
import { Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, TaskFilters, TaskSort } from '../../types';
import { mockTasks, ITEMS_PER_PAGE } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import TaskCard from './TaskCard';
import Filters from './Filters';
import TaskForm from '../Tasks/TaskForm';
import TaskDetails from '../Tasks/TaskDetails';
import Modal from '../UI/Modal';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks] = useState<Task[]>(mockTasks);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: 'dueDate', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply user-specific filtering for non-admins
    if (user?.role !== 'admin') {
      filtered = filtered.filter(task => task.assignedTo === user?.id);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply assigned user filter
    if (filters.assignedTo) {
      filtered = filtered.filter(task => task.assignedTo === filters.assignedTo);
    }

    // Apply date range filters
    if (filters.dueDateFrom) {
      filtered = filtered.filter(task => new Date(task.dueDate) >= new Date(filters.dueDateFrom!));
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(task => new Date(task.dueDate) <= new Date(filters.dueDateTo!));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, filters, sort, user]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const handleSort = (field: TaskSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteConfirm(task);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      // In real app, would call API to delete task
      console.log('Deleting task:', deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const sortHeaders = [
    { field: 'title' as const, label: 'Title' },
    { field: 'status' as const, label: 'Status' },
    { field: 'priority' as const, label: 'Priority' },
    { field: 'dueDate' as const, label: 'Due Date' },
    { field: 'createdAt' as const, label: 'Created' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              {user?.role === 'admin' 
                ? `Managing ${filteredTasks.length} of ${tasks.length} tasks`
                : `You have ${filteredTasks.length} assigned tasks`
              }
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <Filters filters={filters} onFiltersChange={setFilters} />

      {/* Sort Headers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {sortHeaders.map(header => (
            <button
              key={header.field}
              onClick={() => handleSort(header.field)}
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              <span>{header.label}</span>
              {sort.field === header.field ? (
                sort.direction === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      {currentTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onView={handleViewTask}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-lg mb-4">No tasks found</div>
          <p className="text-gray-600">
            {Object.keys(filters).some(key => filters[key as keyof TaskFilters])
              ? 'Try adjusting your filters to find the tasks you are looking for.'
              : 'Get started by creating your first task.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredTasks.length)}</span> of{' '}
              <span className="font-medium">{filteredTasks.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          task={selectedTask}
          isOpen={isTaskFormOpen}
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Task Details Modal */}
      {isTaskDetailsOpen && selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={isTaskDetailsOpen}
          onClose={() => {
            setIsTaskDetailsOpen(false);
            setSelectedTask(null);
          }}
          onEdit={() => {
            setIsTaskDetailsOpen(false);
            setIsTaskFormOpen(true);
          }}
          onDelete={() => {
            setIsTaskDetailsOpen(false);
            handleDeleteTask(selectedTask);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Task"
          size="sm"
        >
          <div className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;