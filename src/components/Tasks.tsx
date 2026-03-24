'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, RefreshCw,
  Plus, X, ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';

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
    api.getLeads(token, {}).then(d => setLeads(d.leads)).catch(console.error);
    api.getUsers(token).then(setUsers).catch(console.error);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: any = { title: form.title, priority: form.priority, assignedToId: form.assignedToId };
      if (form.description) data.description = form.description;
      if (form.dueAt) data.dueAt = new Date(form.dueAt).toISOString();
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
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
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
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Link to Lead</label>
              <select className="form-select" value={form.leadId} onChange={e => setForm({ ...form, leadId: e.target.value })}>
                <option value="">None</option>
                {leads.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
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

export default function Tasks({ token, userId }: { token: string; userId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (filter === 'open') params.status = 'OPEN';
      if (filter === 'completed') params.status = 'COMPLETED';
      const data = await api.getTasks(token, params);
      setTasks(data.tasks);
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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000);

  const overdue = tasks.filter(t => t.status !== 'COMPLETED' && t.dueAt && new Date(t.dueAt) < todayStart);
  const dueToday = tasks.filter(t => t.status !== 'COMPLETED' && t.dueAt && new Date(t.dueAt) >= todayStart && new Date(t.dueAt) < tomorrowEnd);
  const upcoming = tasks.filter(t => t.status !== 'COMPLETED' && (!t.dueAt || new Date(t.dueAt) >= tomorrowEnd));
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
              group.tasks.map(task => (
                <div key={task.id} className={`task-card ${group.key === 'overdue' ? 'overdue' : ''} ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn-icon" onClick={() => handleComplete(task.id)} disabled={task.status === 'COMPLETED'}>
                      {task.status === 'COMPLETED' ? <CheckCircle2 size={20} color="var(--accent-green)" /> : <Circle size={20} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none', color: task.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 4 }}>
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                        {task.dueAt && <span><Clock size={11} /> {new Date(task.dueAt).toLocaleDateString()}</span>}
                        {task.lead && <span style={{ color: 'var(--accent-blue)' }}>{task.lead.firstName} {task.lead.lastName}</span>}
                        {task.assignedTo && <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        );
      })}

      {showCreateModal && (
        <CreateTaskModal token={token} userId={userId} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); loadTasks(); }} />
      )}
    </div>
  );
}
