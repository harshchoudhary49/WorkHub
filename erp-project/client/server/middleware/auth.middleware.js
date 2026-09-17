import { verifyAccessToken } from '../services/token.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the access token from the Authorization header and attaches a
// minimal identity object to req.user. Does NOT hit the database - that
// keeps every protected request cheap. Controllers that need full user/
// employee documents fetch them explicitly.
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
});
