import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const checkInSchema = z.object({
  mode: z.enum(['office', 'remote']).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().trim().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const monthQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const manualMarkSchema = z.object({
  employee: objectId,
  date: z.coerce.date(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'holiday', 'weekend', 'remote']),
  checkIn: z.coerce.date().optional().nullable(),
  checkOut: z.coerce.date().optional().nullable(),
  notes: z.string().trim().optional(),
});

export const teamAttendanceQuerySchema = z.object({
  date: z.coerce.date().optional(),
});
