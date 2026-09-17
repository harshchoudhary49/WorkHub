import { useEffect, useState } from 'react';
import { workforceApi } from '../../api/workforceApi.js';
import { departmentApi } from '../../api/departmentApi.js';
import { teamApi } from '../../api/teamApi.js';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import Modal from '../../components/ui/Modal.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import DeskMarker, { DESK_LEGEND } from '../../components/ui/DeskMarker.jsx';

const CELL_SIZE = 56;

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'remote', label: 'Remote' },
  { value: 'leave', label: 'On leave' },
  { value: 'absent', label: 'Absent' },
  { value: 'not-checked-in', label: 'Not checked in' },
];

export default function WorkforceCommandCenter() {
  const [overview, setOverview] = useState(null);
  const [offices, setOffices] = useState([]);
  const [floors, setFloors] = useState([]);
  const [desks, setDesks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({ office: '', floor: '', department: '', team: '', status: '', search: '' });

  const loadOverview = () => {
    workforceApi
      .overview()
      .then(({ data }) => setOverview(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load overview'));
  };

  const loadMap = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    workforceApi
      .map(params)
      .then(({ data }) => {
        setOffices(data.data.offices);
        setFloors(data.data.floors);
        setDesks(data.data.desks);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load office map'));
  };

  useEffect(() => {
    loadOverview();
    departmentApi.list().then(({ data }) => setDepartments(data.data));
    teamApi.list().then(({ data }) => setTeams(data.data));
  }, []);

  useEffect(() => {
    loadMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const floorsForSelectedOffice = filters.office ? floors.filter((f) => String(f.office._id || f.office) === filters.office) : floors;
  const activeFloor = filters.floor ? floors.find((f) => f._id === filters.floor) : floorsForSelectedOffice[0];
  const desksForActiveFloor = activeFloor ? desks.filter((d) => String(d.floor) === String(activeFloor._id)) : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Workforce Command Center</h1>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {overview && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Total', overview.totalEmployees, '#334155'],
            ['Present', overview.present, '#16a34a'],
            ['Absent', overview.absent, '#ef4444'],
            ['On leave', overview.onLeave, '#eab308'],
            ['Remote', overview.remote, '#0284c7'],
            ['Not checked in', overview.notCheckedIn, '#94a3b8'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Select
          label="Office"
          placeholder="All offices"
          options={offices.map((o) => ({ value: o._id, label: o.name }))}
          value={filters.office}
          onChange={(e) => setFilters({ ...filters, office: e.target.value, floor: '' })}
        />
        <Select
          label="Floor"
          placeholder="All floors"
          options={floorsForSelectedOffice.map((f) => ({ value: f._id, label: f.name }))}
          value={filters.floor}
          onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
        />
        <Select
          label="Department"
          placeholder="All departments"
          options={departments.map((d) => ({ value: d._id, label: d.name }))}
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        />
        <Select
          label="Team"
          placeholder="All teams"
          options={teams.map((t) => ({ value: t._id, label: t.name }))}
          value={filters.team}
          onChange={(e) => setFilters({ ...filters, team: e.target.value })}
        />
        <Select
          label="Status"
          placeholder="Any status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Search</span>
          <input
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="Name or employee ID"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        {DESK_LEGEND.map((l) => (
          <span key={l.status} className="text-xs text-slate-600">
            {l.emoji} {l.status.replace('-', ' ')}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        {!activeFloor ? (
          <EmptyState title="No floors set up yet" description="Ask HR/Admin to add a floor and some desks under Office setup." />
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-700">{activeFloor.name}</p>
            <div
              className="relative overflow-auto rounded-lg bg-slate-50"
              style={{
                width: '100%',
                height: Math.min(500, activeFloor.gridHeight * CELL_SIZE + 20),
              }}
            >
              <div
                className="relative"
                style={{ width: activeFloor.gridWidth * CELL_SIZE, height: activeFloor.gridHeight * CELL_SIZE }}
              >
                {desksForActiveFloor.map((desk) => (
                  <DeskMarker key={desk._id} desk={desk} cellSize={CELL_SIZE} onClick={setSelected} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.employee?.name || ''}>
        {selected?.employee && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={selected.employee.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Designation</span>
              <span className="font-medium text-slate-800">{selected.employee.designation || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Team</span>
              <span className="font-medium text-slate-800">{selected.employee.team || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Check-in</span>
              <span className="font-medium text-slate-800">
                {selected.employee.checkIn ? new Date(selected.employee.checkIn).toLocaleTimeString() : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Working hours</span>
              <span className="font-medium text-slate-800">{selected.employee.workingHours || '—'}</span>
            </div>
            <div>
              <p className="mb-2 text-slate-500">Active tasks</p>
              {selected.employee.activeTasks.length === 0 ? (
                <p className="text-xs text-slate-400">No active tasks</p>
              ) : (
                <ul className="space-y-1.5">
                  {selected.employee.activeTasks.map((t, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      {t.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
