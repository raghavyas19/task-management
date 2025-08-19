import React, { useState, useMemo, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, TaskFilters, TaskSort } from '../../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import TaskCard from './TaskCard';
import Filters from './Filters';
import TaskForm from '../Tasks/TaskForm';
import TaskDetails from '../Tasks/TaskDetails';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useToast } from '../../hooks/useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard: React.FC = () => {
  const auth = useAuth();
  if (!auth) throw new Error('useAuth must be used within an AuthProvider');
  const { user } = auth;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: 'dueDate', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('dashboardCurrentPage');
    return saved ? Number(saved) : 1;
  });
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(() => {
    return localStorage.getItem('dashboardIsTaskFormOpen') === 'true';
  });
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(() => {
    return localStorage.getItem('dashboardIsTaskDetailsOpen') === 'true';
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(() => {
    const saved = localStorage.getItem('dashboardSelectedTask');
    return saved ? JSON.parse(saved) : null;
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(res.ok ? data : []);
      setLoading(false);
    };
    fetchTasks();
  }, [user, reload]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (user?.role !== 'admin') {
      filtered = filtered.filter(task => {
        if (!Array.isArray(task.assignedTo)) return false;
        return task.assignedTo.some((u: any) => {
          if (typeof u === 'object') {
            return u._id === user.id || u.id === user.id;
          }
          return u === user.id;
        });
      });
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (typeof filters.assignedTo === 'string' && filters.assignedTo) {
      filtered = filtered.filter(task => Array.isArray(task.assignedTo) && task.assignedTo.includes(filters.assignedTo as string));
    }

    if (filters.dueDateFrom) {
      filtered = filtered.filter(task => new Date(task.dueDate) >= new Date(filters.dueDateFrom!));
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(task => new Date(task.dueDate) <= new Date(filters.dueDateTo!));
    }

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

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  useEffect(() => {
    localStorage.setItem('dashboardCurrentPage', String(currentPage));
  }, [currentPage]);
  useEffect(() => {
    localStorage.setItem('dashboardIsTaskFormOpen', String(isTaskFormOpen));
  }, [isTaskFormOpen]);
  useEffect(() => {
    localStorage.setItem('dashboardIsTaskDetailsOpen', String(isTaskDetailsOpen));
  }, [isTaskDetailsOpen]);
  useEffect(() => {
    localStorage.setItem('dashboardSelectedTask', selectedTask ? JSON.stringify(selectedTask) : '');
  }, [selectedTask]);

  const handleSort = (field: TaskSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };


  const fetchTaskById = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  };

  const handleEditTask = async (task: Task) => {
    const latest = await fetchTaskById(task.id || (task as any)._id);
    setSelectedTask(latest || task);
    setIsTaskFormOpen(true);
  };

  const handleViewTask = async (task: Task) => {
    const latest = await fetchTaskById(task.id || (task as any)._id);
    setSelectedTask(latest || task);
    setIsTaskDetailsOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteConfirm(task);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/tasks/${deleteConfirm.id || (deleteConfirm as any)._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          addToast({ type: 'error', title: 'Delete Failed', message: data.error || 'Failed to delete task.' });
        } else {
          addToast({ type: 'success', title: 'Task Deleted', message: 'Task deleted successfully.' });
          setReload(r => !r); // reload tasks
        }
      } catch (err) {
        addToast({ type: 'error', title: 'Delete Failed', message: 'Failed to delete task.' });
      }
      setDeleteConfirm(null);
    }
  };

  const sortHeaders = [
    { field: 'title' as const, label: 'Title' },
    { field: 'status' as const, label: 'Status' },
    { field: 'priority' as const, label: 'Priority' },
    { field: 'dueDate' as const, label: 'Due Date' },
    { field: 'createdAt' as const, label: 'Created At' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
            {user?.role === 'admin' ? (
              <p className="mt-1 text-sm text-gray-600">
                Managing {filteredTasks.length} of {tasks.length} tasks
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                  Assigned to you
                </span>
                <span className="text-sm text-gray-700">
                  {filteredTasks.length === 0
                    ? 'No tasks assigned yet!'
                    : `You have ${filteredTasks.length} assigned task${filteredTasks.length > 1 ? 's' : ''}`}
                </span>
              </div>
            )}
          </div>
          {user?.role === 'admin' && (
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
          )}
        </div>
      </div>

  {/* Filters */}
  <Filters filters={filters} onFiltersChange={setFilters} onReload={() => setReload(r => !r)} />




      {/* Mobile Card View */}
      <div className="sm:hidden">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4 mb-8">
            {filteredTasks
              .slice() // copy
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // newest first
              .map(task => (
                <TaskCard
                  key={task.id || (task as any)._id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onView={handleViewTask}
                />
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-lg mb-4">No tasks found</div>
            <p className="text-gray-600">
              {Object.keys(filters).some(key => filters[key as keyof TaskFilters])
                ? 'Try adjusting your filters to find the tasks you are looking for.'
                : 'Get started by creating your first task.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
        ) : currentTasks.length > 0 ? (
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm border border-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('title')}>
                    <span className="flex items-center gap-1">
                      Title
                      {sort.field === 'title' ? (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <span className="flex items-center gap-1">
                      Status
                      {sort.field === 'status' ? (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('priority')}>
                    <span className="flex items-center gap-1">
                      Priority
                      {sort.field === 'priority' ? (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('dueDate')}>
                    <span className="flex items-center gap-1">
                      Due Date
                      {sort.field === 'dueDate' ? (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <span className="flex items-center gap-1">
                      Created At
                      {sort.field === 'createdAt' ? (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTasks.map((task, idx) => {
                  const statusInfo = TASK_STATUSES.find((s) => s.value === task.status);
                  const priorityInfo = TASK_PRIORITIES.find((p) => p.value === task.priority);
                  let assignedToArr: any[] = [];
                  if (Array.isArray(task.assignedTo)) {
                    assignedToArr = task.assignedTo;
                  } else if (typeof task.assignedTo === 'string') {
                    assignedToArr = [task.assignedTo];
                  }
                  const shown = assignedToArr.slice(0, 2);
                  const hiddenCount = assignedToArr.length - 2;
                  return (
                    <tr key={task.id || (task as any)._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewTask(task)}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{startIndex + 1 + idx}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{task.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color}`}>{statusInfo?.label}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo?.color} bg-opacity-10`}>{priorityInfo?.label}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {shown.map((u: any, idx: number) => (
                            <span
                              key={typeof u === 'object' ? u.id || u._id || idx : u}
                              className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {typeof u === 'object' ? u.email || u.id || u._id : u}
                            </span>
                          ))}
                          {hiddenCount > 0 && (
                            <span className="inline-flex items-center bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                              +{hiddenCount} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(task.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={e => { e.stopPropagation(); handleEditTask(task); }}
                          className="text-blue-600 hover:underline mr-2"
                        >Edit</button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteTask(task); }}
                          className="text-red-600 hover:underline"
                        >Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
      </div>

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
          onClose={async () => {
            setIsTaskFormOpen(false);
            // After closing, refetch the selected task to get latest attachments
            if (selectedTask) {
              const latest = await fetchTaskById(selectedTask.id || (selectedTask as any)._id);
              setSelectedTask(latest || selectedTask);
            }
            setReload(r => !r); // reload tasks after form closes
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