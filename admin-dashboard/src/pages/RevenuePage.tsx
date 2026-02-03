import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DashboardLayout from '../components/DashboardLayout';
import { fetchRevenueChart, fetchDashboardStats, ChartData, DashboardStats } from '../services/analytics';
import supabase from '../services/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RevenueTransaction {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  timestamp: string;
}

export default function RevenuePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartData | null>(null);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, chartData] = await Promise.all([
        fetchDashboardStats(),
        fetchRevenueChart(30),
      ]);
      setStats(statsData);
      setRevenueChart(chartData);

      // Fetch recent transactions
      const { data } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'purchase')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (data) {
        setTransactions(
          data.map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            productId: e.event_data?.productId || 'unknown',
            amount: e.event_data?.revenue || 0,
            timestamp: e.timestamp,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Revenue">
        <div className="loading">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Revenue">
      {/* Revenue Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Revenue</span>
          </div>
          <div className="stat-card-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Today's Revenue</span>
          </div>
          <div className="stat-card-value">{formatCurrency(stats?.revenueToday || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">ARPU</span>
          </div>
          <div className="stat-card-value">
            {formatCurrency(stats?.totalUsers ? stats.totalRevenue / stats.totalUsers : 0)}
          </div>
          <div className="stat-card-change">Average Revenue Per User</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Paying Users</span>
          </div>
          <div className="stat-card-value">{transactions.length > 0 ? 'Active' : '0'}</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Daily Revenue (Last 30 Days)</h3>
        </div>
        {revenueChart && (
          <Bar
            data={{
              labels: revenueChart.labels,
              datasets: [
                {
                  label: 'Revenue',
                  data: revenueChart.data,
                  backgroundColor: '#22c55e',
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { color: 'rgba(255,255,255,0.1)' },
                  ticks: { color: '#94a3b8' },
                },
                y: {
                  grid: { color: 'rgba(255,255,255,0.1)' },
                  ticks: {
                    color: '#94a3b8',
                    callback: (value) => '$' + value,
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        )}
      </div>

      {/* Recent Transactions */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Recent Transactions</h3>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User ID</th>
              <th>Product</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{formatDate(tx.timestamp)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {tx.userId.substring(0, 8)}...
                </td>
                <td>{tx.productId}</td>
                <td style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(tx.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions yet. Purchases will appear here once users make in-app purchases.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
