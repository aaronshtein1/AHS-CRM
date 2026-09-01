'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, RefreshCw, Shield, TrendingUp, Edit3
} from 'lucide-react';
import { api } from '@/lib/api';

function UserManagement({ token, currentUser }: { token: string; currentUser: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'REP', department: '' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', role: 'REP', department: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const isAdmin = (currentUser?.role || 'ADMIN').toUpperCase() === 'ADMIN';

  const loadUsers = async () => {
    try {
      const res = await api.getUsers(token);
      setUsers(Array.isArray(res) ? res : (res?.users || []));
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert('Only administrators can add new team members.');
    setSaving(true);
    try {
      await api.createUser(token, form);
      setShowCreate(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'REP', department: '' });
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (u: any) => {
    if (!isAdmin) return;
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName || u.name?.split(' ')[0] || '',
      lastName: u.lastName || u.name?.split(' ')[1] || '',
      email: u.email || '',
      role: u.role || 'REP',
      department: u.department || '',
      isActive: u.isActive !== undefined ? u.isActive : true
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isAdmin) return;
    setSaving(true);
    try {
      await api.updateUser(token, editingUser.id, editForm);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!isAdmin) return;
    try {
      await api.updateUser(token, userId, { isActive: !isActive });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>Team Members</h3>
          {!isAdmin && <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Read-only view (Admin access required to modify user roles and settings)</p>}
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(!showCreate); setEditingUser(null); }}>
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      {showCreate && isAdmin && (
        <motion.div className="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: 16, background: 'var(--surface-raised)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Create New Team Member</h4>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="INTAKE_SPECIALIST">Intake Specialist</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="REP">Rep</option>
                  <option value="MARKETER">Marketer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</button>
            </div>
          </form>
        </motion.div>
      )}

      {editingUser && isAdmin && (
        <motion.div className="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: 16, background: 'var(--surface-raised)', borderLeft: '4px solid var(--accent-blue)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Edit Team Member Details</h4>
          <form onSubmit={handleSaveEdit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" required value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" required value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="INTAKE_SPECIALIST">Intake Specialist</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="REP">Rep</option>
                  <option value="MARKETER">Marketer</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select className="form-select" value={editForm.isActive ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save User Edits'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(users) ? users : []).map(u => {
              const roleClass = (u.role || 'REP').toLowerCase();
              return (
                <tr key={u.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{u.firstName || u.name?.split(' ')[0]} {u.lastName || u.name?.split(' ')[1]}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                  <td><span className={`role-badge role-${roleClass}`}>{(u.role || 'REP').replace(/_/g, ' ')}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                  <td>
                    {isAdmin ? (
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        style={{ fontSize: 11 }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    ) : (
                      <span className={`status-badge ${u.isActive ? 'status-active' : 'status-unqualified'}`} style={{ fontSize: 11 }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartEdit(u)}
                        style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && !loading && <div className="empty-state"><p>No users found</p></div>}
      </div>
    </div>
  );
}

function ProcessTemplates({ token }: { token: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTemplates(token)
      .then(res => setTemplates(Array.isArray(res) ? res : (res?.templates || [])))
      .catch(err => {
        console.error(err);
        setTemplates([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /></div>;

  const safeTemplates = Array.isArray(templates) ? templates : [];

  return (
    <div>
      <h3 className="section-title" style={{ marginBottom: 16 }}>Approved Process Templates</h3>
      {safeTemplates.map(t => (
        <motion.div key={t.id} className="card" style={{ marginBottom: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color || 'var(--accent-blue)' }} />
            <h4 style={{ margin: 0 }}>{t.name}</h4>
            <span className="status-badge" style={{ fontSize: 11 }}>{t.category}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 12px 0', fontSize: 13 }}>{t.description}</p>
          <div className="stepper" style={{ gap: 4 }}>
            {(t.stages || []).map((s: any, i: number) => (
              <div key={s.id || i} className="stepper-step" style={{ padding: '6px 0' }}>
                <div className="stepper-indicator"><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</span></div>
                <div className="stepper-label" style={{ fontSize: 12 }}>{s.name}{s.dueDays ? ` (${s.dueDays}d SLA)` : ''}</div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
      {safeTemplates.length === 0 && !loading && <div className="empty-state"><p>No process templates found</p></div>}
    </div>
  );
}

function RiskWeightsManagement({ token }: { token: string }) {
  const [weights, setWeights] = useState({
    ageWeight: 0.5,
    overdueTaskWeight: 15,
    missingDemoWeight: 10,
    farFutureCheckbackWeight: 15,
    inactiveWeight: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSetting(token, 'risk_weights')
      .then(res => {
        const val = res?.value || res;
        if (val) {
          setWeights({
            ageWeight: val.ageWeight !== undefined ? val.ageWeight : 0.5,
            overdueTaskWeight: val.overdueTaskWeight !== undefined ? val.overdueTaskWeight : 15,
            missingDemoWeight: val.missingDemoWeight !== undefined ? val.missingDemoWeight : 10,
            farFutureCheckbackWeight: val.farFutureCheckbackWeight !== undefined ? val.farFutureCheckbackWeight : 15,
            inactiveWeight: val.inactiveWeight !== undefined ? val.inactiveWeight : 20
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveSetting(token, 'risk_weights', weights);
      alert('Risk weights saved successfully!');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="card" style={{ maxWidth: 600, padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>Escalation &amp; Risk Weights Configurator</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
        Configure the score points added to leads based on operational SLA and demographic checks. The final score (0-100) determines if a case is flagged for Watch (&ge;25), High Risk (&ge;50), or Executive Escalation (&ge;75).
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Lead Age Weight (Points/Day)</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{weights.ageWeight}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px 0' }}>Score increases by this amount daily since creation (capped at 30 points max)</p>
          <input type="range" min="0" max="5" step="0.1" style={{ width: '100%' }} value={weights.ageWeight} onChange={e => setWeights({ ...weights, ageWeight: parseFloat(e.target.value) })} />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Inactivity Penalty (No Update &gt; 7 Days)</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{weights.inactiveWeight} pts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px 0' }}>Penalty points if no timeline updates have been posted in the last 7 days</p>
          <input type="range" min="0" max="40" step="1" style={{ width: '100%' }} value={weights.inactiveWeight} onChange={e => setWeights({ ...weights, inactiveWeight: parseInt(e.target.value) })} />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Overdue Task Penalty</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{weights.overdueTaskWeight} pts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px 0' }}>Penalty points applied if a lead has any open tasks past their due date</p>
          <input type="range" min="0" max="40" step="1" style={{ width: '100%' }} value={weights.overdueTaskWeight} onChange={e => setWeights({ ...weights, overdueTaskWeight: parseInt(e.target.value) })} />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Missing Demographic Penalty (Per Field)</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{weights.missingDemoWeight} pts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px 0' }}>Points added per missing field (phone, email, county, payer, Medicaid ID) (capped at 30 points max)</p>
          <input type="range" min="0" max="25" step="1" style={{ width: '100%' }} value={weights.missingDemoWeight} onChange={e => setWeights({ ...weights, missingDemoWeight: parseInt(e.target.value) })} />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Far-Future Checkback Penalty</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{weights.farFutureCheckbackWeight} pts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 8px 0' }}>Penalty if checkback is set too far out for the current stage (&gt;7d for NEW, &gt;14d for CONTACTED)</p>
          <input type="range" min="0" max="40" step="1" style={{ width: '100%' }} value={weights.farFutureCheckbackWeight} onChange={e => setWeights({ ...weights, farFutureCheckbackWeight: parseInt(e.target.value) })} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving Weights...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DropdownManagement({ token, currentUser }: { token: string; currentUser: any }) {
  const [activeCategory, setActiveCategory] = useState<'referralSources' | 'serviceCoordinators' | 'insurancePlans'>('referralSources');
  const [lists, setLists] = useState<any>({
    referralSources: [],
    serviceCoordinators: [],
    insurancePlans: []
  });
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const isAdmin = (currentUser?.role || 'ADMIN').toUpperCase() === 'ADMIN';

  const loadLists = async () => {
    try {
      const data = await api.getDropdownLists(token);
      setLists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLists(); }, [token]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !isAdmin) return;
    const currentItems = [...(lists[activeCategory] || [])];
    if (currentItems.includes(newItem.trim())) return alert('Item already exists in list.');
    currentItems.unshift(newItem.trim());
    try {
      const updated = await api.updateDropdownList(token, activeCategory, currentItems);
      setLists(updated);
      setNewItem('');
    } catch (err: any) {
      alert(err.message || 'Failed to update dropdown list');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!isAdmin || !confirm('Are you sure you want to remove this option?')) return;
    const currentItems = [...(lists[activeCategory] || [])];
    currentItems.splice(index, 1);
    try {
      const updated = await api.updateDropdownList(token, activeCategory, currentItems);
      setLists(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async (index: number) => {
    if (!editValue.trim() || !isAdmin) return;
    const currentItems = [...(lists[activeCategory] || [])];
    currentItems[index] = editValue.trim();
    try {
      const updated = await api.updateDropdownList(token, activeCategory, currentItems);
      setLists(updated);
      setEditingIdx(null);
      setEditValue('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categoryLabels = {
    referralSources: 'Referral Sources (87 Extracted Options)',
    serviceCoordinators: 'Service Coordinators (21 Agencies)',
    insurancePlans: 'Insurance Plans & Payers (30 Options)'
  };

  const currentList: string[] = lists[activeCategory] || [];

  return (
    <div className="card" style={{ maxWidth: 800, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Dropdown List Manager</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0 0' }}>
            {isAdmin ? 'Manage options for Referral Sources, Service Coordinators, and Insurance Plans.' : 'Read-only view (Admin permissions required to modify options).'}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${activeCategory === 'referralSources' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('referralSources'); setEditingIdx(null); }}
        >
          Referral Sources ({lists.referralSources?.length || 0})
        </button>
        <button
          className={`tab ${activeCategory === 'serviceCoordinators' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('serviceCoordinators'); setEditingIdx(null); }}
        >
          Service Coordinators ({lists.serviceCoordinators?.length || 0})
        </button>
        <button
          className={`tab ${activeCategory === 'insurancePlans' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('insurancePlans'); setEditingIdx(null); }}
        >
          Insurance Plans ({lists.insurancePlans?.length || 0})
        </button>
      </div>

      {/* Add New Item Form */}
      {isAdmin && (
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            className="form-input"
            placeholder={`Add new ${activeCategory === 'referralSources' ? 'Referral Source' : activeCategory === 'serviceCoordinators' ? 'Service Coordinator Agency' : 'Insurance Plan'}...`}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!newItem.trim()}>
            <Plus size={14} /> Add Option
          </button>
        </form>
      )}

      {/* Options List */}
      <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading lists...</div>
        ) : currentList.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No options defined yet</div>
        ) : (
          currentList.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: idx < currentList.length - 1 ? '1px solid var(--border)' : 'none',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
              }}
            >
              {editingIdx === idx ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, marginRight: 12 }}>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(idx)}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingIdx(null)}>Cancel</button>
                </div>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item}</span>
              )}

              {isAdmin && editingIdx !== idx && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={() => { setEditingIdx(idx); setEditValue(item); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: 11, color: 'var(--accent-red)' }}
                    onClick={() => handleDeleteItem(idx)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Settings({ token, user }: { token: string; user: any }) {
  const [tab, setTab] = useState('users');
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole);
  const isAdmin = userRole === 'ADMIN';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Administration and configuration</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={14} /> Team
        </button>
        <button className={`tab ${tab === 'processes' ? 'active' : ''}`} onClick={() => setTab('processes')}>
          <Shield size={14} /> Processes
        </button>
        {isAdmin && (
          <button className={`tab ${tab === 'dropdowns' ? 'active' : ''}`} onClick={() => setTab('dropdowns')}>
            <Edit3 size={14} /> Dropdown Lists
          </button>
        )}
        {isAdminOrManager && (
          <button className={`tab ${tab === 'risk' ? 'active' : ''}`} onClick={() => setTab('risk')}>
            <TrendingUp size={14} /> Risk Weights
          </button>
        )}
      </div>

      {tab === 'users' && <UserManagement token={token} currentUser={user} />}
      {tab === 'processes' && <ProcessTemplates token={token} />}
      {tab === 'dropdowns' && isAdmin && <DropdownManagement token={token} currentUser={user} />}
      {tab === 'risk' && isAdminOrManager && <RiskWeightsManagement token={token} />}
    </div>
  );
}
