import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createGoalSchema = z.object({
  employee: objectId.optional(), // ignored/overridden for role 'employee' - see goal.service.js
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateOwnGoalSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
});

export const reviewGoalSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed', 'cancelled']),
  comment: z.string().trim().max(500).optional(),
});

export const goalQuerySchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed', 'cancelled']).optional(),
  employee: objectId.optional(),
});
