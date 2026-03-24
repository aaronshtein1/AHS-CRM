'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, X, RefreshCw, Shield, Clock, Search
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
      setUsers(await api.getUsers(token));
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
            {users.map(u => (
              <tr key={u.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role.replace(/_/g, ' ')}</span></td>
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
            ))}
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
      </div>

      {tab === 'users' && <UserManagement token={token} />}
      {tab === 'processes' && <ProcessTemplates token={token} />}
    </div>
  );
}
