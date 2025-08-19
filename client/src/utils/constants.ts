export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600', icon: 'ArrowDown' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600', icon: 'Minus' },
  { value: 'high', label: 'High', color: 'text-red-600', icon: 'ArrowUp' }
] as const;

export const USER_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Administrator' }
] as const;

export const ITEMS_PER_PAGE = 9;