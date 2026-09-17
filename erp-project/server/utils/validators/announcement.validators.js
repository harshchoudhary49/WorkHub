import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(2),
    body: z.string().trim().min(2),
    type: z.enum(['company', 'holiday', 'policy', 'event', 'notice']).optional(),
    scope: z.enum(['company', 'department', 'team']),
    refId: objectId.optional().nullable(),
  })
  .refine((data) => data.scope === 'company' || !!data.refId, {
    message: 'A department or team must be selected for this audience scope',
    path: ['refId'],
  });
