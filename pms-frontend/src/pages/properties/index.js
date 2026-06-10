import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Building2, MapPin, ArrowRight, Calendar, Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import propertyService from '../../api/propertyService';
import { Modal, EmptyState, ErrorState, PageLoader, FormField, Spinner } from '../../components/ui';
import { format } from 'date-fns';

// ── Shared Property Form Fields ───────────────────────────────────────────────
function PropertyFormFields({ form, setForm, loading, error }) {
  return (
    <>
      {error && (
        <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}
      <FormField label="Property Name">
        <input
          className="input"
          placeholder="e.g. Sunrise Apartments"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          disabled={loading}
        />
      </FormField>
      <FormField label="Address">
        <input
          className="input"
          placeholder="e.g. 123 Main Street, City, State"
          value={form.location}
          onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          disabled={loading}
        />
      </FormField>
    </>
  );
}

// ── Add Property Modal ────────────────────────────────────────────────────────
function AddPropertyModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await propertyService.create(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Property" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PropertyFormFields form={form} setForm={setForm} loading={loading} error={error} />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? <><Spinner size={14} /> Creating…</> : 'Create Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Property Modal ───────────────────────────────────────────────────────
function EditPropertyModal({ property, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: property.name, location: property.location });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await propertyService.update(property.id, form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to update property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Property" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PropertyFormFields form={form} setForm={setForm} loading={loading} error={error} />
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

// ── Delete Property Modal ─────────────────────────────────────────────────────
function DeletePropertyModal({ property, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await propertyService.delete(property.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Delete Property" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete{' '}
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{property.name}</span>?
          This will also delete all units and leases associated with it. This action cannot be undone.
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
            {loading ? <><Spinner size={14} /> Deleting…</> : 'Delete Property'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onClick, onEdit, onDelete }) {
  const createdAt = property.created_at
    ? format(new Date(property.created_at), 'MMM d, yyyy')
    : '—';

  return (
    <div
      className="card card-hover cursor-pointer transition-all duration-200 p-5 flex flex-col gap-4"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(61,92,255,0.1)', color: 'var(--brand-500)' }}
        >
          <Building2 size={20} />
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="btn-icon"
            title="Edit property"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="btn-icon"
            title="Delete property"
            style={{ color: 'var(--red-500, #ef4444)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          {property.name}
        </h3>
        <p className="flex items-center gap-1 text-sm mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
          <MapPin size={12} className="flex-shrink-0" />
          {property.location}
        </p>
      </div>

      <div
        className="flex items-center gap-1.5 text-xs pt-3"
        style={{ borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)' }}
      >
        <Calendar size={11} />
        Added {createdAt}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [deleteProperty, setDeleteProperty] = useState(null);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await propertyService.getAll();
      setProperties(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-center justify-between">
          <div />
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Property
          </button>
        </div>

        {loading && <PageLoader />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && properties.length === 0 && (
          <EmptyState
            title="No properties yet"
            description="Add your first property to get started."
            action={
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add Property
              </button>
            }
          />
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onClick={() => router.push(`/properties/${p.id}/units`)}
                onEdit={() => setEditProperty(p)}
                onDelete={() => setDeleteProperty(p)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={load}
        />
      )}

      {editProperty && (
        <EditPropertyModal
          property={editProperty}
          onClose={() => setEditProperty(null)}
          onSuccess={load}
        />
      )}

      {deleteProperty && (
        <DeletePropertyModal
          property={deleteProperty}
          onClose={() => setDeleteProperty(null)}
          onSuccess={load}
        />
      )}
    </ProtectedRoute>
  );
}