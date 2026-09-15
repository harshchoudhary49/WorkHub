import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createHolidaySchema = z.object({
  name: z.string().trim().min(2),
  date: z.coerce.date(),
  office: objectId.optional().nullable(),
});

export const updateHolidaySchema = createHolidaySchema.partial();
