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

// Mock data for demo
export const mockUsers: import('../types').User[] = [
  { id: '1', email: 'admin@example.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', email: 'john@example.com', role: 'user', createdAt: '2024-01-02T00:00:00Z' },
  { id: '3', email: 'jane@example.com', role: 'user', createdAt: '2024-01-03T00:00:00Z' },
  { id: '4', email: 'mike@example.com', role: 'user', createdAt: '2024-01-04T00:00:00Z' }
];

export const mockTasks: import('../types').Task[] = [
  {
    id: '1',
    title: 'Design User Interface',
    description: 'Create mockups and wireframes for the new dashboard interface',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-02-15T00:00:00Z',
    assignedTo: '2',
    assignedUser: mockUsers[1],
    createdBy: '1',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
    attachments: [
      { id: '1', fileName: 'wireframes.pdf', fileSize: 2048576, uploadedAt: '2024-01-10T00:00:00Z' }
    ]
  },
  {
    id: '2',
    title: 'Database Optimization',
    description: 'Optimize database queries for better performance',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-02-20T00:00:00Z',
    assignedTo: '3',
    assignedUser: mockUsers[2],
    createdBy: '1',
    createdAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z'
  },
  {
    id: '3',
    title: 'Security Audit',
    description: 'Conduct comprehensive security audit of the application',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-02-10T00:00:00Z',
    assignedTo: '4',
    assignedUser: mockUsers[3],
    createdBy: '1',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z'
  },
  {
    id: '4',
    title: 'Code Review',
    description: 'Review pull requests and provide feedback',
    status: 'completed',
    priority: 'low',
    dueDate: '2024-01-25T00:00:00Z',
    assignedTo: '2',
    assignedUser: mockUsers[1],
    createdBy: '1',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z'
  },
  {
    id: '5',
    title: 'API Documentation',
    description: 'Update API documentation with latest changes',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-02-18T00:00:00Z',
    assignedTo: '3',
    assignedUser: mockUsers[2],
    createdBy: '1',
    createdAt: '2024-01-13T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '6',
    title: 'Testing Framework',
    description: 'Set up automated testing framework',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-02-12T00:00:00Z',
    assignedTo: '4',
    assignedUser: mockUsers[3],
    createdBy: '1',
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z'
  }
];