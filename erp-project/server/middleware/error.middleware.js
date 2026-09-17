import { env } from '../config/env.js';

// Centralized error handler - every thrown error (ApiError or otherwise)
// ends up here via asyncHandler/Express's default error propagation.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    // eslint-disable-next-line no-console
    console.error(err); // unexpected bugs always get logged with full detail
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
