import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { fetchUsers, UserStats } from '../services/analytics';

export default function UsersPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(page, 50);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toFixed(2);
  };

  return (
    <DashboardLayout title="Users">
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">All Users ({users.length})</h3>
          <button className="btn btn-secondary" onClick={loadUsers}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Platform</th>
                <th>Country</th>
                <th>First Seen</th>
                <th>Last Active</th>
                <th>Sessions</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {user.id.substring(0, 8)}...
                  </td>
                  <td>
                    <span className={`badge ${user.platform === 'ios' ? 'badge-info' : 'badge-success'}`}>
                      {user.platform.toUpperCase()}
                    </span>
                  </td>
                  <td>{user.country}</td>
                  <td>{formatDate(user.firstSeen)}</td>
                  <td>{formatDate(user.lastSeen)}</td>
                  <td>{user.totalSessions}</td>
                  <td>{formatCurrency(user.totalRevenue)}</td>
                  <td>
                    {user.isPremium ? (
                      <span className="badge badge-warning">Premium</span>
                    ) : (
                      <span className="badge">Free</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {users.length === 0 && !loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No users found. Users will appear here once analytics data is collected.
          </div>
        )}

        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>Page {page + 1}</span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(page + 1)}
            disabled={users.length < 50}
          >
            Next
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
