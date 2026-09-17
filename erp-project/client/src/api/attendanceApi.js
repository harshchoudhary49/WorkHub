import { axiosClient } from './axiosClient.js';

export const attendanceApi = {
  checkIn: (mode, lat, lng) => axiosClient.post('/attendance/check-in', { mode, lat, lng }),
  checkOut: (notes, lat, lng) => axiosClient.post('/attendance/check-out', { notes, lat, lng }),
  myAttendance: (params) => axiosClient.get('/attendance/me', { params }),
  employeeAttendance: (employeeId, params) =>
    axiosClient.get(`/attendance/${employeeId}`, { params }),
  teamAttendance: (date) => axiosClient.get('/attendance/team', { params: { date } }),
  markAbsentees: (date) => axiosClient.post('/attendance/mark-absentees', { date }),
  manualMark: (payload) => axiosClient.post('/attendance/manual', payload),
};
