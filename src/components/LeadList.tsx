'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, RefreshCw, Phone } from 'lucide-react';
import { api } from '@/lib/api';

const ALL_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'ATTEMPTING_CONTACT', label: 'Attempting Contact' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'ACTIVE_PATIENT', label: 'Active Patient' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DISCHARGED', label: 'Discharged' },
  { value: 'UNQUALIFIED', label: 'Unqualified' },
];

function CreateLeadModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    source: 'PHONE_INQUIRY', serviceType: 'HHA/PCA', county: '', payerType: 'MEDICAID', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLead(token, form);
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
          <h2 className="modal-title" style={{ margin: 0 }}>New Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} id="create-lead-firstname" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} id="create-lead-lastname" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} id="create-lead-phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} id="create-lead-email" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} id="create-lead-source">
                <option value="PHONE_INQUIRY">Phone Inquiry</option>
                <option value="REFERRAL">Referral</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="MLTC">MLTC</option>
                <option value="SNF">SNF</option>
                <option value="PHYSICIAN">Physician</option>
                <option value="FAMILY">Family</option>
                <option value="SELF">Self</option>
                <option value="WEBSITE">Website</option>
                <option value="MARKETING_CAMPAIGN">Marketing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-select" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} id="create-lead-service">
                <option value="HHA/PCA">HHA / PCA</option>
                <option value="NHTD">NHTD</option>
                <option value="TBI">TBI</option>
                <option value="CHHA">CHHA</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">County</label>
              <select className="form-select" value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} id="create-lead-county">
                <option value="">Select County...</option>
                {['Albany', 'Allegany', 'Bronx', 'Broome', 'Cattaraugus', 'Cayuga', 'Chautauqua', 'Chemung', 'Chenango', 'Clinton', 'Columbia', 'Cortland', 'Delaware', 'Dutchess', 'Erie', 'Essex', 'Franklin', 'Fulton', 'Genesee', 'Greene', 'Hamilton', 'Herkimer', 'Jefferson', 'Kings', 'Lewis', 'Livingston', 'Madison', 'Monroe', 'Montgomery', 'Nassau', 'New York', 'Niagara', 'Oneida', 'Onondaga', 'Ontario', 'Orange', 'Orleans', 'Oswego', 'Otsego', 'Putnam', 'Queens', 'Rensselaer', 'Richmond', 'Rockland', 'Saratoga', 'Schenectady', 'Schoharie', 'Schuyler', 'Seneca', 'Steuben', 'Suffolk', 'Sullivan', 'Tioga', 'Tompkins', 'Ulster', 'Warren', 'Washington', 'Wayne', 'Westchester', 'Wyoming', 'Yates'].map(c => <option key={c} value={c.toUpperCase()}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payer Type</label>
              <select className="form-select" value={form.payerType} onChange={e => setForm({ ...form, payerType: e.target.value })} id="create-lead-payer">
                <option value="MEDICAID">Medicaid</option>
                <option value="MEDICARE">Medicare</option>
                <option value="MLTC">MLTC</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="PRIVATE_PAY">Private Pay</option>
                <option value="DUAL_ELIGIBLE">Dual Eligible</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." id="create-lead-notes" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="create-lead-submit">
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function LeadList({ token, onSelectLead }: { token: string; onSelectLead: (id: string) => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getLeads(token, params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Leads</h1>
          <p className="page-description">{total} total across all lifecycle stages</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="btn-new-lead">
          <Plus size={16} /> New Lead
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by name, email, phone, Medicaid #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
            id="lead-search"
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 200 }} id="lead-status-filter">
          {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Source</th>
              <th>Service</th>
              <th>County</th>
              <th>Calls</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} onClick={() => onSelectLead(lead.id)}>
                <td style={{ fontWeight: 600 }}>{lead.firstName} {lead.lastName}</td>
                <td>
                  <span className={`status-badge status-${lead.status.toLowerCase().replace(/_/g, '-')}`}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{lead.source?.replace(/_/g, ' ')}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{lead.serviceType || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{lead.county || '—'}</td>
                <td>{lead.totalCallAttempts}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && !loading && <div className="empty-state"><p>No leads found</p></div>}
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateLeadModal token={token} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); loadLeads(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
