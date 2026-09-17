import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { leaveApi } from '../../api/leaveApi.js';
import { goalApi } from '../../api/goalApi.js';
import { performanceApi } from '../../api/performanceApi.js';
import { holidayApi } from '../../api/holidayApi.js';
import { announcementApi } from '../../api/announcementApi.js';
import { recognitionApi } from '../../api/recognitionApi.js';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Banner from '../../components/ui/Banner.jsx';
import Card from '../../components/ui/Card.jsx';
import { Grid, GridItem } from '../../components/ui/Grid.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { getCurrentLocation } from '../../utils/location.js';

// This page is the reference example for the default layout: everything
// below sits on the 12-column Grid, and every panel is a Card with an
// accent strip that signals its category (steel = tracked metric, amber =
// something in progress, rivet green = balances/entitlements you have).
export default function EmployeeDashboard() {
  const [summary, setSummary] = useState(null);
  const [balances, setBalances] = useState([]);
  const [goals, setGoals] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadAttendance = async () => {
    try {
      const { data } = await attendanceApi.myAttendance({});
      setSummary(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    }
  };

  const handleCheckIn = async (mode) => {
    setBusy(true);
    setActionError('');
    try {
      let location;
      if (mode === 'office') {
        try {
          location = await getCurrentLocation();
        } catch (locErr) {
          setActionError(locErr.message);
          setBusy(false);
          return;
        }
      }
      await attendanceApi.checkIn(mode, location?.lat, location?.lng);
      await loadAttendance();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check in');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    setActionError('');
    try {
      const todayRec = summary?.records.find(
        (r) => new Date(r.date).toDateString() === new Date().toDateString()
      );
      let location;
      if (todayRec?.mode === 'office') {
        try {
          location = await getCurrentLocation();
        } catch (locErr) {
          setActionError(locErr.message);
          setBusy(false);
          return;
        }
      }
      await attendanceApi.checkOut(undefined, location?.lat, location?.lng);
      await loadAttendance();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check out');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    leaveApi
      .myBalances()
      .then(({ data }) => setBalances(data.data))
      .catch(() => {});
    goalApi
      .myGoals({ status: 'in-progress' })
      .then(({ data }) => setGoals(data.data))
      .catch(() => {});
    performanceApi
      .me({})
      .then(({ data }) => setPerformance(data.data))
      .catch(() => {});
    holidayApi
      .list()
      .then(({ data }) => {
        const today = new Date(new Date().toDateString());
        setHolidays(data.data.filter((h) => new Date(h.date) >= today).slice(0, 3));
      })
      .catch(() => {});
    announcementApi
      .list()
      .then(({ data }) => setAnnouncements(data.data.slice(0, 3)))
      .catch(() => {});
    recognitionApi
      .mine()
      .then(({ data }) => setRecognitions(data.data.received.slice(0, 3)))
      .catch(() => {});
  }, []);

  const keyBalances = balances.filter((b) => ['casual', 'sick', 'earned'].includes(b.type));

  const todayRecord = summary?.records.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );

  if (!summary) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton.StatGrid count={4} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton.Card lines={4} className="h-48" />
          <Skeleton.Card lines={4} className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <h1 className="text-xl font-bold text-gunmetal-800 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-gunmetal-400 dark:text-gunmetal-300">
        Here's your daily summary — attendance, goals, tasks and more.
      </p>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {/* ── Clock-In / Clock-Out Widget ─────────────────── */}
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gunmetal-400 dark:text-gunmetal-300">Today</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {!todayRecord?.checkIn ? (
            <>
              <Button onClick={() => handleCheckIn('office')} loading={busy} id="btn-checkin-office">
                ✅ Check in (office)
              </Button>
              <Button variant="ghost" onClick={() => handleCheckIn('remote')} loading={busy} id="btn-checkin-remote">
                🏠 Check in (remote)
              </Button>
            </>
          ) : !todayRecord?.checkOut ? (
            <>
              <StatusBadge status={todayRecord.status} />
              <p className="text-sm text-gunmetal-500 dark:text-gunmetal-300">
                Checked in at {new Date(todayRecord.checkIn).toLocaleTimeString()}
              </p>
              <Button onClick={handleCheckOut} loading={busy} id="btn-checkout">
                🔴 Check out
              </Button>
            </>
          ) : (
            <>
              <StatusBadge status={todayRecord.status} />
              <p className="text-sm text-gunmetal-500 dark:text-gunmetal-300">
                {new Date(todayRecord.checkIn).toLocaleTimeString()} –{' '}
                {new Date(todayRecord.checkOut).toLocaleTimeString()}
                {todayRecord.workingHours ? ` · ${todayRecord.workingHours}h worked` : ''}
              </p>
            </>
          )}
        </div>
        {actionError && <p className="mt-2 text-sm text-red-500">{actionError}</p>}
      </div>

      <div className="mt-6 space-y-4">
        <Grid>
          <GridItem span={4}>
            <Card accent="steel" title="Today" to="/attendance" className="h-full">
              {todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <span className="text-sm font-medium text-gunmetal-300">Not checked in yet</span>
              )}
            </Card>
          </GridItem>

          <GridItem span={8}>
            <Card accent="amber" title="Monthly attendance" to="/attendance" className="h-full">
              {summary ? (
                <>
                  <p className="text-2xl font-bold text-gunmetal-800">{summary.percentage}%</p>
                  <div className="mt-2">
                    <ProgressBar
                      value={summary.percentage}
                      tone={summary.percentage >= summary.targetPercentage ? 'primary' : 'amber'}
                    />
                  </div>
                  {summary.additionalDaysNeeded > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      {summary.additionalDaysNeeded} more present day
                      {summary.additionalDaysNeeded === 1 ? '' : 's'} to reach {summary.targetPercentage}%
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gunmetal-300">Loading...</p>
              )}
            </Card>
          </GridItem>

          <GridItem span={12}>
            <Card accent="rivet" title="Leave balance" to="/leaves">
              <div className="grid grid-cols-3 gap-4">
                {keyBalances.map((b) => (
                  <div key={b.type}>
                    <p className="text-xs font-medium capitalize text-gunmetal-400">{b.type}</p>
                    <p className="mt-0.5 text-lg font-bold text-gunmetal-800">{b.remaining}</p>
                    <p className="text-[11px] text-gunmetal-300">of {b.allocated} days</p>
                  </div>
                ))}
              </div>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card accent="amber" title="Active goals" to="/goals" className="h-full">
              {goals.length === 0 ? (
                <p className="text-sm text-gunmetal-300">No goals in progress</p>
              ) : (
                <div className="space-y-3">
                  {goals.slice(0, 3).map((g) => (
                    <div key={g._id}>
                      <div className="flex items-center justify-between text-xs text-gunmetal-500">
                        <span className="truncate">{g.title}</span>
                        <span>{g.progress}%</span>
                      </div>
                      <div className="mt-1">
                        <ProgressBar value={g.progress} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card accent="steel" title="Performance summary" to="/performance" className="h-full">
              <p className="text-2xl font-bold text-gunmetal-800">
                {performance?.contributionScore !== null && performance?.contributionScore !== undefined
                  ? performance.contributionScore
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-gunmetal-300">Contribution score, this month</p>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card accent="steel" title="Announcements" to="/announcements" className="h-full">
              {announcements.length === 0 ? (
                <p className="text-sm text-gunmetal-300">Nothing new</p>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <p key={a._id} className="truncate text-sm text-gunmetal-600">
                      {a.title}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card accent="none" title="Upcoming holidays" className="h-full">
              {holidays.length === 0 ? (
                <p className="text-sm text-gunmetal-300">None in the next few weeks</p>
              ) : (
                <div className="space-y-1.5">
                  {holidays.map((h) => (
                    <div key={h._id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-gunmetal-600">{h.name}</span>
                      <span className="text-xs text-gunmetal-300">
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card accent="amber" title="Recognition" to="/recognition" className="h-full">
              {recognitions.length === 0 ? (
                <p className="text-sm text-gunmetal-300">No shout-outs yet</p>
              ) : (
                <div className="space-y-2">
                  {recognitions.map((r) => (
                    <p key={r._id} className="truncate text-sm text-gunmetal-600">
                      {r.from?.name} · {r.category}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          </GridItem>
        </Grid>
      </div>
    </div>
  );
}
