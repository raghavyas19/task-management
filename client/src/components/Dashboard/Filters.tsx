import React from 'react';
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import { TaskFilters } from '../../types';
import { TASK_STATUSES, TASK_PRIORITIES, mockUsers } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';


interface FiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onReload?: () => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, onFiltersChange, onReload }) => {
  const auth = useAuth();
  const user = auth?.user;

  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center mb-2 justify-between">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        {typeof onReload === 'function' && (
          <button
            type="button"
            onClick={onReload}
            className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 focus:outline-none"
            title="Reload tasks"
          >
            <RefreshCw className="w-5 h-5 transition-transform duration-300 hover:rotate-180" />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search tasks
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by title or description..."
            />
          </div>
        </div>
      </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned User Filter (Admin only) */}
        {user?.role === 'admin' && (
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assigned to
            </label>
            <select
              id="assignedTo"
              value={filters.assignedTo || ''}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Users</option>
              {mockUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Filters */}
        <div className="flex flex-col md:flex-row gap-2 col-span-1 md:col-span-2 xl:col-span-2">
          <div className="flex-1 min-w-0">
            <label htmlFor="dueDateFrom" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due date from
            </label>
            <input
              type="date"
              id="dueDateFrom"
              value={filters.dueDateFrom || ''}
              onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="dueDateTo" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due date to
            </label>
            <input
              type="date"
              id="dueDateTo"
              value={filters.dueDateTo || ''}
              onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;