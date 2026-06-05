'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, CheckCircle2, Clock, Target, AlertTriangle,
  ArrowRightCircle, Activity, Phone, RefreshCw, CheckSquare, AlertOctagon,
  HeartPulse, TrendingUp
} from 'lucide-react';
import { api } from '@/lib/api';
import Tasks from '@/components/Tasks';

function KPICard({ label, value, target, color, icon: Icon, delay = 0, onClick }: {
  label: string; value: string | number; target?: string; color: string;
  icon: any; delay?: number; onClick?: () => void;
}) {
  return (
    <motion.div
      className={`kpi-card ${color} ${onClick ? 'clickable' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`kpi-icon ${color}`}>
        <Icon size={20} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {target && <div className="kpi-target">{target}</div>}
    </motion.div>
  );
}

export default function Dashboard({ token, user, onSelectLead, onNavigate }: { token: string, user: any, onSelectLead?: (id: string) => void, onNavigate?: (view: string, filter?: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([
          api.getStats(token),
          api.getRecentActivity(token),
        ]);
        setStats(s);
        setActivity(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /><p>Loading dashboard...</p></div>;
  if (!stats) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Key performance indicators and activity</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Leads" value={stats.counts.totalLeads} color="blue" icon={Users} delay={0} onClick={() => onNavigate?.('leads', '')} />
        <KPICard label="Active Patients" value={stats.counts.activePatients} color="cyan" icon={HeartPulse} delay={0.05} onClick={() => onNavigate?.('leads', 'ACTIVE_PATIENT')} />
        <KPICard label="New Today" value={stats.counts.newLeadsToday} color="green" icon={UserPlus} delay={0.1} onClick={() => onNavigate?.('leads', 'NEW')} />
        <KPICard label="Contact Compliance" value={`${stats.kpis.contactAttemptCompliance}%`} target="Target: ≥ 98%" color={stats.kpis.contactAttemptCompliance >= 98 ? 'green' : 'amber'} icon={CheckCircle2} delay={0.15} />
        <KPICard label="Stale New Leads" value={stats.kpis.staleNewLeads} target="Target: 0 (< 24h)" color={stats.kpis.staleNewLeads > 0 ? 'red' : 'green'} icon={Clock} delay={0.2} onClick={() => onNavigate?.('leads', 'NEW')} />
        <KPICard label="Qualification Rate" value={`${stats.kpis.qualificationRate}%`} target="Target: ≥ 90%" color="purple" icon={Target} delay={0.25} />
        <KPICard label="Open Tasks" value={stats.counts.openTasks} color={stats.counts.overdueTasks > 0 ? 'amber' : 'blue'} icon={CheckSquare} delay={0.3} onClick={() => document.getElementById('dashboard-tasks')?.scrollIntoView({ behavior: 'smooth' })} />
        <KPICard label="Overdue Tasks" value={stats.counts.overdueTasks} color={stats.counts.overdueTasks > 0 ? 'red' : 'green'} icon={AlertOctagon} delay={0.35} onClick={() => document.getElementById('dashboard-tasks')?.scrollIntoView({ behavior: 'smooth' })} />
        <KPICard label="Conversion Rate" value={`${stats.kpis.conversionRate}%`} color="green" icon={ArrowRightCircle} delay={0.4} />
        <KPICard label="Active Processes" value={stats.counts.activeProcesses} color="purple" icon={TrendingUp} delay={0.45} />
      </div>

      <div className="grid-2">
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="section-header">
            <h3 className="section-title">Lifecycle Pipeline Summary</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['NEW', 'ATTEMPTING_CONTACT', 'CONTACTED', 'QUALIFIED', 'ACTIVE_PATIENT', 'ON_HOLD', 'DISCHARGED', 'UNQUALIFIED'].map(status => {
              const count = stats.leadsByStatus?.[status] || 0;
              if (count === 0 && ['ON_HOLD', 'DISCHARGED', 'UNQUALIFIED'].includes(status)) return null;
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className={`status-badge status-${status.toLowerCase().replace(/_/g, '-')}`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="section-header">
            <h3 className="section-title">Recent Activity</h3>
          </div>
          <div className="activity-feed">
            {activity.map((item: any) => (
              <div className="activity-item" key={item.id}>
                <div className={`activity-dot ${item.type?.toLowerCase() || 'manual'}`} />
                <div className="activity-content">
                  <div className="activity-text">
                    {item.lead && (
                      <span 
                        style={{ color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => onSelectLead?.(item.lead.id)}
                        className="hover-underline"
                      >
                        {item.lead.firstName} {item.lead.lastName}:{' '}
                      </span>
                    )}
                    {item.content}
                  </div>
                  <div className="activity-meta">
                    {item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'System'}
                    {' · '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div className="empty-state"><p>No recent activity</p></div>}
          </div>
        </motion.div>
      </div>

      <div id="dashboard-tasks" style={{ marginTop: 32 }}>
        <Tasks token={token} userId={user.id} onSelectLead={onSelectLead} />
      </div>
    </div>
  );
}
