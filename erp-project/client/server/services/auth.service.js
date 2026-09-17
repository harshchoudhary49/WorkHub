import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  verifyRefreshToken,
} from './token.service.js';

const SALT_ROUNDS = 12;

// Generates a simple, human-readable employee ID like "EMP-0007".
// A real system might use a counters collection to avoid race conditions
// at high concurrency; fine for portfolio-scale seed/demo usage.
const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

export const registerUser = async ({ name, email, password, role, designation }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'employee',
  });

  const employeeId = await generateEmployeeId();
  const employee = await Employee.create({
    user: user._id,
    employeeId,
    name,
    designation: designation || '',
  });

  return { user, employee };
};

export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const employee = await Employee.findOne({ user: user._id });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  return { user, employee, accessToken, refreshToken };
};

export const rotateRefreshToken = async (incomingToken) => {
  if (!incomingToken) {
    throw ApiError.unauthorized('No refresh token provided');
  }

  let payload;
  try {
    payload = verifyRefreshToken(incomingToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Session no longer valid');
  }

  if (user.refreshTokenHash !== hashToken(incomingToken)) {
    // Token reuse / mismatch - possible theft. Invalidate the session.
    user.refreshTokenHash = undefined;
    await user.save();
    throw ApiError.unauthorized('Session invalidated, please log in again');
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
};
