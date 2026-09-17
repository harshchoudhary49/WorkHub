import { useEffect, useState } from 'react';
import { officeApi } from '../../api/officeApi.js';
import { floorApi } from '../../api/floorApi.js';
import { deskApi } from '../../api/deskApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyFloorForm = { office: '', name: '', floorNumber: 1, gridWidth: 12, gridHeight: 8 };
const emptyDeskForm = { deskCode: '', x: 0, y: 0 };

export default function OfficeSetup() {
  const [offices, setOffices] = useState([]);
  const [floors, setFloors] = useState([]);
  const [desks, setDesks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [error, setError] = useState('');

  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [floorForm, setFloorForm] = useState(emptyFloorForm);
  const [deskModalOpen, setDeskModalOpen] = useState(false);
  const [deskForm, setDeskForm] = useState(emptyDeskForm);
  const [saving, setSaving] = useState(false);

  const loadFloors = async () => {
    const { data } = await floorApi.list();
    setFloors(data.data);
    if (!selectedFloor && data.data.length) setSelectedFloor(data.data[0]._id);
  };

  const loadDesks = async () => {
    if (!selectedFloor) {
      setDesks([]);
      return;
    }
    const { data } = await deskApi.list({ floor: selectedFloor });
    setDesks(data.data);
  };

  useEffect(() => {
    officeApi.list().then(({ data }) => setOffices(data.data));
    employeeApi.list().then(({ data }) => setEmployees(data.data));
    loadFloors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDesks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor]);

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await floorApi.create(floorForm);
      setFloorModalOpen(false);
      setFloorForm(emptyFloorForm);
      await loadFloors();
      setSelectedFloor(data.data._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create floor');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDesk = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await deskApi.create({
        floor: selectedFloor,
        deskCode: deskForm.deskCode,
        position: { x: Number(deskForm.x), y: Number(deskForm.y) },
      });
      setDeskModalOpen(false);
      setDeskForm(emptyDeskForm);
      loadDesks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create desk');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (deskId, employeeId) => {
    setError('');
    try {
      if (employeeId) await deskApi.assign(deskId, employeeId);
      else await deskApi.unassign(deskId);
      loadDesks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update desk assignment');
    }
  };

  const handleDeleteDesk = async (deskId) => {
    if (!confirm('Delete this desk?')) return;
    await deskApi.remove(deskId);
    loadDesks();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Office setup</h1>
        <Button onClick={() => setFloorModalOpen(true)}>Add floor</Button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Set up floors and desks so the Workforce Command Center has a map to show.
      </p>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 max-w-xs">
        <Select
          label="Floor"
          placeholder="Select a floor"
          options={floors.map((f) => ({ value: f._id, label: `${f.office?.name} — ${f.name}` }))}
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
        />
      </div>

      {floors.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No floors yet" description="Add a floor to start placing desks." />
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Desks on this floor</p>
            <Button variant="ghost" onClick={() => setDeskModalOpen(true)}>
              Add desk
            </Button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {desks.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No desks on this floor" description="Add one to start assigning seats." />
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Desk</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Assigned to</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {desks.map((d) => (
                    <tr key={d._id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{d.deskCode}</td>
                      <td className="px-4 py-3 text-slate-500">
                        ({d.position.x}, {d.position.y})
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          placeholder="Unassigned"
                          options={employees.map((e) => ({ value: e._id, label: e.name }))}
                          value={d.assignedEmployee?._id || ''}
                          onChange={(e) => handleAssign(d._id, e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteDesk(d._id)} className="text-xs text-red-500 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Modal open={floorModalOpen} onClose={() => setFloorModalOpen(false)} title="Add floor">
        <form className="space-y-4" onSubmit={handleCreateFloor}>
          <Select
            label="Office"
            placeholder="Select an office"
            options={offices.map((o) => ({ value: o._id, label: o.name }))}
            value={floorForm.office}
            onChange={(e) => setFloorForm({ ...floorForm, office: e.target.value })}
            required
          />
          <TextField label="Name" value={floorForm.name} onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })} required />
          <div className="grid grid-cols-3 gap-3">
            <TextField
              label="Floor #"
              type="number"
              value={floorForm.floorNumber}
              onChange={(e) => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })}
            />
            <TextField
              label="Grid width"
              type="number"
              value={floorForm.gridWidth}
              onChange={(e) => setFloorForm({ ...floorForm, gridWidth: Number(e.target.value) })}
            />
            <TextField
              label="Grid height"
              type="number"
              value={floorForm.gridHeight}
              onChange={(e) => setFloorForm({ ...floorForm, gridHeight: Number(e.target.value) })}
            />
          </div>
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFloorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add floor
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deskModalOpen} onClose={() => setDeskModalOpen(false)} title="Add desk">
        <form className="space-y-4" onSubmit={handleCreateDesk}>
          <TextField label="Desk code" value={deskForm.deskCode} onChange={(e) => setDeskForm({ ...deskForm, deskCode: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="X position" type="number" min="0" value={deskForm.x} onChange={(e) => setDeskForm({ ...deskForm, x: e.target.value })} required />
            <TextField label="Y position" type="number" min="0" value={deskForm.y} onChange={(e) => setDeskForm({ ...deskForm, y: e.target.value })} required />
          </div>
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add desk
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
