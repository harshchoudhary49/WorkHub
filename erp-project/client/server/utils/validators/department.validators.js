import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2),
  office: objectId,
  head: objectId.optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  office: objectId.optional(),
  head: objectId.optional().nullable(),
});
