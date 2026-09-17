import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { attendanceApi } from '../../api/attendanceApi.js';
import { taskApi } from '../../api/taskApi.js';
import { leaveApi } from '../../api/leaveApi.js';
import { performanceApi } from '../../api/performanceApi.js';
import { goalApi } from '../../api/goalApi.js';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';

const STATUS_COLORS = {
  present: '#4338ca',
  remote: '#0284c7',
  leave: '#7c3aed',
  absent: '#ef4444',
  'half-day': '#f59e0b',
  weekend: '#cbd5e1',
  holiday: '#cbd5e1',
  'not-checked-in': '#e2e8f0',
};

export default function ManagerDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [teamAvgScore, setTeamAvgScore] = useState(null);
  const [goalsInProgress, setGoalsInProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      attendanceApi.teamAttendance(),
      taskApi.teamTasks(),
      leaveApi.teamLeaves({ status: 'pending' }),
      performanceApi.team({}),
      goalApi.teamGoals({ status: 'in-progress' }),
    ])
      .then(([att, tasks, leaves, perf, goals]) => {
        setAttendance(att.data.data.roster);
        setTaskStats(tasks.data.data.teamStats);
        setPendingLeaves(leaves.data.data.length);
        setTeamAvgScore(perf.data.data.teamAverage);
        setGoalsInProgress(goals.data.data.length);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <Banner>{error}</Banner>;
  if (!attendance) return <p className="text-sm text-slate-500">Loading...</p>;

  const attendanceCounts = attendance.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const attendanceChartData = Object.entries(attendanceCounts).map(([status, count]) => ({ status, count }));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Team overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to="/manager/attendance" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Team size</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{attendance.length}</p>
        </Link>
        <Link to="/manager/leaves" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Pending leaves</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{pendingLeaves}</p>
        </Link>
        <Link to="/manager/tasks" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Overdue tasks</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{taskStats?.overdue ?? 0}</p>
        </Link>
        <Link to="/manager/performance" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Team avg score</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{teamAvgScore ?? '—'}</p>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Today's attendance</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {attendanceChartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Task completion</p>
          {taskStats && (
            <>
              <p className="mt-2 text-3xl font-bold text-slate-900">{taskStats.completionPercentage}%</p>
              <div className="mt-3">
                <ProgressBar value={taskStats.completionPercentage} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{taskStats.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{taskStats.active}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
                <div>
                  <p className="font-semibold text-red-500">{taskStats.overdue}</p>
                  <p className="text-xs text-slate-500">Overdue</p>
                </div>
              </div>
            </>
          )}
          <Link to="/manager/goals" className="mt-4 block text-xs text-primary-700 hover:underline">
            {goalsInProgress} goal(s) in progress across the team →
          </Link>
        </div>
      </div>
    </div>
  );
}
