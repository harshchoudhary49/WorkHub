import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTaskSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  assignee: objectId,
  team: objectId.optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.coerce.date(),
  estimatedHours: z.number().min(0).optional(),
});

// Full edit (manager/HR/admin) - everything except assignee/assignedBy,
// which would effectively be a different task; delete+recreate instead.
export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  team: objectId.optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
});

// Narrow endpoint for the employee themself - status + optionally logging
// actual hours worked so far, nothing else.
export const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']),
  actualHours: z.number().min(0).optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  employee: objectId.optional(),
  team: objectId.optional(),
  overdue: z.enum(['true', 'false']).optional(),
});
