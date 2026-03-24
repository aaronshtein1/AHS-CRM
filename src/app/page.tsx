'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Dashboard from '@/components/Dashboard';
import Pipeline from '@/components/Pipeline';
import LeadList from '@/components/LeadList';
import LeadDetail from '@/components/LeadDetail';
import Tasks from '@/components/Tasks';
import Settings from '@/components/Settings';
import LoginScreen from '@/components/LoginScreen';
import {
  LayoutDashboard, GitBranch, Users, CheckSquare, Settings as SettingsIcon, LogOut
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [view, setView] = useState<string>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleLogin = (u: User, t: string) => {
    setUser(u);
    setToken(t);
  };

  const handleLogout = async () => {
    try { await api.logout(token); } catch {}
    setUser(null);
    setToken('');
    setView('dashboard');
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    setView('lead-detail');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'leads', label: 'All Leads', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
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
              onClick={() => { setView(item.id); setSelectedLeadId(null); }}
              id={`nav-${item.id}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user.firstName[0]}{user.lastName[0]}</div>
          <div className="user-info">
            <div className="user-name">{user.firstName} {user.lastName}</div>
            <div className="user-role">{user.role.replace(/_/g, ' ')}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" id="btn-logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {view === 'dashboard' && <Dashboard token={token} />}
        {view === 'pipeline' && <Pipeline token={token} onSelectLead={handleSelectLead} />}
        {view === 'leads' && <LeadList token={token} onSelectLead={handleSelectLead} />}
        {view === 'lead-detail' && selectedLeadId && (
          <LeadDetail token={token} leadId={selectedLeadId} onBack={() => setView('leads')} user={user} />
        )}
        {view === 'tasks' && <Tasks token={token} userId={user.id} />}
        {view === 'settings' && <Settings token={token} user={user} />}
      </main>
    </div>
  );
}
