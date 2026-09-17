import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Only Admin/HR-created accounts should be able to set a role other than
  // "employee" - enforced in the controller, not here (this just checks shape).
  role: z.enum(['employee', 'manager', 'hr', 'admin']).optional(),
  designation: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
