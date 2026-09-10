import { ApiError } from '../utils/ApiError.js';

// Route-level role gate. Use after `authenticate`.
// Example: router.get('/reports', authenticate, authorize('hr', 'admin'), ctrl)
//
// This only checks ROLE, not ownership/scope (e.g. "is this manager's own
// team"). Scope checks belong in the service layer, close to the query,
// where the manager's team membership is actually known.
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  if (!allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
  next();
};
