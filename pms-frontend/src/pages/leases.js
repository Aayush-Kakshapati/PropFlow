import { useState, useEffect } from "react";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import ProtectedRoute from "../components/ProtectedRoute";
import { leaseService } from "../api/services";
import authService from "../api/authService";
import unitService from "../api/unitService";
import {
  Modal,
  EmptyState,
  ErrorState,
  PageLoader,
  Badge,
  FormField,
  Spinner,
  SkeletonRow,
} from "../components/ui";
import { format } from "date-fns";

function LeaseFormFields({ form, setForm, tenants, units, loading, error }) {
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const selectedUnit = units.find((u) => String(u.id) === String(form.unit));
  const isIndividual = selectedUnit?.unit_type === "individual";
  const maxTenants = isIndividual ? 1 : (selectedUnit?.capacity ?? 4);

  const handleUnitChange = (e) => {
    const newUnitId = e.target.value;
    const newUnit = units.find((u) => String(u.id) === String(newUnitId));
    const newMax = newUnit?.unit_type === "individual" ? 1 : 4;
    setForm((p) => ({
      ...p,
      unit: newUnitId,
      tenants: p.tenants.slice(0, newMax),
    }));
  };

  const handleTenantToggle = (tenantId) => {
    setForm((p) => {
      if (p.tenants.includes(tenantId)) {
        return { ...p, tenants: p.tenants.filter((id) => id !== tenantId) };
      }
      if (p.tenants.length >= maxTenants) return p; // silently block
      return { ...p, tenants: [...p.tenants, tenantId] };
    });
  };

  return (
    <>
      {error && (
        <div
          className="text-sm p-3 rounded-lg text-red-600"
          style={{
            background: "var(--red-50)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          {error}
        </div>
      )}

      <FormField label="Unit">
        <select
          className="input"
          value={form.unit}
          onChange={handleUnitChange}
          disabled={loading}
        >
          <option value="">Select unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.property ? ` (${u.property})` : ""}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={`Tenants (${form.tenants.length}/${maxTenants})`}>
        <div
          className="max-h-32 overflow-y-auto border rounded-lg p-2"
          style={{ borderColor: "var(--card-border)" }}
        >
          {tenants.map((t) => {
            const isChecked = form.tenants.includes(t.id);
            const isDisabled =
              loading || (!isChecked && form.tenants.length >= maxTenants);
            return (
              <label
                key={t.id}
                className="flex items-center gap-2 p-1 rounded"
                style={{
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.45 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTenantToggle(t.id)}
                  disabled={isDisabled}
                  className="rounded"
                />
                <span className="text-sm">{t.username}</span>
              </label>
            );
          })}
          {tenants.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              No available tenants
            </p>
          )}
        </div>
        {isIndividual ? (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Individual units can only have 1 tenant.
          </p>
        ) : (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Select up to 4 tenants.
          </p>
        )}
      </FormField>

      <FormField label="Monthly Rent ($)">
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          placeholder="1500.00"
          value={form.rent_amount}
          onChange={set("rent_amount")}
          disabled={loading}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date">
          <input
            className="input"
            type="date"
            value={form.start_date}
            onChange={set("start_date")}
            disabled={loading}
          />
        </FormField>
        <FormField label="End Date">
          <input
            className="input"
            type="date"
            value={form.end_date}
            onChange={set("end_date")}
            disabled={loading}
          />
        </FormField>
      </div>
    </>
  );
}

function AddLeaseModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tenants: [],
    unit: "",
    rent_amount: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [tenantsRes, unitsRes] = await Promise.all([
          authService.getTenants(),
          unitService.getAll(),
        ]);
        const tenantData = Array.isArray(tenantsRes.data)
          ? tenantsRes.data
          : tenantsRes.data.results || [];
        const unitData = Array.isArray(unitsRes.data)
          ? unitsRes.data
          : unitsRes.data.results || [];
        setTenants(tenantData);
        setUnits(unitData);
      } catch {
        setError("Failed to load tenants or units.");
      }
    };
    loadOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.unit ||
      !form.rent_amount ||
      !form.start_date ||
      !form.end_date ||
      form.tenants.length === 0
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.tenants.length > 4) {
      setError("Maximum 4 tenants allowed per unit.");
      return;
    }
    if (form.end_date < form.start_date) {
      setError("End Date cannot be less than Start Date");
      return;
    }
    setLoading(true);
    try {
      await leaseService.create({
        unit: Number(form.unit),
        rent_amount: parseFloat(form.rent_amount),
        start_date: form.start_date,
        end_date: form.end_date,
        tenant_ids: form.tenants.map(Number),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        "One or more tenants already have an overlapping lease on another unit.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Lease" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <LeaseFormFields
          form={form}
          setForm={setForm}
          tenants={tenants}
          units={units}
          loading={loading}
          error={error}
        />
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={14} /> Creating…
              </>
            ) : (
              "Create Lease"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditLeaseModal({ lease, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tenants: lease.tenants ? lease.tenants.map((t) => t.id) : [],
    unit: lease.unit ?? '',
    rent_amount: lease.rent_amount ?? '',
    start_date: lease.start_date ?? '',
    end_date: lease.end_date ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [tenantsRes, unitsRes] = await Promise.all([
          authService.getTenants(),
          unitService.getAll(),
        ]);

        const tenantData = Array.isArray(tenantsRes.data)
          ? tenantsRes.data
          : tenantsRes.data.results || [];

        const unitData = Array.isArray(unitsRes.data)
          ? unitsRes.data
          : unitsRes.data.results || [];

        setTenants(tenantData);
        setUnits(unitData);
      } catch {
        setError('Failed to load tenants or units.');
      }
    };

    loadOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.unit ||
      !form.rent_amount ||
      !form.start_date ||
      !form.end_date ||
      form.tenants.length === 0
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (form.tenants.length > 4) {
      setError('Maximum 4 tenants allowed per unit.');
      return;
    }

    if (form.end_date < form.start_date) {
      setError('End Date cannot be less than Start Date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await leaseService.update(lease.id, {
        unit: Number(form.unit),
        rent_amount: parseFloat(form.rent_amount),
        start_date: form.start_date,
        end_date: form.end_date,
        tenant_ids: form.tenants.map(Number),
      });

      onSuccess();
      onClose();
    } catch (err) {
      const d = err.response?.data;

      setError(
        d?.detail ||
        d?.non_field_errors?.[0] ||
        (typeof d === 'object'
          ? Object.values(d).flat().join(', ')
          : 'Failed to update lease.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Lease" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <LeaseFormFields
          form={form}
          setForm={setForm}
          tenants={tenants}
          units={units}
          loading={loading}
          error={error}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={14} /> Updating…
              </>
            ) : (
              'Update Lease'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLease, setEditLease] = useState(null);
  const [deleteLease, setDeleteLease] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await leaseService.getAll();
      setLeases(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Failed to load leases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (d) => {
    try {
      return d ? format(new Date(d), "MMM d, yyyy") : "—";
    } catch {
      return d || "—";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-center justify-between">
          <div />
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Create Lease
          </button>
        </div>

        {error && <ErrorState message={error} onRetry={load} />}

        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid var(--card-border)" }}
          >
            <FileText size={16} style={{ color: "var(--text-muted)" }} />
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              All Leases
            </p>
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "var(--page-bg)",
                color: "var(--text-muted)",
              }}
            >
              {leases.length}
            </span>
          </div>

          {loading ? (
            <table className="data-table">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={8} />
                ))}
              </tbody>
            </table>
          ) : leases.length === 0 ? (
            <EmptyState
              title="No leases yet"
              description="Create a lease to assign a tenant to a unit."
              action={
                <button
                  className="btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={14} /> Create Lease
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>Property</th>
                    <th>Rent/mo</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {l.tenants && l.tenants.length > 0 ? (
                            l.tenants.map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md text-xs font-medium"
                                style={{
                                  background: "var(--page-bg)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {t.username}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {l.unit_name || l.unit}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {l.property}
                      </td>
                      <td>
                        <span
                          className="font-mono text-sm font-medium"
                          style={{ color: "var(--green-600)" }}
                        >
                          ${Number(l.rent_amount).toLocaleString()}
                        </span>
                      </td>
                      <td
                        style={{ color: "var(--text-muted)", fontSize: "13px" }}
                      >
                        {fmtDate(l.start_date)}
                      </td>
                      <td
                        style={{ color: "var(--text-muted)", fontSize: "13px" }}
                      >
                        {fmtDate(l.end_date)}
                      </td>
                      <td>
                        <Badge
                          variant={l.is_active ? "active" : "inactive"}
                          label={l.is_active ? "Active" : "Inactive"}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditLease(l)}
                            className="btn-icon"
                            title="Edit lease"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteLease(l)}
                            className="btn-icon"
                            title="Delete lease"
                            style={{ color: "var(--red-500, #ef4444)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddLeaseModal
          onClose={() => setShowAddModal(false)}
          onSuccess={load}
        />
      )}

      {editLease && (
        <EditLeaseModal
          lease={editLease}
          onClose={() => setEditLease(null)}
          onSuccess={load}
        />
      )}

      {deleteLease && (
        <DeleteLeaseModal
          lease={deleteLease}
          onClose={() => setDeleteLease(null)}
          onSuccess={load}
        />
      )}
    </ProtectedRoute>
  );
}
