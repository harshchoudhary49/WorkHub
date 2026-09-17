import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const dateRangeReportSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  department: objectId.optional(),
  team: objectId.optional(),
  employee: objectId.optional(),
});

export const taskReportSchema = dateRangeReportSchema.extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
});

export const leaveReportSchema = dateRangeReportSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  type: z.enum(['casual', 'sick', 'earned', 'wfh', 'emergency']).optional(),
});

export const performanceReportSchema = z.object({
  department: objectId.optional(),
  team: objectId.optional(),
  employee: objectId.optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const employeeReportSchema = z.object({
  department: objectId.optional(),
  team: objectId.optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
});
