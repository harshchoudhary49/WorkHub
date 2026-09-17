import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Banner from '../../components/ui/Banner.jsx';

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=2e6690&color=fff&bold=true&size=128`;
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-gunmetal-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-900 dark:text-white">{value || '—'}</p>
    </div>
  );
}

export default function Profile() {
  const { user, employee } = useAuth();
  const [skillsInput, setSkillsInput] = useState((employee?.skills || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const displayName = employee?.name || user?.email || 'User';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await employeeApi.updateOwnProfile({ skills });
      setMessage({ tone: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl page-enter">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">My profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-gunmetal-400">
        Organizational details (department, team, manager) are managed by HR/Admin.
      </p>

      {/* Avatar + name hero */}
      <div className="mt-6 flex items-center gap-5 rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-6">
        <img
          src={getAvatarUrl(displayName)}
          alt={displayName}
          className="h-20 w-20 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900"
        />
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-gunmetal-400">{user?.email}</p>
          {employee?.designation && (
            <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">{employee.designation}</p>
          )}
          <span className="mt-2 inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold capitalize text-primary-700 dark:text-primary-300">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-6 text-sm">
        <InfoRow label="Employee ID" value={employee?.employeeId} />
        <InfoRow label="Department" value={employee?.department?.name} />
        <InfoRow label="Team" value={employee?.team?.name} />
        <InfoRow label="Manager" value={employee?.manager?.name} />
        <InfoRow
          label="Joined"
          value={employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : null}
        />
        {employee?.skills?.length > 0 && (
          <div className="col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-gunmetal-400">Skills</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {employee.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-slate-100 dark:bg-gunmetal-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-6">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Edit skills</p>
        <TextField
          label="Skills (comma separated)"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="React, Node.js, MongoDB"
        />
        {message && <Banner tone={message.tone}>{message.text}</Banner>}
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
