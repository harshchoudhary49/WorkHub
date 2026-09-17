import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi.js';
import { departmentApi } from '../../api/departmentApi.js';
import { teamApi } from '../../api/teamApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import { downloadCsv } from '../../utils/csv.js';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '');
const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

// Each report type: which API to call, which filters it uses, and how to
// render its columns (key into the row + a header label + optional
// formatter). Driven from one config so adding a 7th report later is a
// matter of adding one entry here, not touching the render logic.
const REPORT_TYPES = {
  attendance: {
    label: 'Attendance',
    fetch: reportApi.attendance,
    filters: ['dateRange', 'department', 'team', 'employee'],
    columns: [
      { key: 'employeeId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'team', label: 'Team' },
      { key: 'present', label: 'Present' },
      { key: 'remote', label: 'Remote' },
      { key: 'halfDay', label: 'Half day' },
      { key: 'leave', label: 'Leave' },
      { key: 'absent', label: 'Absent' },
      { key: 'attendancePercentage', label: 'Attendance %', format: fmtPct },
    ],
  },
  leaves: {
    label: 'Leaves',
    fetch: reportApi.leaves,
    filters: ['dateRange', 'department', 'team', 'employee', 'leaveStatus', 'leaveType'],
    columns: [
      { key: 'employeeId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'team', label: 'Team' },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Start', format: fmtDate },
      { key: 'endDate', label: 'End', format: fmtDate },
      { key: 'days', label: 'Days' },
      { key: 'status', label: 'Status' },
      { key: 'approver', label: 'Approver' },
    ],
  },
  employees: {
    label: 'Employees',
    fetch: reportApi.employees,
    filters: ['department', 'team', 'employeeStatus'],
    columns: [
      { key: 'employeeId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department' },
      { key: 'team', label: 'Team' },
      { key: 'status', label: 'Status' },
      { key: 'joiningDate', label: 'Joined', format: fmtDate },
      { key: 'skills', label: 'Skills' },
    ],
  },
  tasks: {
    label: 'Tasks',
    fetch: reportApi.tasks,
    filters: ['dateRange', 'department', 'team', 'employee', 'taskStatus'],
    columns: [
      { key: 'title', label: 'Task' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'team', label: 'Team' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due', format: fmtDate },
      { key: 'overdue', label: 'Overdue', format: (v) => (v ? 'Yes' : 'No') },
      { key: 'estimatedHours', label: 'Est. hrs' },
      { key: 'actualHours', label: 'Actual hrs' },
    ],
  },
  performance: {
    label: 'Team performance',
    fetch: reportApi.performance,
    filters: ['monthYear', 'department', 'team', 'employee'],
    columns: [
      { key: 'employeeId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'team', label: 'Team' },
      { key: 'taskCompletionRate', label: 'Task completion', format: fmtPct },
      { key: 'onTimeDeliveryRate', label: 'On-time', format: fmtPct },
      { key: 'qualityScore', label: 'Quality', format: fmtPct },
      { key: 'collaborationScore', label: 'Collaboration', format: fmtPct },
      { key: 'contributionScore', label: 'Contribution score' },
      { key: 'workloadLabel', label: 'Workload' },
    ],
  },
  workload: {
    label: 'Workload',
    fetch: reportApi.workload,
    filters: ['department', 'team', 'employee'],
    columns: [
      { key: 'employeeId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'team', label: 'Team' },
      { key: 'totalTasks', label: 'Total tasks' },
      { key: 'activeTasks', label: 'Active' },
      { key: 'completedTasks', label: 'Completed' },
      { key: 'overdueTasks', label: 'Overdue' },
      { key: 'completionPercentage', label: 'Completion %', format: fmtPct },
      { key: 'workloadLabel', label: 'Workload' },
    ],
  },
};

const emptyFilters = {
  startDate: '',
  endDate: '',
  department: '',
  team: '',
  employee: '',
  leaveStatus: '',
  leaveType: '',
  employeeStatus: '',
  taskStatus: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

export default function Reports() {
  const [reportType, setReportType] = useState('attendance');
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    departmentApi.list().then(({ data }) => setDepartments(data.data)).catch(() => {});
    teamApi.list().then(({ data }) => setTeams(data.data)).catch(() => {});
    employeeApi.list().then(({ data }) => setEmployees(data.data)).catch(() => {});
  }, []);

  const config = REPORT_TYPES[reportType];

  const buildParams = () => {
    const params = {};
    if (config.filters.includes('dateRange')) {
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }
    if (config.filters.includes('department') && filters.department) params.department = filters.department;
    if (config.filters.includes('team') && filters.team) params.team = filters.team;
    if (config.filters.includes('employee') && filters.employee) params.employee = filters.employee;
    if (config.filters.includes('leaveStatus') && filters.leaveStatus) params.status = filters.leaveStatus;
    if (config.filters.includes('leaveType') && filters.leaveType) params.type = filters.leaveType;
    if (config.filters.includes('employeeStatus') && filters.employeeStatus) params.status = filters.employeeStatus;
    if (config.filters.includes('taskStatus') && filters.taskStatus) params.status = filters.taskStatus;
    if (config.filters.includes('monthYear')) {
      params.month = filters.month;
      params.year = filters.year;
    }
    return params;
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await config.fetch(buildParams());
      setRows(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const handleExportCsv = () => {
    if (!rows?.length) return;
    const friendly = rows.map((row) =>
      Object.fromEntries(config.columns.map((c) => [c.label, c.format ? c.format(row[c.key]) : row[c.key]]))
    );
    downloadCsv(`${reportType}-report`, friendly);
  };

  return (
    <div>
      <div className="no-print flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Reports</h1>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        {Object.entries(REPORT_TYPES).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setReportType(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              reportType === key ? 'bg-primary-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="no-print mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {config.filters.includes('dateRange') && (
          <>
            <TextField label="From" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            <TextField label="To" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </>
        )}
        {config.filters.includes('monthYear') && (
          <>
            <Select label="Month" options={MONTHS} value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })} />
            <Select
              label="Year"
              options={[filters.year - 1, filters.year, filters.year + 1].map((y) => ({ value: y, label: String(y) }))}
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
            />
          </>
        )}
        {config.filters.includes('department') && (
          <Select
            label="Department"
            placeholder="All"
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        )}
        {config.filters.includes('team') && (
          <Select
            label="Team"
            placeholder="All"
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            value={filters.team}
            onChange={(e) => setFilters({ ...filters, team: e.target.value })}
          />
        )}
        {config.filters.includes('employee') && (
          <Select
            label="Employee"
            placeholder="All"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            value={filters.employee}
            onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
          />
        )}
        {config.filters.includes('leaveStatus') && (
          <Select
            label="Status"
            placeholder="All"
            options={['pending', 'approved', 'rejected', 'cancelled'].map((s) => ({ value: s, label: s }))}
            value={filters.leaveStatus}
            onChange={(e) => setFilters({ ...filters, leaveStatus: e.target.value })}
          />
        )}
        {config.filters.includes('leaveType') && (
          <Select
            label="Type"
            placeholder="All"
            options={['casual', 'sick', 'earned', 'wfh', 'emergency'].map((s) => ({ value: s, label: s }))}
            value={filters.leaveType}
            onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
          />
        )}
        {config.filters.includes('employeeStatus') && (
          <Select
            label="Status"
            placeholder="All"
            options={['active', 'inactive', 'on-leave'].map((s) => ({ value: s, label: s }))}
            value={filters.employeeStatus}
            onChange={(e) => setFilters({ ...filters, employeeStatus: e.target.value })}
          />
        )}
        {config.filters.includes('taskStatus') && (
          <Select
            label="Status"
            placeholder="All"
            options={['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED'].map((s) => ({ value: s, label: s }))}
            value={filters.taskStatus}
            onChange={(e) => setFilters({ ...filters, taskStatus: e.target.value })}
          />
        )}

        <Button onClick={generate} loading={loading}>
          Generate
        </Button>
      </div>

      {error && (
        <div className="no-print mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {rows && (
        <>
          <div className="no-print mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{rows.length} row(s)</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleExportCsv} disabled={!rows.length}>
                Export CSV
              </Button>
              <Button variant="ghost" onClick={() => window.print()} disabled={!rows.length}>
                Export PDF
              </Button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            {rows.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No data for these filters" description="Try widening the date range or clearing a filter." />
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {config.columns.map((c) => (
                      <th key={c.key} className="whitespace-nowrap px-4 py-3">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {config.columns.map((c) => (
                        <td key={c.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {c.format ? c.format(row[c.key]) : row[c.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
