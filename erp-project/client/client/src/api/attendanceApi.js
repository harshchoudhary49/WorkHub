import { axiosClient } from './axiosClient.js';

export const attendanceApi = {
  checkIn: (mode) => axiosClient.post('/attendance/check-in', { mode }),
  checkOut: (notes) => axiosClient.post('/attendance/check-out', { notes }),
  myAttendance: (params) => axiosClient.get('/attendance/me', { params }),
  employeeAttendance: (employeeId, params) =>
    axiosClient.get(`/attendance/${employeeId}`, { params }),
  teamAttendance: (date) => axiosClient.get('/attendance/team', { params: { date } }),
  markAbsentees: (date) => axiosClient.post('/attendance/mark-absentees', { date }),
  manualMark: (payload) => axiosClient.post('/attendance/manual', payload),
};
