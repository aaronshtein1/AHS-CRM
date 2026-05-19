'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, MapPin, Building2, MessageSquare, ArrowRightCircle,
  RefreshCw, ChevronRight, CheckCircle2, Circle, Clock, Plus,
  Edit3, Save, X, PlayCircle, Shield, HeartPulse, FileText, Activity,
  Trophy, XCircle, AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';

const LOST_REASONS = [
  'No longer interested',
  'Chose a different agency',
  'Moved out of service area',
  'Medicaid ineligible',
  'Insurance does not cover services',
  'Hospitalized / entering facility',
  'Deceased',
  'Family decided against services',
  'Unable to reach after multiple attempts',
  'Financially ineligible (private pay declined)',
  'Duplicate / entered in error',
  'Other',
];


const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ATTEMPTING_CONTACT', 'CONTACTED', 'UNQUALIFIED'],
  ATTEMPTING_CONTACT: ['CONTACTED', 'UNQUALIFIED'],
  CONTACTED: ['QUALIFIED', 'UNQUALIFIED'],
  QUALIFIED: ['ACTIVE_PATIENT', 'UNQUALIFIED'],
  ACTIVE_PATIENT: ['ON_HOLD', 'DISCHARGED'],
  ON_HOLD: ['ACTIVE_PATIENT', 'DISCHARGED'],
  DISCHARGED: ['ACTIVE_PATIENT'],
  UNQUALIFIED: ['NEW'],
};

function EditableField({ label, value, field, onSave }: {
  label: string; value: string | number | null | undefined; field: string;
  onSave: (field: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));

  const handleSave = () => {
    onSave(field, editValue);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="editable-field editing">
        <span className="editable-label">{label}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="form-input form-input-sm" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
          <button className="btn-icon" onClick={handleSave}><Save size={14} /></button>
          <button className="btn-icon" onClick={() => setEditing(false)}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="editable-field" onClick={() => setEditing(true)}>
      <span className="editable-label">{label}</span>
      <span className="editable-value">{value || '—'} <Edit3 size={12} className="edit-icon" /></span>
    </div>
  );
}

function ProcessStepper({ instance, token, onRefresh }: { instance: any; token: string; onRefresh: () => void }) {
  const [advancing, setAdvancing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingOutcome, setClosingOutcome] = useState<'WON' | 'LOST' | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateValues, setDateValues] = useState<Record<string, string>>({});
  const [dateTarget, setDateTarget] = useState<'advance' | 'close-won' | 'close-lost' | null>(null);

  const activeStage = instance.stageInstances.find((si: any) => si.status === 'ACTIVE');
  const isOnFinalStage = activeStage?.stageTemplate?.isFinalStage === true;

  // Find the next stage and its collectDates definition
  const nextStage = !isOnFinalStage
    ? instance.stageInstances.find((si: any) => si.stageTemplate.order === (activeStage?.stageTemplate?.order || 0) + 1)
    : null;
  const nextCollectDates: any[] = (() => {
    try { return JSON.parse(nextStage?.stageTemplate?.collectDates || '[]'); } catch { return []; }
  })();
  const currentCollectDates: any[] = (() => {
    try { return JSON.parse(activeStage?.stageTemplate?.collectDates || '[]'); } catch { return []; }
  })();

  const handleAdvanceClick = () => {
    if (nextCollectDates.length > 0) {
      // Show date collection modal before advancing
      setDateValues({});
      setDateTarget('advance');
      setShowDateModal(true);
    } else {
      doAdvance({});
    }
  };

  const doAdvance = async (collectedDates: Record<string, string>) => {
    setAdvancing(true);
    try {
      await api.advanceProcess(token, instance.id, { collectedDates });
      setShowDateModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleCloseClick = (outcome: 'WON' | 'LOST') => {
    setClosingOutcome(outcome);
    setLostReason('');
    setCustomReason('');
    if (currentCollectDates.length > 0) {
      setDateValues({});
      setDateTarget(outcome === 'WON' ? 'close-won' : 'close-lost');
      setShowDateModal(true);
    } else {
      setShowCloseModal(true);
    }
  };

  const handleDateModalConfirm = () => {
    if (dateTarget === 'advance') {
      doAdvance(dateValues);
    } else {
      // Dates collected, now show the close modal
      setShowDateModal(false);
      setShowCloseModal(true);
    }
  };

  const handleClose = async () => {
    if (!closingOutcome) return;
    const reason = lostReason === 'Other' ? customReason : lostReason;
    if (closingOutcome === 'LOST' && !reason) return;
    setAdvancing(true);
    try {
      await api.closeProcess(token, instance.id, {
        outcome: closingOutcome,
        lostReason: closingOutcome === 'LOST' ? reason : undefined,
        collectedDates: dateValues,
      });
      setShowCloseModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  // For the date modal — determine which dates to collect
  const datesToCollect = dateTarget === 'advance' ? nextCollectDates : currentCollectDates;
  const requiredDatesFilled = datesToCollect
    .filter((d: any) => d.required)
    .every((d: any) => dateValues[d.key]);

  return (
    <div className="process-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700 }}>{instance.processTemplate.name}</h4>
          <span className={`status-badge status-${instance.status.toLowerCase()}`}>{instance.status}</span>
          {instance.outcome && (
            <span style={{ marginLeft: 8, fontWeight: 600, color: instance.outcome === 'WON' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {instance.outcome === 'WON' ? '✅ Won' : '❌ Lost'}
            </span>
          )}
        </div>
        {instance.status === 'ACTIVE' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {isOnFinalStage ? (
              <>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--accent-green)', color: '#fff', border: 'none' }}
                  onClick={() => handleCloseClick('WON')}
                >
                  <Trophy size={14} /> Close Won
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--accent-red)', color: '#fff', border: 'none' }}
                  onClick={() => handleCloseClick('LOST')}
                >
                  <XCircle size={14} /> Close Lost
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleAdvanceClick} disabled={advancing}>
                <ChevronRight size={14} /> {advancing ? 'Advancing...' : 'Advance Stage'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stepper">
        {instance.stageInstances.map((si: any, idx: number) => {
          const isCurrent = si.status === 'ACTIVE';
          const isCompleted = si.status === 'COMPLETED';
          return (
            <div key={si.id} className={`stepper-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="stepper-indicator">
                {isCompleted ? <CheckCircle2 size={18} /> : isCurrent ? <PlayCircle size={18} /> : <Circle size={14} />}
              </div>
              <div className="stepper-label">{si.stageTemplate.name}</div>
            </div>
          );
        })}
      </div>

      {/* Date Collection Modal */}
      <AnimatePresence>
        {showDateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}
            onClick={() => setShowDateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 28, maxWidth: 460, width: '90%'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Clock size={22} color="var(--accent-blue)" />
                <h3 style={{ margin: 0 }}>Schedule Key Dates</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
                Enter the scheduled dates for the next stage. Tasks will be auto-created from these dates.
              </p>
              {datesToCollect.map((dateDef: any) => (
                <div key={dateDef.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {dateDef.label} {dateDef.required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateValues[dateDef.key] || ''}
                    onChange={e => setDateValues(prev => ({ ...prev, [dateDef.key]: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDateModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDateModalConfirm}
                  disabled={!requiredDatesFilled || advancing}
                >
                  {advancing ? 'Processing...' : dateTarget === 'advance' ? 'Confirm & Advance' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}
            onClick={() => setShowCloseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 28, maxWidth: 420, width: '90%'
              }}
              onClick={e => e.stopPropagation()}
            >
              {closingOutcome === 'WON' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Trophy size={22} color="var(--accent-green)" />
                    <h3 style={{ margin: 0 }}>Close as Won</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                    Mark this process as successfully closed. The lead will be updated accordingly.
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCloseModal(false)}>Cancel</button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--accent-green)', color: '#fff', border: 'none' }}
                      onClick={handleClose} disabled={advancing}
                    >
                      {advancing ? 'Closing...' : 'Confirm — Close Won'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <AlertTriangle size={22} color="var(--accent-amber)" />
                    <h3 style={{ margin: 0 }}>Close as Lost</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Select the reason this lead did not convert:</p>
                  <select
                    className="form-input"
                    value={lostReason}
                    onChange={e => setLostReason(e.target.value)}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="">— Select a reason —</option>
                    {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {lostReason === 'Other' && (
                    <input
                      className="form-input"
                      placeholder="Describe the reason..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCloseModal(false)}>Cancel</button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--accent-red)', color: '#fff', border: 'none' }}
                      onClick={handleClose}
                      disabled={advancing || !lostReason || (lostReason === 'Other' && !customReason)}
                    >
                      {advancing ? 'Closing...' : 'Confirm — Close Lost'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function TaskCard({ task, token, onRefresh }: { task: any; token: string; onRefresh: () => void }) {
  const handleComplete = async () => {
    try {
      await api.updateTask(token, task.id, { status: 'COMPLETED' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED';

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''} ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn-icon" onClick={handleComplete} disabled={task.status === 'COMPLETED'}>
          {task.status === 'COMPLETED' ? <CheckCircle2 size={18} color="var(--accent-green)" /> : <Circle size={18} />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>{task.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
            {task.dueAt && <span className={isOverdue ? 'text-red' : ''}><Clock size={11} /> {new Date(task.dueAt).toLocaleDateString()}</span>}
            {task.assignedTo && <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetail({ token, leadId, onBack, user }: {
  token: string; leadId: string; onBack: () => void; user: any;
}) {
  const [lead, setLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('contact');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showStartProcess, setShowStartProcess] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');

  const loadLead = useCallback(async () => {
    try {
      const data = await api.getLead(token, leadId);
      setLead(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, leadId]);

  useEffect(() => { loadLead(); }, [loadLead]);

  const handleFieldSave = async (field: string, value: string) => {
    if (!lead) return;
    try {
      await api.updateLead(token, lead.id, { [field]: value });
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    // Intercept UNQUALIFIED — require lost reason first
    if (newStatus === 'UNQUALIFIED') {
      setPendingStatus('UNQUALIFIED');
      setLostReason('');
      setCustomLostReason('');
      return;
    }
    try {
      await api.updateLead(token, lead.id, { status: newStatus });
      loadLead();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmUnqualified = async () => {
    if (!lead) return;
    const reason = lostReason === 'Other' ? customLostReason : lostReason;
    if (!reason) return;
    try {
      await api.updateLead(token, lead.id, { status: 'UNQUALIFIED', lostReason: reason });
      setPendingStatus(null);
      setLostReason('');
      setCustomLostReason('');
      loadLead();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !lead) return;
    try {
      await api.createUpdate(token, { leadId: lead.id, content: comment });
      setComment('');
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartProcess = async (templateId: string) => {
    try {
      await api.startProcess(token, { leadId: lead.id, processTemplateId: templateId });
      setShowStartProcess(false);
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async () => {
    const title = prompt('Task title:');
    if (!title) return;
    try {
      await api.createTask(token, { leadId: lead.id, title, priority: 'NORMAL' });
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /><p>Loading...</p></div>;
  if (!lead) return <div className="empty-state"><p>Lead not found</p></div>;

  const allowedTransitions = VALID_TRANSITIONS[lead.status] || [];
  const tabs = [
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'medical', label: 'Medical', icon: HeartPulse },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: MessageSquare },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Unqualified / Lost Reason Modal */}
      <AnimatePresence>
        {pendingStatus === 'UNQUALIFIED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}
            onClick={() => setPendingStatus(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 28, maxWidth: 440, width: '90%'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={22} color="var(--accent-amber)" />
                <h3 style={{ margin: 0 }}>Mark as Unqualified</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Please select the reason this lead did not qualify:
              </p>
              <select
                className="form-input"
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                style={{ marginBottom: 12 }}
                id="lost-reason-select"
              >
                <option value="">— Select a reason —</option>
                {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {lostReason === 'Other' && (
                <input
                  className="form-input"
                  placeholder="Describe the reason..."
                  value={customLostReason}
                  onChange={e => setCustomLostReason(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPendingStatus(null)}>Cancel</button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--accent-red)', color: '#fff', border: 'none' }}
                  onClick={handleConfirmUnqualified}
                  disabled={!lostReason || (lostReason === 'Other' && !customLostReason)}
                  id="confirm-unqualified-btn"
                >
                  Confirm — Mark Unqualified
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lead-detail-header">
        <div>
          <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} id="lead-detail-back">
            ← Back
          </button>
          <h1 className="lead-detail-name">{lead.firstName} {lead.lastName}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`status-badge status-${lead.status.toLowerCase().replace(/_/g, '-')}`}>
              {lead.status.replace(/_/g, ' ')}
            </span>
            {lead.owner && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Assigned to {lead.owner.firstName} {lead.owner.lastName}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allowedTransitions.map(status => (
            <button
              key={status}
              className={`btn btn-sm ${status === 'UNQUALIFIED' || status === 'DISCHARGED' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleStatusChange(status)}
            >
              <ArrowRightCircle size={14} /> {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'contact' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Contact Information</h3>
            <EditableField label="Phone" value={lead.phone} field="phone" onSave={handleFieldSave} />
            <EditableField label="Secondary Phone" value={lead.phoneSecondary} field="phoneSecondary" onSave={handleFieldSave} />
            <EditableField label="Email" value={lead.email} field="email" onSave={handleFieldSave} />
            <EditableField label="Preferred Language" value={lead.preferredLanguage} field="preferredLanguage" onSave={handleFieldSave} />
          </div>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Address</h3>
            <EditableField label="Street" value={lead.addressStreet} field="addressStreet" onSave={handleFieldSave} />
            <EditableField label="City" value={lead.addressCity} field="addressCity" onSave={handleFieldSave} />
            <EditableField label="State" value={lead.addressState} field="addressState" onSave={handleFieldSave} />
            <EditableField label="ZIP" value={lead.addressZip} field="addressZip" onSave={handleFieldSave} />
            <EditableField label="County" value={lead.county} field="county" onSave={handleFieldSave} />
          </div>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Demographics</h3>
            <EditableField label="Date of Birth" value={lead.dateOfBirth} field="dateOfBirth" onSave={handleFieldSave} />
            <EditableField label="Gender" value={lead.gender} field="gender" onSave={handleFieldSave} />
          </div>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Intake Info</h3>
            <EditableField label="Source" value={lead.source?.replace(/_/g, ' ')} field="source" onSave={handleFieldSave} />
            <EditableField label="Service Type" value={lead.serviceType} field="serviceType" onSave={handleFieldSave} />
            <div className="editable-field">
              <span className="editable-label">Call Attempts</span>
              <span className="editable-value">{lead.totalCallAttempts}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Insurance Details</h3>
            <EditableField label="Payer Type" value={lead.payerType?.replace(/_/g, ' ')} field="payerType" onSave={handleFieldSave} />
            <EditableField label="Medicaid #" value={lead.medicaidNumber} field="medicaidNumber" onSave={handleFieldSave} />
            <EditableField label="Medicare #" value={lead.medicareNumber} field="medicareNumber" onSave={handleFieldSave} />
            <EditableField label="Insurance Company" value={lead.insuranceCompany} field="insuranceCompany" onSave={handleFieldSave} />
          </div>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Medical Information</h3>
            <EditableField label="Diagnosis" value={lead.diagnosis} field="diagnosis" onSave={handleFieldSave} />
            <EditableField label="Service Type" value={lead.serviceType} field="serviceType" onSave={handleFieldSave} />
            <EditableField label="Hours/Week" value={lead.currentHoursPerWeek} field="currentHoursPerWeek" onSave={handleFieldSave} />
            <EditableField label="SOC Date" value={lead.socDate} field="socDate" onSave={handleFieldSave} />
            <EditableField label="Caregiver Name" value={lead.caregiverName} field="caregiverName" onSave={handleFieldSave} />
          </div>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Notes</h3>
            <EditableField label="Notes" value={lead.notes} field="notes" onSave={handleFieldSave} />
            <EditableField label="Comments" value={lead.comments} field="comments" onSave={handleFieldSave} />
          </div>
        </div>
      )}

      {activeTab === 'processes' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Processes</h3>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              const t = await api.getTemplates(token);
              setTemplates(t);
              setShowStartProcess(true);
            }}>
              <Plus size={14} /> Start Process
            </button>
          </div>

          {showStartProcess && (
            <div className="card" style={{ background: 'var(--surface-raised)', marginBottom: 16, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Select a template:</h4>
              {templates.map((t: any) => (
                <button key={t.id} className="btn btn-secondary btn-sm" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => handleStartProcess(t.id)}>
                  <PlayCircle size={14} /> {t.name}
                </button>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowStartProcess(false)}>Cancel</button>
            </div>
          )}

          {(lead.processInstances || []).length === 0 && !showStartProcess && (
            <div className="empty-state"><p>No processes started yet</p></div>
          )}

          {(lead.processInstances || []).map((pi: any) => (
            <ProcessStepper key={pi.id} instance={pi} token={token} onRefresh={loadLead} />
          ))}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Tasks</h3>
            <button className="btn btn-primary btn-sm" onClick={handleCreateTask}>
              <Plus size={14} /> Add Task
            </button>
          </div>

          {(lead.tasks || []).length === 0 && (
            <div className="empty-state"><p>No tasks yet</p></div>
          )}

          {(lead.tasks || []).map((task: any) => (
            <TaskCard key={task.id} task={task} token={token} onRefresh={loadLead} />
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input
              className="form-input"
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              id="lead-comment-input"
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddComment} id="lead-comment-submit">
              <MessageSquare size={14} /> Add
            </button>
          </div>
          <div className="activity-feed">
            {(lead.updates || []).map((upd: any) => (
              <div className="activity-item" key={upd.id}>
                <div className={`activity-dot ${upd.type?.toLowerCase() || 'manual'}`} />
                <div className="activity-content">
                  <div className="activity-text">{upd.content}</div>
                  <div className="activity-meta">
                    {upd.createdBy ? `${upd.createdBy.firstName} ${upd.createdBy.lastName}` : 'System'}
                    {' · '}
                    {new Date(upd.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {(!lead.updates || lead.updates.length === 0) && (
              <div className="empty-state"><p>No activity yet</p></div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
