import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Summit Wheels</h2>
          <span>Analytics Dashboard</span>
        </div>

        <nav>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Users
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/revenue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Revenue
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Reports
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Settings
              </NavLink>
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>{title}</h1>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}
