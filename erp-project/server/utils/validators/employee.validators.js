import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Used by Admin/HR to create a full employee record (and its login).
export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'manager', 'hr', 'admin']).default('employee'),
  designation: z.string().trim().optional(),
  department: objectId.optional().nullable(),
  team: objectId.optional().nullable(),
  manager: objectId.optional().nullable(),
  office: objectId.optional().nullable(),
  skills: z.array(z.string().trim()).optional(),
  joiningDate: z.coerce.date().optional(),
});

// Used by Admin/HR to edit an existing employee's org data + role/status.
export const updateEmployeeAdminSchema = z.object({
  name: z.string().trim().min(2).optional(),
  designation: z.string().trim().optional(),
  department: objectId.optional().nullable(),
  team: objectId.optional().nullable(),
  manager: objectId.optional().nullable(),
  office: objectId.optional().nullable(),
  skills: z.array(z.string().trim()).optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
  role: z.enum(['employee', 'manager', 'hr', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

// Used by an employee editing their own profile - deliberately narrow.
// Org placement (department/team/manager) and role/status are HR/Admin-only
// so an employee can't reassign themselves to a different team or role.
export const updateOwnProfileSchema = z.object({
  skills: z.array(z.string().trim()).optional(),
  avatarUrl: z.string().trim().optional(),
});
