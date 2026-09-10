import { z } from 'zod';

export const createOfficeSchema = z.object({
  name: z.string().trim().min(2),
  address: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
});

export const updateOfficeSchema = createOfficeSchema.partial();
