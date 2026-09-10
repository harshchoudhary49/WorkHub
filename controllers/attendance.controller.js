import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Employee } from '../models/Employee.js';
import * as attendanceService from '../services/attendance.service.js';

export const doCheckIn = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.checkIn(req.user.id, req.body);
  return new ApiResponse(200, attendance, 'Checked in').send(res);
});

export const doCheckOut = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.checkOut(req.user.id, req.body);
  return new ApiResponse(200, attendance, 'Checked out').send(res);
});

// Self-service history + percentage/target stats for the logged-in user.
export const myAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user.id });
  const summary = await attendanceService.getEmployeeAttendanceSummary(employee._id, req.query);
  return new ApiResponse(200, summary, 'Attendance fetched').send(res);
});

// HR/Admin (or a manager viewing their own team member - scope check kept
// light here; tightened once leave approval introduces the same pattern).
export const employeeAttendance = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getEmployeeAttendanceSummary(
    req.params.employeeId,
    req.query
  );
  return new ApiResponse(200, summary, 'Attendance fetched').send(res);
});

export const teamAttendance = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const roster = await attendanceService.getTeamAttendanceForDate(req.user.id, date);
  return new ApiResponse(200, roster, 'Team attendance fetched').send(res);
});

export const markAbsentees = asyncHandler(async (req, res) => {
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const result = await attendanceService.markAbsentees(date);
  return new ApiResponse(200, result, 'Absentees marked').send(res);
});

export const manualMark = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.manualMark(req.body);
  return new ApiResponse(200, attendance, 'Attendance record saved').send(res);
});
