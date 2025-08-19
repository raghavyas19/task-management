export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string[];
  assignedUser?: User | User[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id?: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  assignedTo?: string;
}

export interface TaskSort {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface AuthUser extends User {
  token: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}