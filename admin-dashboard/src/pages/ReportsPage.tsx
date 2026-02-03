import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { generateInvestorReport } from '../services/analytics';
import supabase from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Report {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  shareToken: string | null;
  isPublic: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<'investor' | 'monthly' | 'custom'>('investor');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadReports();

    // Set default dates
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(
        data?.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          createdAt: r.created_at,
          shareToken: r.share_token,
          isPublic: r.is_public,
        })) || []
      );
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a report title');
      return;
    }

    setGenerating(true);
    try {
      const reportData = await generateInvestorReport(
        new Date(startDate),
        new Date(endDate)
      );

      // Save report to database
      const shareToken = Math.random().toString(36).substring(2, 15);
      const { error } = await supabase.from('reports').insert({
        title: reportTitle,
        type: reportType,
        data: reportData,
        created_by: user?.id,
        share_token: shareToken,
        is_public: false,
      });

      if (error) throw error;

      // Generate PDF
      generatePDF(reportData, reportTitle);

      setShowModal(false);
      setReportTitle('');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = (data: any, title: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(249, 115, 22);
    doc.setFontSize(24);
    doc.text('Summit Wheels', 20, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(title, 20, 35);

    // Report info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 25);
    doc.text(`Period: ${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`, pageWidth - 80, 35);

    let yPos = 55;

    // Key Metrics Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Key Metrics', 20, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', data.keyMetrics.totalUsers.toLocaleString()],
        ['Active Users (7d)', data.keyMetrics.activeUsers.toLocaleString()],
        ['Total Revenue', '$' + data.keyMetrics.totalRevenue.toFixed(2)],
        ['ARPU', '$' + data.keyMetrics.averageRevenuePerUser.toFixed(2)],
        ['Total Games Played', data.keyMetrics.totalGamesPlayed.toLocaleString()],
        ['Avg Sessions/User', data.keyMetrics.avgSessionsPerUser.toFixed(1)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Retention Section
    doc.setFontSize(16);
    doc.text('User Retention', 20, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Retention Period', 'Rate']],
      body: [
        ['Day 1 Retention', data.retention.day1 + '%'],
        ['Day 7 Retention', data.retention.day7 + '%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Platform Distribution
    doc.setFontSize(16);
    doc.text('Platform Distribution', 20, yPos);
    yPos += 10;

    const totalPlatform = data.platformDistribution.ios + data.platformDistribution.android;
    doc.autoTable({
      startY: yPos,
      head: [['Platform', 'Users', 'Percentage']],
      body: [
        ['iOS', data.platformDistribution.ios.toString(), totalPlatform > 0 ? ((data.platformDistribution.ios / totalPlatform) * 100).toFixed(1) + '%' : '0%'],
        ['Android', data.platformDistribution.android.toString(), totalPlatform > 0 ? ((data.platformDistribution.android / totalPlatform) * 100).toFixed(1) + '%' : '0%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Summit Wheels Analytics Report - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`summit-wheels-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      generatePDF(data.data, data.title);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
      if (error) throw error;
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/reports/shared/${shareToken}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout
      title="Reports"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Generate Report
        </button>
      }
    >
      {/* Report Cards */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : reports.length > 0 ? (
        reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-info">
              <h3>{report.title}</h3>
              <p>
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report •{' '}
                {formatDate(report.createdAt)}
              </p>
            </div>
            <div className="report-actions">
              <button className="btn btn-secondary" onClick={() => downloadReport(report.id)}>
                Download PDF
              </button>
              {report.shareToken && (
                <button className="btn btn-secondary" onClick={() => copyShareLink(report.shareToken!)}>
                  Copy Link
                </button>
              )}
              <button className="btn btn-danger" onClick={() => deleteReport(report.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ marginBottom: '8px' }}>No Reports Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Generate your first investor report to share with stakeholders.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Generate Report
          </button>
        </div>
      )}

      {/* Generate Report Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Generate Report</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Q1 2026 Investor Report"
              />
            </div>

            <div className="form-group">
              <label>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                }}
              >
                <option value="investor">Investor Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
