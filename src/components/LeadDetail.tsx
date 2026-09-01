'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Stethoscope, GitPullRequest, CheckSquare, Clock,
  ArrowRightCircle, CheckCircle2, Circle, AlertTriangle, Plus,
  MessageSquare, RefreshCw, PlayCircle, XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import ICD10SearchInput from './ICD10SearchInput';

const LOST_REASONS = [
  'Patient Non-Responsive',
  'Ineligible for Medicaid/MLTC',
  'Selected Competitor Agency',
  'Moved Out of Service Area',
  'Patient Deceased',
  'Family Declined Services',
  'Other'
];

function EditableField({
  label, value, field, onSave, type = 'text', options
}: {
  label: string;
  value?: string;
  field: string;
  onSave: (field: string, value: string) => void;
  type?: string;
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  useEffect(() => { setVal(value || ''); }, [value]);

  const handleSave = () => {
    onSave(field, val);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="editable-field editing">
        <span className="editable-label">{label}</span>
        {options ? (
          <select className="form-select form-input-sm" value={val} onChange={e => setVal(e.target.value)}>
            <option value="">— Select —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            type={type}
            className="form-input form-input-sm"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        )}
        <button className="btn-icon" onClick={handleSave} title="Save"><CheckCircle2 size={16} color="var(--accent-green)" /></button>
        <button className="btn-icon" onClick={() => setEditing(false)} title="Cancel"><XCircle size={16} color="var(--accent-red)" /></button>
      </div>
    );
  }

  return (
    <div className="editable-field" onClick={() => setEditing(true)}>
      <span className="editable-label">{label}</span>
      <span className="editable-value">{value || <em style={{ color: 'var(--text-muted)' }}>Not set</em>}</span>
    </div>
  );
}

function ProcessStepper({ instance, token, onRefresh }: { instance: any; token: string; onRefresh: () => void }) {
  const [advancing, setAdvancing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [outcome, setOutcome] = useState<'WON' | 'LOST'>('WON');
  const [lostReason, setLostReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const activeStage = instance.stageInstances?.find((s: any) => s.status === 'ACTIVE');
  const isClosed = instance.status === 'CLOSED';

  // Determine if the NEXT stage requires a date prompt
  const getNextStageInfo = () => {
    const activeIdx = instance.stageInstances?.findIndex((s: any) => s.status === 'ACTIVE') ?? -1;
    if (activeIdx === -1 || activeIdx + 1 >= (instance.stageInstances?.length || 0)) return null;
    const nextStage = instance.stageInstances[activeIdx + 1];
    const tpl = nextStage?.stageTemplate || {};
    return {
      requiresDate: tpl.requiresDate || false,
      dateLabel: tpl.dateLabel || 'Scheduled Date',
      name: tpl.name || `Stage ${activeIdx + 2}`
    };
  };

  const handleAdvanceClick = () => {
    const nextInfo = getNextStageInfo();
    if (nextInfo && nextInfo.requiresDate) {
      setScheduledDate('');
      setShowDateModal(true);
    } else {
      doAdvance();
    }
  };

  const doAdvance = async (dateValue?: string) => {
    setAdvancing(true);
    try {
      const advanceData: any = {};
      if (dateValue) advanceData.scheduledDate = dateValue;
      await api.advanceProcess(token, instance.id, advanceData);
      setShowDateModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleDateSubmit = () => {
    if (!scheduledDate) return;
    doAdvance(scheduledDate);
  };

  const handleClose = async () => {
    setAdvancing(true);
    try {
      const finalReason = lostReason === 'Other' ? customReason : lostReason;
      await api.closeProcess(token, instance.id, { outcome, lostReason: finalReason });
      setShowCloseModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16, background: 'var(--surface-raised)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 16 }}>{instance.processTemplate?.name}</h4>
            <span className={`status-badge ${isClosed ? (instance.outcome === 'WON' ? 'status-qualified' : 'status-unqualified') : 'status-contacted'}`}>
              {isClosed ? `Closed ${instance.outcome}` : 'Active'}
            </span>
          </div>
          {instance.processTemplate?.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0 0' }}>{instance.processTemplate.description}</p>
          )}
        </div>
        {!isClosed && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleAdvanceClick} disabled={advancing}>
              <ArrowRightCircle size={14} /> {advancing ? 'Advancing...' : 'Advance Stage'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setOutcome('WON'); setShowCloseModal(true); }}>
              Close Won
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setOutcome('LOST'); setShowCloseModal(true); }}>
              Close Lost
            </button>
          </div>
        )}
      </div>

      {/* Stepper Visualization */}
      <div className="stepper">
        {(instance.stageInstances || []).map((si: any, idx: number) => {
          const isDone = si.status === 'COMPLETED';
          const isActive = si.status === 'ACTIVE';
          const isOverdue = si.dueAt && new Date(si.dueAt) < new Date() && !isDone;
          const isRRDC = si.stageTemplate?.name?.includes('RRDC') || si.stageTemplate?.name?.includes('RRDS');
          const hasDateFlag = si.stageTemplate?.requiresDate;

          return (
            <div key={si.id} className={`stepper-step ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="stepper-indicator" style={{
                backgroundColor: isDone ? 'var(--accent-green)' : isActive ? (isOverdue ? 'var(--accent-red)' : 'var(--accent-blue)') : 'var(--surface)',
                color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                borderColor: isOverdue ? 'var(--accent-red)' : undefined
              }}>
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <div className="stepper-label">
                <div style={{ fontWeight: isActive ? 700 : 500 }}>
                  {si.stageTemplate?.name}
                  {isRRDC && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 4px', borderRadius: 4, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 700 }}>RRDC 5d SLA</span>}
                  {hasDateFlag && !isDone && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 4px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>📅 Date Required</span>}
                </div>
                {isActive && si.scheduledDate && (
                  <div style={{ fontSize: 11, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    📅 Scheduled: {si.scheduledDate}
                  </div>
                )}
                {isActive && si.dueAt && (
                  <div style={{ fontSize: 11, color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={11} /> {isOverdue ? 'Overdue: ' : 'Due: '} {new Date(si.dueAt).toLocaleDateString()}
                  </div>
                )}
                {isDone && si.completedAt && (
                  <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 2 }}>
                    ✓ Completed {new Date(si.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assessment Date Collection Modal */}
      <AnimatePresence>
        {showDateModal && (() => {
          const nextInfo = getNextStageInfo();
          return (
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
                  borderRadius: 12, padding: 24, maxWidth: 440, width: '90%'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>📅</span>
                  <h3 style={{ margin: 0 }}>Schedule {nextInfo?.dateLabel || 'Assessment Date'}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
                  The next stage <strong>&quot;{nextInfo?.name}&quot;</strong> requires a scheduled date.
                  A <strong>prep task</strong> (1 day before) and a <strong>day-of reminder</strong> will be generated automatically.
                </p>
                <div className="form-group">
                  <label className="form-label">{nextInfo?.dateLabel || 'Scheduled Date'} *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowDateModal(false)}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleDateSubmit}
                    disabled={!scheduledDate || advancing}
                  >
                    {advancing ? 'Advancing...' : `Confirm & Advance Stage`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
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
                borderRadius: 12, padding: 24, maxWidth: 420, width: '90%'
              }}
              onClick={e => e.stopPropagation()}
            >
              {outcome === 'WON' ? (
                <>
                  <h3 style={{ margin: '0 0 12px 0' }}>Close Process as Won</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Confirm that all intake requirements are satisfied and caregiver Start of Care (SOC) is scheduled.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCloseModal(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleClose} disabled={advancing}>
                      {advancing ? 'Closing...' : 'Confirm — Close Won'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <AlertTriangle size={22} color="var(--accent-amber)" />
                    <h3 style={{ margin: 0 }}>Close Process as Lost</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Select the reason this process was discontinued:</p>
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
            {task.dueAt && <span className={isOverdue ? 'text-red' : ''}><Clock size={11} /> {new Date(task.dueAt).toLocaleDateString()}</span>}
            {task.assignedTo && <span>Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}</span>}
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
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [startProcessDate, setStartProcessDate] = useState('');
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');
  const [blockerType, setBlockerType] = useState('');
  const [blockerNotes, setBlockerNotes] = useState('');

  const [dropdownLists, setDropdownLists] = useState<any>({
    referralSources: [],
    serviceCoordinators: [],
    insurancePlans: [],
    serviceTypes: []
  });

  const loadLead = useCallback(async () => {
    try {
      const data = await api.getLead(token, leadId);
      setLead(data);
      const dl = await api.getDropdownLists(token);
      setDropdownLists(dl);
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
    if (newStatus === 'ON_HOLD') {
      setPendingStatus('ON_HOLD');
      return;
    }
    if (newStatus === 'UNQUALIFIED' || newStatus === 'DISCHARGED') {
      setPendingStatus(newStatus);
      return;
    }
    try {
      await api.updateLead(token, lead.id, { status: newStatus });
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOnHold = async () => {
    if (!blockerType) return;
    try {
      await api.updateLead(token, lead.id, {
        status: 'ON_HOLD',
        blockerType,
        blockerNotes: blockerNotes || null
      });
      setPendingStatus(null);
      setBlockerType('');
      setBlockerNotes('');
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmUnqualified = async () => {
    const finalReason = lostReason === 'Other' ? customLostReason : lostReason;
    if (!finalReason) return;
    try {
      await api.updateLead(token, lead.id, {
        status: pendingStatus || 'UNQUALIFIED',
        lostReason: finalReason,
        blockerType: 'UNQUALIFIED_DEAD_END',
        blockerNotes: `Marked ${pendingStatus || 'UNQUALIFIED'}: ${finalReason}`
      });
      setPendingStatus(null);
      setLostReason('');
      setCustomLostReason('');
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartProcess = async (templateId: string) => {
    // Check if stage 1 of this template requires a date
    const template = templates.find((t: any) => t.id === templateId);
    const stage1 = template?.stages?.[0];
    if (stage1?.requiresDate) {
      setPendingTemplateId(templateId);
      setStartProcessDate('');
      setShowStartProcess(false);
      setShowStartDateModal(true);
      return;
    }
    try {
      await api.startProcess(token, { leadId: lead.id, processTemplateId: templateId });
      setShowStartProcess(false);
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartProcessWithDate = async () => {
    if (!pendingTemplateId || !startProcessDate) return;
    try {
      await api.startProcess(token, { leadId: lead.id, processTemplateId: pendingTemplateId, scheduledDate: startProcessDate });
      setShowStartDateModal(false);
      setPendingTemplateId(null);
      setStartProcessDate('');
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

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.createUpdate(token, { leadId: lead.id, content: comment });
      setComment('');
      loadLead();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="empty-state" style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><RefreshCw className="animate-spin" /></div>;
  if (!lead) return <div className="empty-state"><p>Lead not found</p><button onClick={onBack} className="btn btn-secondary btn-sm">Back</button></div>;

  const allowedTransitions = ['ATTEMPTING_CONTACT', 'CONTACTED', 'QUALIFIED', 'ACTIVE_PATIENT', 'ON_HOLD', 'UNQUALIFIED']
    .filter(s => s !== lead.status);

  const tabs = [
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'medical', label: 'Medical', icon: Stethoscope },
    { id: 'processes', label: 'Processes', icon: GitPullRequest },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timeline', label: 'Timeline', icon: Clock }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Unqualified Modal */}
      <AnimatePresence>
        {(pendingStatus === 'UNQUALIFIED' || pendingStatus === 'DISCHARGED') && (
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
                <AlertTriangle size={22} color="var(--accent-red)" />
                <h3 style={{ margin: 0 }}>Mark Lead as {pendingStatus}</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: 13 }}>
                Specify the primary reason why this lead is being marked as {pendingStatus.toLowerCase()}:
              </p>
              <select
                className="form-select form-input"
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                style={{ width: '100%', marginBottom: 12 }}
                id="unqualified-reason-select"
              >
                <option value="">— Select Reason —</option>
                {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {lostReason === 'Other' && (
                <input
                  className="form-input"
                  placeholder="Describe reason..."
                  value={customLostReason}
                  onChange={e => setCustomLostReason(e.target.value)}
                  style={{ width: '100%', marginBottom: 16 }}
                />
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
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

      {/* On Hold Blocker Modal */}
      <AnimatePresence>
        {pendingStatus === 'ON_HOLD' && (
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
                <AlertTriangle size={22} color="var(--accent-red)" />
                <h3 style={{ margin: 0 }}>Place Case On Hold</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: 13 }}>
                Specify the primary blocker preventing this case from moving forward. Blocker reasons are mandatory.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blocker Type *</label>
                <select
                  className="form-select form-input"
                  value={blockerType}
                  onChange={e => setBlockerType(e.target.value)}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <option value="">— Select Blocker —</option>
                  <option value="MISSING_DOCS">Missing Documentation</option>
                  <option value="HOUSING_BARRIER">Housing Barrier</option>
                  <option value="INSURANCE_DELAY">Insurance Delay</option>
                  <option value="UNREACHABLE">Patient Unreachable</option>
                  <option value="CLINICAL_REVIEW">Clinical Review Delay</option>
                  <option value="OTHER">Other Blocker</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blocker Notes / Details</label>
                <textarea
                  className="form-input"
                  placeholder="Describe the current blocker details..."
                  value={blockerNotes}
                  onChange={e => setBlockerNotes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPendingStatus(null)}>Cancel</button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--accent-red)', color: '#fff', border: 'none' }}
                  onClick={handleConfirmOnHold}
                  disabled={!blockerType}
                >
                  Confirm — Set Hold
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
            <span className={`risk-badge risk-${lead.riskLevel?.toLowerCase() || 'normal'}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              backgroundColor: lead.riskLevel === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : lead.riskLevel === 'High' ? 'rgba(245, 158, 11, 0.15)' : lead.riskLevel === 'Watch' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: lead.riskLevel === 'Critical' ? 'var(--accent-red)' : lead.riskLevel === 'High' ? 'var(--accent-amber)' : lead.riskLevel === 'Watch' ? 'var(--accent-amber)' : 'var(--accent-green)',
              border: lead.riskLevel === 'Critical' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
            }}>
              Risk: {lead.riskLevel || 'Normal'} ({lead.riskScore || 0}%)
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

      {/* SLA COMPLIANCE WARN FEED */}
      {(lead.isCheckbackOverdue || lead.isCheckbackTooFar) && (
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: 12, marginBottom: 16 }}>
          <AlertTriangle size={18} color="var(--accent-red)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--accent-red)' }}>
            {lead.isCheckbackOverdue && <div><strong>SLA Warning:</strong> Checkback date is overdue. Please log contact activity and schedule a new checkback date.</div>}
            {lead.isCheckbackTooFar && <div><strong>SLA Warning:</strong> Checkback date is set too far in the future for the current lifecycle stage ({lead.status}). Update to a closer checkback date.</div>}
          </div>
        </div>
      )}

      {/* Mandatory Hold Blocker Notice */}
      {lead.status === 'ON_HOLD' && lead.blockerType && (
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: 12, marginBottom: 16 }}>
          <AlertTriangle size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            <strong>Case On Hold Blocker:</strong> {lead.blockerType.replace(/_/g, ' ')}
            {lead.blockerNotes && <span style={{ color: 'var(--text-muted)' }}> — {lead.blockerNotes}</span>}
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {(() => {
        const isWaiver = ['NHTD', 'TBI', 'NHTD & TBI'].includes(lead.serviceType);
        const sourceOptions = (dropdownLists.referralSources || []).map((s: string) => ({ value: s, label: s }));
        const scOptions = (dropdownLists.serviceCoordinators || []).map((sc: string) => ({ value: sc, label: sc }));
        const planOptions = (dropdownLists.insurancePlans || []).map((p: string) => ({ value: p, label: p }));

        return (
          <>
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
                  <EditableField 
                    label="County" 
                    value={lead.county} 
                    field="county" 
                    onSave={handleFieldSave}
                    options={['Albany', 'Allegany', 'Bronx', 'Broome', 'Cattaraugus', 'Cayuga', 'Chautauqua', 'Chemung', 'Chenango', 'Clinton', 'Columbia', 'Cortland', 'Delaware', 'Dutchess', 'Erie', 'Essex', 'Franklin', 'Fulton', 'Genesee', 'Greene', 'Hamilton', 'Herkimer', 'Jefferson', 'Kings', 'Lewis', 'Livingston', 'Madison', 'Monroe', 'Montgomery', 'Nassau', 'New York', 'Niagara', 'Oneida', 'Onondaga', 'Ontario', 'Orange', 'Orleans', 'Oswego', 'Otsego', 'Putnam', 'Queens', 'Rensselaer', 'Richmond', 'Rockland', 'Saratoga', 'Schenectady', 'Schoharie', 'Schuyler', 'Seneca', 'Steuben', 'Suffolk', 'Sullivan', 'Tioga', 'Tompkins', 'Ulster', 'Warren', 'Washington', 'Wayne', 'Westchester', 'Wyoming', 'Yates'].map(c => ({value: c.toUpperCase(), label: c}))}
                  />
                </div>
                <div className="card">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>Demographics</h3>
                  <EditableField label="Date of Birth" value={lead.dateOfBirth} field="dateOfBirth" onSave={handleFieldSave} />
                  <EditableField label="Gender" value={lead.gender} field="gender" onSave={handleFieldSave} />
                </div>
                <div className="card">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>Intake Info</h3>
                  <EditableField 
                    label="Referral Source" 
                    value={lead.source} 
                    field="source" 
                    onSave={handleFieldSave}
                    options={sourceOptions.length > 0 ? sourceOptions : undefined}
                  />
                  <EditableField 
                    label="Service Type" 
                    value={lead.serviceType} 
                    field="serviceType" 
                    onSave={handleFieldSave}
                    options={[
                      {value: 'HHA/PCA', label: 'HHA / PCA'},
                      {value: 'NHTD', label: 'NHTD Waiver'},
                      {value: 'TBI', label: 'TBI Waiver'},
                      {value: 'NHTD & TBI', label: 'NHTD & TBI Waiver'},
                      {value: 'CHHA', label: 'CHHA'},
                      {value: 'OTHER', label: 'Other'}
                    ]}
                  />
                  {/* Secondary Service Coordinator Dropdown for NHTD / TBI */}
                  {isWaiver && (
                    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>
                        WAIVER PROGRAM DETAILED INTAKE
                      </div>
                      <EditableField 
                        label="Service Coordinator Agency" 
                        value={lead.serviceCoordinator} 
                        field="serviceCoordinator" 
                        onSave={handleFieldSave}
                        options={scOptions}
                      />
                    </div>
                  )}
                  <div className="editable-field" style={{ marginTop: 8 }}>
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
                  {isWaiver ? (
                    <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-blue)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                        <span>🔒</span> Medicaid (Fee-for-Service) Required
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                        Waiver programs (NHTD / TBI) strictly require Fee-for-Service Medicaid. Payer type has been locked automatically.
                      </p>
                      <div style={{ marginTop: 12 }}>
                        <div className="editable-field">
                          <span className="editable-label">Payer Type</span>
                          <span className="editable-value" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Medicaid (Fee-for-Service)</span>
                        </div>
                        <div className="editable-field">
                          <span className="editable-label">Insurance Company</span>
                          <span className="editable-value" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Medicaid (Fee-for-Service)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <EditableField 
                        label="Payer Type" 
                        value={lead.payerType} 
                        field="payerType" 
                        onSave={handleFieldSave} 
                        options={planOptions}
                      />
                      <EditableField 
                        label="Insurance Company" 
                        value={lead.insuranceCompany} 
                        field="insuranceCompany" 
                        onSave={handleFieldSave} 
                        options={planOptions}
                      />
                    </>
                  )}
                  <EditableField label="Medicaid CIN #" value={lead.medicaidNumber} field="medicaidNumber" onSave={handleFieldSave} />
                  <EditableField label="Medicare #" value={lead.medicareNumber} field="medicareNumber" onSave={handleFieldSave} />
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className="grid-2">
                <div className="card">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>Medical &amp; Assessment Information</h3>
                  <ICD10SearchInput value={lead.diagnosis} onSave={handleFieldSave} />
                  <EditableField label="Community Health Assessment (CHA / UAS-NY) Date" value={lead.assessmentDate} field="assessmentDate" type="date" onSave={handleFieldSave} />
                  <EditableField label="Physician Medical Order (M11q) Date" value={lead.m11qDate} field="m11qDate" type="date" onSave={handleFieldSave} />
                  <EditableField label="SOC Date" value={lead.socDate} field="socDate" type="date" onSave={handleFieldSave} />
                  <EditableField label="Caregiver Name" value={lead.caregiverName} field="caregiverName" onSave={handleFieldSave} />
                  <EditableField label="Hours/Week" value={lead.currentHoursPerWeek} field="currentHoursPerWeek" onSave={handleFieldSave} />
                </div>
                <div className="card">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>Notes</h3>
                  <EditableField label="Notes" value={lead.notes} field="notes" onSave={handleFieldSave} />
                  <EditableField label="Comments" value={lead.comments} field="comments" onSave={handleFieldSave} />
                </div>
              </div>
            )}
          </>
        );
      })()}

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
              <h4 style={{ margin: '0 0 12px 0' }}>Select a process template:</h4>
              {templates.map((t: any) => (
                <button key={t.id} className="btn btn-secondary btn-sm" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => handleStartProcess(t.id)}>
                  <PlayCircle size={14} /> {t.name}
                </button>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowStartProcess(false)}>Cancel</button>
            </div>
          )}

          {/* Start Process Date Collection Modal */}
          <AnimatePresence>
            {showStartDateModal && (() => {
              const template = templates.find((t: any) => t.id === pendingTemplateId);
              const stage1 = template?.stages?.[0];
              const dateLabel = stage1?.dateLabel || 'Assessment Date';
              const stageName = stage1?.name || 'Stage 1';
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                  }}
                  onClick={() => setShowStartDateModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: 24, maxWidth: 440, width: '90%'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>📅</span>
                      <h3 style={{ margin: 0 }}>Schedule {dateLabel}</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 13 }}>
                      Starting <strong>&quot;{template?.name}&quot;</strong> — Stage 1: <strong>&quot;{stageName}&quot;</strong>
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
                      This stage requires a scheduled date. A <strong>prep task</strong> (1 day before) and a <strong>day-of reminder</strong> will be generated automatically.
                    </p>
                    <div className="form-group">
                      <label className="form-label">{dateLabel} *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={startProcessDate}
                        onChange={e => setStartProcessDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setShowStartDateModal(false); setPendingTemplateId(null); }}>Cancel</button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleStartProcessWithDate}
                        disabled={!startProcessDate}
                      >
                        Confirm &amp; Start Process
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

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
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
              <input
                className="form-input"
                placeholder="Add a comment or timeline note..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                id="lead-comment-input"
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddComment} id="lead-comment-submit">
                <MessageSquare size={14} /> Add
              </button>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  await api.syncRingCentral(token);
                  loadLead();
                } catch (err) {
                  console.error(err);
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
            >
              <RefreshCw size={14} /> Sync RingCentral (Calls &amp; SMS)
            </button>
          </div>
          <div className="activity-feed">
            {(lead.updates || []).map((upd: any) => {
              const isRingCentralCall = upd.type === 'RINGCENTRAL_CALL';
              const isRingCentralSms = upd.type === 'RINGCENTRAL_SMS';

              return (
                <div className="activity-item" key={upd.id} style={{
                  padding: 14, borderRadius: 8, marginBottom: 12,
                  border: isRingCentralCall ? '1px solid rgba(59, 130, 246, 0.2)' : isRingCentralSms ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)',
                  background: isRingCentralCall ? 'rgba(59, 130, 246, 0.03)' : isRingCentralSms ? 'rgba(16, 185, 129, 0.03)' : 'var(--surface)'
                }}>
                  <div className={`activity-dot ${upd.type?.toLowerCase() || 'manual'}`} />
                  <div className="activity-content">
                    <div className="activity-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 13 }}>
                      {upd.content}
                    </div>
                    <div className="activity-meta" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      {upd.createdBy ? `${upd.createdBy.firstName} ${upd.createdBy.lastName}` : 'System'}
                      {' · '}
                      {new Date(upd.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!lead.updates || lead.updates.length === 0) && (
              <div className="empty-state"><p>No timeline activity yet</p></div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
