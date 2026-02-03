import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import DashboardLayout from '../components/DashboardLayout';
import {
  fetchDashboardStats,
  fetchDAUChart,
  fetchRevenueChart,
  fetchPlatformDistribution,
  DashboardStats,
  ChartData,
} from '../services/analytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dauChart, setDauChart] = useState<ChartData | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartData | null>(null);
  const [platformDist, setPlatformDist] = useState<{ ios: number; android: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, dauData, revenueData, platformData] = await Promise.all([
        fetchDashboardStats(),
        fetchDAUChart(30),
        fetchRevenueChart(30),
        fetchPlatformDistribution(),
      ]);
      setStats(statsData);
      setDauChart(dauData);
      setRevenueChart(revenueData);
      setPlatformDist(platformData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="loading">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <button className="btn btn-secondary" onClick={loadData}>
          Refresh
        </button>
      }
    >
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Users</span>
          </div>
          <div className="stat-card-value">{formatNumber(stats?.totalUsers || 0)}</div>
          <div className="stat-card-change positive">
            +{stats?.newUsersToday || 0} today
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Users (7d)</span>
          </div>
          <div className="stat-card-value">{formatNumber(stats?.activeUsers || 0)}</div>
          <div className="stat-card-change">
            {stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Revenue</span>
          </div>
          <div className="stat-card-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
          <div className="stat-card-change positive">
            +{formatCurrency(stats?.revenueToday || 0)} today
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Games Played</span>
          </div>
          <div className="stat-card-value">{formatNumber(stats?.totalGamesPlayed || 0)}</div>
          <div className="stat-card-change">
            {formatNumber(stats?.totalSessions || 0)} sessions
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* DAU Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Daily Active Users</h3>
          </div>
          {dauChart && (
            <Line
              data={{
                labels: dauChart.labels,
                datasets: [
                  {
                    label: 'DAU',
                    data: dauChart.data,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    fill: true,
                    tension: 0.4,
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
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true,
                  },
                },
              }}
            />
          )}
        </div>

        {/* Platform Distribution */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Platform Distribution</h3>
          </div>
          {platformDist && (
            <Doughnut
              data={{
                labels: ['iOS', 'Android'],
                datasets: [
                  {
                    data: [platformDist.ios, platformDist.android],
                    backgroundColor: ['#3b82f6', '#22c55e'],
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#f1f5f9' },
                  },
                },
              }}
            />
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Revenue (Last 30 Days)</h3>
        </div>
        {revenueChart && (
          <Line
            data={{
              labels: revenueChart.labels,
              datasets: [
                {
                  label: 'Revenue',
                  data: revenueChart.data,
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  fill: true,
                  tension: 0.4,
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
    </DashboardLayout>
  );
}
