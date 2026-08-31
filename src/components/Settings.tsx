'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, X, RefreshCw, Shield, Clock, Search, TrendingUp
} from 'lucide-react';
import { api } from '@/lib/api';

function UserManagement({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'REP', department: '' });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers(token);
      setUsers(Array.isArray(res) ? res : (res?.users || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleToggleActive = async (userId: string, isActive: boolean) => {
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
        <h3 className="section-title" style={{ margin: 0 }}>Team Members</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> Add User
        </button>
      </div>

      {showCreate && (
        <motion.div className="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: 16, background: 'var(--surface-raised)' }}>
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

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleClass = (u.role || 'REP').toLowerCase();
              return (
                <tr key={u.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{u.firstName || u.name?.split(' ')[0]} {u.lastName || u.name?.split(' ')[1]}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                  <td><span className={`role-badge role-${roleClass}`}>{(u.role || 'REP').replace(/_/g, ' ')}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      style={{ fontSize: 11 }}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcessTemplates({ token }: { token: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTemplates(token).then(setTemplates).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /></div>;

  return (
    <div>
      <h3 className="section-title" style={{ marginBottom: 16 }}>Process Templates</h3>
      {templates.map(t => (
        <motion.div key={t.id} className="card" style={{ marginBottom: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color }} />
            <h4 style={{ margin: 0 }}>{t.name}</h4>
            <span className="status-badge" style={{ fontSize: 11 }}>{t.category}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 12px 0', fontSize: 13 }}>{t.description}</p>
          <div className="stepper" style={{ gap: 4 }}>
            {(t.stages || []).map((s: any, i: number) => (
              <div key={s.id} className="stepper-step" style={{ padding: '6px 0' }}>
                <div className="stepper-indicator"><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</span></div>
                <div className="stepper-label" style={{ fontSize: 12 }}>{s.name}{s.dueDays ? ` (${s.dueDays}d)` : ''}</div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
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
        if (res && res.value) {
          setWeights({
            ageWeight: res.value.ageWeight !== undefined ? res.value.ageWeight : 0.5,
            overdueTaskWeight: res.value.overdueTaskWeight !== undefined ? res.value.overdueTaskWeight : 15,
            missingDemoWeight: res.value.missingDemoWeight !== undefined ? res.value.missingDemoWeight : 10,
            farFutureCheckbackWeight: res.value.farFutureCheckbackWeight !== undefined ? res.value.farFutureCheckbackWeight : 15,
            inactiveWeight: res.value.inactiveWeight !== undefined ? res.value.inactiveWeight : 20
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

export default function Settings({ token, user }: { token: string; user: any }) {
  const [tab, setTab] = useState('users');

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
        {user?.role === 'ADMIN' && (
          <button className={`tab ${tab === 'risk' ? 'active' : ''}`} onClick={() => setTab('risk')}>
            <TrendingUp size={14} /> Risk Weights
          </button>
        )}
      </div>

      {tab === 'users' && <UserManagement token={token} />}
      {tab === 'processes' && <ProcessTemplates token={token} />}
      {tab === 'risk' && user?.role === 'ADMIN' && <RiskWeightsManagement token={token} />}
    </div>
  );
}
