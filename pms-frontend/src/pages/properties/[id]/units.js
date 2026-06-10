import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Home, DollarSign, ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import unitService from '../../../api/unitService';
import propertyService from '../../../api/propertyService';
import { Modal, EmptyState, ErrorState, PageLoader, Badge, FormField, Spinner } from '../../../components/ui';

// ── Shared Unit Form Fields ───────────────────────────────────────────────────
function UnitFormFields({ form, setForm, loading, error }) {
  const handleUnitTypeChange = (e) => {
    const type = e.target.value;
    setForm(p => ({
      ...p,
      unit_type: type,
      capacity: type === 'individual' ? 1 : p.capacity,
    }));
  };

  return (
    <>
      {error && (
        <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}
      <FormField label="Unit Name / Number">
        <input
          className="input"
          placeholder="e.g. Unit 101, Apt A"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          disabled={loading}
        />
      </FormField>
      <FormField label="Monthly Rent ($)">
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 1500.00"
          value={form.rent_amount}
          onChange={e => setForm(p => ({ ...p, rent_amount: e.target.value }))}
          disabled={loading}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Unit Type">
          <select
            className="input"
            value={form.unit_type}
            onChange={handleUnitTypeChange}
            disabled={loading}
          >
            <option value="individual">Individual</option>
            <option value="shared">Shared</option>
          </select>
        </FormField>
        <FormField label="Capacity">
          <input
            className="input"
            type="number"
            min="1"
            max={form.unit_type === 'individual' ? 1 : 4}
            placeholder="1"
            value={form.capacity}
            onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
            disabled={loading || form.unit_type === 'individual'}
          />
        </FormField>
      </div>
      {form.unit_type === 'individual' ? (
        <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
          Individual units are limited to 1 tenant.
        </p>
      ) : (
        <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
          Shared units can have up to 4 tenants.
        </p>
      )}
    </>
  );
}

// ── Add Unit Modal ────────────────────────────────────────────────────────────
function AddUnitModal({ propertyId, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', rent_amount: '', unit_type: 'individual', capacity: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rent_amount) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await unitService.create({
        ...form,
        property: propertyId,
        rent_amount: parseFloat(form.rent_amount),
        capacity: parseInt(form.capacity, 10),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create unit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Unit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <UnitFormFields form={form} setForm={setForm} loading={loading} error={error} />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? <><Spinner size={14} /> Adding…</> : 'Add Unit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Unit Modal ───────────────────────────────────────────────────────────
function EditUnitModal({ unit, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: unit.name ?? '',
    rent_amount: unit.rent_amount ?? '',
    unit_type: unit.unit_type ?? 'individual',
    capacity: unit.capacity ?? 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rent_amount) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await unitService.update(unit.id, {
        ...form,
        rent_amount: parseFloat(form.rent_amount),
        capacity: parseInt(form.capacity, 10),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to update unit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Unit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <UnitFormFields form={form} setForm={setForm} loading={loading} error={error} />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? <><Spinner size={14} /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Unit Modal ─────────────────────────────────────────────────────────
function DeleteUnitModal({ unit, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await unitService.delete(unit.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete unit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Delete Unit" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete unit{' '}
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{unit.name}</span>?
          This will remove all associated leases and payments. This action cannot be undone.
        </p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-primary flex-1 justify-center"
            disabled={loading}
            style={{ background: 'var(--red-600, #dc2626)', borderColor: 'var(--red-600, #dc2626)' }}
          >
            {loading ? <><Spinner size={14} /> Deleting…</> : 'Delete Unit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Unit Card ─────────────────────────────────────────────────────────────────
function UnitCard({ unit, onEdit, onDelete }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: unit.status === 'occupied' ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)',
            color: unit.status === 'occupied' ? '#8b5cf6' : '#16a34a',
          }}
        >
          <Home size={20} />
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant={unit.status === 'occupied' ? 'occupied' : 'vacant'}
            label={unit.status === 'occupied' ? 'Occupied' : 'Vacant'}
          />
          <button
            onClick={onEdit}
            className="btn-icon"
            title="Edit unit"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="btn-icon"
            title="Delete unit"
            style={{ color: 'var(--red-500, #ef4444)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          {unit.name}
        </h3>
        <p className="flex items-center gap-1 text-sm mt-1 font-medium" style={{ color: 'var(--green-600)' }}>
          <DollarSign size={13} />
          {Number(unit.rent_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>
          {unit.unit_type} · {unit.current_occupancy}/{unit.capacity} occupied
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UnitsPage() {
  const router = useRouter();
  const { id: propertyId } = router.query;
  const [units, setUnits] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);

  const load = async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const [unitsRes, propsRes] = await Promise.all([
        unitService.getByProperty(propertyId),
        propertyService.getAll(),
      ]);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data.results || []);
      const allProps = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data.results || [];
      setProperty(allProps.find(p => String(p.id) === String(propertyId)) || null);
    } catch {
      setError('Failed to load units.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [propertyId]);

  const occupied = units.filter(u => u.status === 'occupied').length;

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/properties')}
              className="btn-secondary px-3 py-2"
            >
              <ChevronLeft size={15} />
            </button>
            {property && (
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{property.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {units.length} units · {occupied} occupied
                </p>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Unit
          </button>
        </div>

        {loading && <PageLoader />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && units.length === 0 && (
          <EmptyState
            title="No units yet"
            description="Add the first unit to this property."
            action={
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add Unit
              </button>
            }
          />
        )}

        {!loading && !error && units.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {units.map(u => (
              <UnitCard
                key={u.id}
                unit={u}
                onEdit={() => setEditUnit(u)}
                onDelete={() => setDeleteUnit(u)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddUnitModal
          propertyId={propertyId}
          onClose={() => setShowAddModal(false)}
          onSuccess={load}
        />
      )}

      {editUnit && (
        <EditUnitModal
          unit={editUnit}
          onClose={() => setEditUnit(null)}
          onSuccess={load}
        />
      )}

      {deleteUnit && (
        <DeleteUnitModal
          unit={deleteUnit}
          onClose={() => setDeleteUnit(null)}
          onSuccess={load}
        />
      )}
    </ProtectedRoute>
  );
}