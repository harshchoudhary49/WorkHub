import { z } from 'zod';

export const applyLeaveSchema = z
  .object({
    type: z.enum(['casual', 'sick', 'earned', 'wfh', 'emergency']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

export const decideLeaveSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const leaveQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  type: z.enum(['casual', 'sick', 'earned', 'wfh', 'emergency']).optional(),
  employee: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});
