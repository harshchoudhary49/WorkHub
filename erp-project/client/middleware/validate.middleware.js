import { ApiError } from '../utils/ApiError.js';

// Generic zod-schema validator. Usage:
//   router.post('/login', validate(loginSchema), authController.login)
// Validates req.body by default; pass { source: 'query' } etc. for others.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw ApiError.badRequest('Validation failed', details);
  }
  req[source] = result.data;
  next();
};
