'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, RefreshCw, Plus, X, Edit3, Trash2
} from 'lucide-react';
import { api } from '@/lib/api';

function formatName(person: any): string {
  if (!person) return '—';
  if (typeof person === 'string') return person;
  if (person.firstName || person.lastName) {
    return `${person.firstName || ''} ${person.lastName || ''}`.trim();
  }
  if (person.name && typeof person.name === 'string') return person.name;
  return '—';
}

function CreateTaskModal({ token, userId, onClose, onCreated }: {
  token: string; userId: string; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'NORMAL', dueAt: '',
    assignedToId: userId, leadId: '',
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getLeads(token, {}).then(d => setLeads(d?.leads || [])).catch(console.error);
    api.getUsers(token).then(res => setUsers(Array.isArray(res) ? res : (res?.users || []))).catch(console.error);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedUser = users.find(u => u.id === form.assignedToId);
      const data: any = { 
        title: form.title, 
        priority: form.priority, 
        assignedTo: selectedUser ? { firstName: selectedUser.firstName, lastName: selectedUser.lastName } : undefined 
      };
      if (form.description) data.description = form.description;
      if (form.dueAt) data.dueAt = form.dueAt;
      if (form.leadId) data.leadId = form.leadId;
      await api.createTask(token, data);
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call patient to schedule CHA assessment" />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Details</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional task instructions..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{formatName(u)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Link to Lead</label>
              <select className="form-select" value={form.leadId} onChange={e => setForm({ ...form, leadId: e.target.value })}>
                <option value="">None</option>
                {leads.map((l: any) => (
                  <option key={l.id} value={l.id}>{formatName(l)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditTaskModal({ token, task, currentUser, onClose, onUpdated }: {
  token: string; task: any; currentUser?: any; onClose: () => void; onUpdated: () => void;
}) {
  const dueVal = task.dueAt || task.dueDate;
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'NORMAL',
    dueAt: dueVal && typeof dueVal === 'string' ? dueVal.split('T')[0] : '',
    status: task.status || 'OPEN'
  });
  const [saving, setSaving] = useState(false);

  const userRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const canDelete = ['ADMIN', 'MANAGER'].includes(userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTask(token, task.id, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueAt: form.dueAt ? form.dueAt : undefined,
        status: form.status
      });
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return alert('Only Managers and Admins are authorized to delete tasks.');
    if (!confirm('Are you sure you want to delete this task?')) return;
    setSaving(true);
    try {
      await api.deleteTask(token, task.id);
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Edit Task Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Task Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="OPEN">Open (Pending)</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 20 }}>
            {canDelete ? (
              <button type="button" className="btn btn-secondary" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={handleDelete} disabled={saving}>
                <Trash2 size={14} /> Delete
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Task Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function RescheduleTaskModal({ token, taskId, currentDue, onClose, onRescheduled }: {
  token: string; taskId: string; currentDue: string; onClose: () => void; onRescheduled: () => void;
}) {
  const [newDueAt, setNewDueAt] = useState(currentDue && typeof currentDue === 'string' ? currentDue.split('T')[0] : '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTask(token, taskId, {
        dueAt: newDueAt,
        rescheduleReason: reason
      });
      onRescheduled();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Reschedule Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Due Date *</label>
            <input className="form-input" type="date" required value={newDueAt} onChange={e => setNewDueAt(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Reschedule *</label>
            <textarea className="form-textarea" required value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this task date being adjusted?" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Reschedule Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Tasks({ token, userId, user, onSelectLead, defaultFilter }: { token: string; userId: string; user?: any; onSelectLead?: (id: string) => void; defaultFilter?: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(defaultFilter || 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [rescheduleTask, setRescheduleTask] = useState<any>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (filter === 'open') params.status = 'OPEN';
      if (filter === 'completed') params.status = 'COMPLETED';
      const data = await api.getTasks(token, params);
      setTasks(data?.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      await api.updateTask(token, taskId, { status: 'COMPLETED' });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (defaultFilter && defaultFilter !== filter) {
      setFilter(defaultFilter);
    }
  }, [defaultFilter]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000);

  const overdue = tasks.filter(t => t.status !== 'COMPLETED' && (t.dueAt || t.dueDate) && new Date(t.dueAt || t.dueDate) < todayStart);
  const dueToday = tasks.filter(t => t.status !== 'COMPLETED' && (t.dueAt || t.dueDate) && new Date(t.dueAt || t.dueDate) >= todayStart && new Date(t.dueAt || t.dueDate) < tomorrowEnd);
  const upcoming = tasks.filter(t => t.status !== 'COMPLETED' && (!(t.dueAt || t.dueDate) || new Date(t.dueAt || t.dueDate) >= tomorrowEnd));
  const completed = tasks.filter(t => t.status === 'COMPLETED');

  const groups = [
    { key: 'overdue', label: '⚠️ Overdue', tasks: overdue, color: 'var(--accent-red)' },
    { key: 'today', label: '📅 Due Today', tasks: dueToday, color: 'var(--accent-amber)' },
    { key: 'upcoming', label: '📋 Upcoming', tasks: upcoming, color: 'var(--accent-blue)' },
    { key: 'completed', label: '✅ Completed', tasks: completed, color: 'var(--accent-green)' },
  ];

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /><p>Loading tasks...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-description">{tasks.filter(t => t.status !== 'COMPLETED').length} open tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {groups.map(group => {
        if (group.tasks.length === 0 && group.key === 'completed') return null;
        return (
          <motion.div key={group.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: group.color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {group.label} ({group.tasks.length})
            </h3>
            {group.tasks.length === 0 ? (
              <div className="card" style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>None</div>
            ) : (
              group.tasks.map(task => {
                const priorityClass = (task.priority || 'NORMAL').toLowerCase();
                const dueDateVal = task.dueAt || task.dueDate;
                return (
                  <div key={task.id} className={`task-card ${group.key === 'overdue' ? 'overdue' : ''} ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button className="btn-icon" onClick={() => handleComplete(task.id)} disabled={task.status === 'COMPLETED'}>
                        {task.status === 'COMPLETED' ? <CheckCircle2 size={20} color="var(--accent-green)" /> : <Circle size={20} />}
                      </button>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditingTask(task)}>
                        <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none', color: task.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description}</div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 4 }}>
                          <span className={`priority-badge priority-${priorityClass}`}>{task.priority || 'NORMAL'}</span>
                          {dueDateVal && <span><Clock size={11} /> {new Date(dueDateVal).toLocaleDateString()}</span>}
                          {task.lead && (
                            <span 
                              style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); onSelectLead?.(task.lead.id || task.leadId); }}
                              className="hover-underline"
                            >
                              {formatName(task.lead)}
                            </span>
                          )}
                          {task.assignedTo && <span>{formatName(task.assignedTo)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => setEditingTask(task)} title="Edit Task Details">
                          <Edit3 size={16} />
                        </button>
                        {task.status !== 'COMPLETED' && (
                          <button className="btn-icon" onClick={() => setRescheduleTask(task)} title="Reschedule Task Date">
                            <Clock size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        );
      })}

      {showCreateModal && (
        <CreateTaskModal token={token} userId={userId} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); loadTasks(); }} />
      )}
      {editingTask && (
        <EditTaskModal token={token} task={editingTask} currentUser={user} onClose={() => setEditingTask(null)} onUpdated={() => { setEditingTask(null); loadTasks(); }} />
      )}
      {rescheduleTask && (
        <RescheduleTaskModal token={token} taskId={rescheduleTask.id} currentDue={rescheduleTask.dueAt || rescheduleTask.dueDate} onClose={() => setRescheduleTask(null)} onRescheduled={() => { setRescheduleTask(null); loadTasks(); }} />
      )}
    </div>
  );
}
