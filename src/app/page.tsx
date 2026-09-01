'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, GitBranch, Users, CheckSquare,
  TrendingUp, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import Pipeline from '@/components/Pipeline';
import LeadList from '@/components/LeadList';
import LeadDetail from '@/components/LeadDetail';
import Tasks from '@/components/Tasks';
import PerformanceReview from '@/components/PerformanceReview';
import Settings from '@/components/Settings';
import { api } from '@/lib/api';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [viewFilter, setViewFilter] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('intake_crm_token');
      const savedUserStr = localStorage.getItem('intake_crm_user');
      const savedView = localStorage.getItem('intake_crm_view');
      const savedLeadId = localStorage.getItem('intake_crm_lead_id');

      if (savedToken && savedUserStr) {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);

        api.me(savedToken).then(res => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('intake_crm_user', JSON.stringify(res.user));
          }
        }).catch(() => {});
      }

      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('lead/')) {
        const leadId = hash.replace('lead/', '');
        if (leadId && leadId !== 'undefined' && leadId !== 'null') {
          setSelectedLeadId(leadId);
          setView('lead-detail');
        } else {
          setView('leads');
        }
      } else if (hash && ['dashboard', 'pipeline', 'leads', 'tasks', 'performance', 'settings'].includes(hash)) {
        setView(hash);
      } else if (savedView && savedView !== 'lead-detail') {
        setView(savedView);
      } else if (savedView === 'lead-detail' && savedLeadId && savedLeadId !== 'undefined' && savedLeadId !== 'null') {
        setSelectedLeadId(savedLeadId);
        setView('lead-detail');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialized(true);
    }
  }, []);

  const handleLogin = (t: string, u: any) => {
    setToken(t);
    setUser(u);
    setView('dashboard');
    try {
      localStorage.setItem('intake_crm_token', t);
      localStorage.setItem('intake_crm_user', JSON.stringify(u));
      localStorage.setItem('intake_crm_view', 'dashboard');
      window.location.hash = 'dashboard';
    } catch {}
  };

  const handleLogout = () => {
    if (token) api.logout(token).catch(console.error);
    setToken(null);
    setUser(null);
    setView('dashboard');
    setSelectedLeadId(null);
    try {
      localStorage.removeItem('intake_crm_token');
      localStorage.removeItem('intake_crm_user');
      localStorage.removeItem('intake_crm_view');
      localStorage.removeItem('intake_crm_lead_id');
      window.location.hash = '';
    } catch {}
  };

  const handleSelectLead = (id: string) => {
    if (!id || id === 'undefined' || id === 'null') {
      console.warn('[handleSelectLead] Attempted to select invalid lead id:', id);
      setView('leads');
      window.location.hash = 'leads';
      return;
    }
    setSelectedLeadId(id);
    setView('lead-detail');
    try {
      localStorage.setItem('intake_crm_view', 'lead-detail');
      localStorage.setItem('intake_crm_lead_id', id);
      window.location.hash = `lead/${id}`;
    } catch {}
  };

  const handleNavigate = (targetView: string, targetFilter: string = '') => {
    setViewFilter(targetFilter);
    setView(targetView);
    if (targetView !== 'lead-detail') {
      setSelectedLeadId(null);
      try {
        localStorage.setItem('intake_crm_view', targetView);
        localStorage.removeItem('intake_crm_lead_id');
        window.location.hash = targetView;
      } catch {}
    }
  };

  if (!initialized) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : 'A');
  const lastName = user.lastName || (user.name ? user.name.split(' ')[1] || 'U' : 'U');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'leads', label: 'All Leads', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'performance', label: 'Performance', icon: TrendingUp, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, adminOnly: true },
  ];

  const visibleNav = navItems.filter(item =>
    !item.adminOnly || ['ADMIN', 'MANAGER'].includes(user.role)
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Intake CRM</div>
          <div className="sidebar-subtitle">Lead Lifecycle</div>
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id || (view === 'lead-detail' && item.id === 'leads') ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
              id={`nav-${item.id}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{firstName[0]}{lastName[0]}</div>
          <div className="user-info">
            <div className="user-name">{firstName} {lastName}</div>
            <div className="user-role">{(user.role || 'ADMIN').replace(/_/g, ' ')}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" id="btn-logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {view === 'dashboard' && <Dashboard token={token!} user={user} onSelectLead={handleSelectLead} onNavigate={handleNavigate} />}
        {view === 'pipeline' && <Pipeline token={token!} onSelectLead={handleSelectLead} />}
        {view === 'leads' && <LeadList token={token!} initialFilter={viewFilter} onSelectLead={handleSelectLead} />}
        {view === 'lead-detail' && (
          selectedLeadId && selectedLeadId !== 'undefined' && selectedLeadId !== 'null' ? (
            <LeadDetail token={token!} leadId={selectedLeadId} onBack={() => handleNavigate('leads')} user={user} />
          ) : (
            <LeadList token={token!} initialFilter="" onSelectLead={handleSelectLead} />
          )
        )}
        {view === 'tasks' && <Tasks token={token!} userId={user.id} user={user} onSelectLead={handleSelectLead} />}
        {view === 'performance' && <PerformanceReview token={token!} onSelectLead={handleSelectLead} />}
        {view === 'settings' && <Settings token={token!} user={user} />}
      </main>
    </div>
  );
}
