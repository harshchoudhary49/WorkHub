import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createTeamSchema = z.object({
  name: z.string().trim().min(2),
  department: objectId,
  manager: objectId.optional().nullable(),
  members: z.array(objectId).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2).optional(),
  department: objectId.optional(),
  manager: objectId.optional().nullable(),
  members: z.array(objectId).optional(),
});
