import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Banner from '../../components/ui/Banner.jsx';

export default function Profile() {
  const { user, employee } = useAuth();
  const [skillsInput, setSkillsInput] = useState((employee?.skills || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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
      setMessage({ tone: 'success', text: 'Profile updated' });
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Organizational details (department, team, manager) are managed by HR/Admin.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <div>
          <p className="text-slate-400">Name</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.name || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Employee ID</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.employeeId || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Email</p>
          <p className="mt-0.5 font-medium text-slate-900">{user?.email}</p>
        </div>
        <div>
          <p className="text-slate-400">Designation</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.designation || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Department</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.department?.name || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Team</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.team?.name || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Manager</p>
          <p className="mt-0.5 font-medium text-slate-900">{employee?.manager?.name || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Joined</p>
          <p className="mt-0.5 font-medium text-slate-900">
            {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <TextField
          label="Skills (comma separated)"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="React, Node.js, MongoDB"
        />
        {message && <Banner tone={message.tone}>{message.text}</Banner>}
        <Button type="submit" loading={saving}>
          Save
        </Button>
      </form>
    </div>
  );
}
