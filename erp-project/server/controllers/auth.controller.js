import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  registerUser,
  authenticateUser,
  rotateRefreshToken,
  logoutUser,
} from '../services/auth.service.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../services/token.service.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

// Public self-service registration always creates an "employee" account.
// Admin/HR create manager/hr/admin accounts through the (Phase 3) employee
// management endpoints, not this public route - prevents privilege escalation
// via a self-registration form.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, designation } = req.body;

  const { user, employee } = await registerUser({
    name,
    email,
    password,
    role: 'employee',
    designation,
  });

  return new ApiResponse(
    201,
    { user: sanitizeUser(user), employee },
    'Account created successfully'
  ).send(res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, employee, accessToken, refreshToken } = await authenticateUser({
    email,
    password,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return new ApiResponse(
    200,
    { user: sanitizeUser(user), employee, accessToken },
    'Logged in successfully'
  ).send(res);
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];

  const { user, accessToken, refreshToken } = await rotateRefreshToken(incomingToken);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return new ApiResponse(200, { user: sanitizeUser(user), accessToken }, 'Token refreshed').send(
    res
  );
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await logoutUser(req.user.id);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  return new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// Returns the current user's identity + profile - used by the frontend on
// app load to restore session state after a refresh.
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found');

  const employee = await Employee.findOne({ user: user._id })
    .populate('department', 'name')
    .populate('team', 'name')
    .populate('manager', 'name employeeId');

  return new ApiResponse(200, { user: sanitizeUser(user), employee }, 'Current user').send(res);
});
