import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const sendDirectMessageSchema = z.object({
  recipient: objectId,
  body: z.string().trim().min(1).max(2000),
});

export const sendTeamMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
