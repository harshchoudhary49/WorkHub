import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createFloorSchema = z.object({
  office: objectId,
  name: z.string().trim().min(1),
  floorNumber: z.number().optional(),
  gridWidth: z.number().min(1).max(50).optional(),
  gridHeight: z.number().min(1).max(50).optional(),
});
export const updateFloorSchema = createFloorSchema.partial();

export const createDeskSchema = z.object({
  floor: objectId,
  deskCode: z.string().trim().min(1),
  position: z.object({ x: z.number().min(0), y: z.number().min(0) }),
});
export const updateDeskSchema = createDeskSchema.partial();

export const assignDeskSchema = z.object({
  employee: objectId,
});

export const mapQuerySchema = z.object({
  office: objectId.optional(),
  floor: objectId.optional(),
  department: objectId.optional(),
  team: objectId.optional(),
  status: z.enum(['present', 'absent', 'leave', 'remote', 'half-day', 'not-checked-in', 'weekend', 'holiday']).optional(),
  search: z.string().trim().optional(),
});
