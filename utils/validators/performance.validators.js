import { z } from 'zod';

export const periodQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const feedbackSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  collaborationScore: z.number().min(0).max(100).optional(),
  comment: z.string().trim().max(1000).optional(),
});
