import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const giveRecognitionSchema = z.object({
  to: objectId,
  category: z.enum(['teamwork', 'leadership', 'innovation', 'helping', 'excellence']),
  message: z.string().trim().min(2).max(500),
});
