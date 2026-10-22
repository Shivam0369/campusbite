'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAIInsightsPage() {
  const [query, setQuery] = useState('Summarize yesterday and this week operational performance');
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    'Summarize sales performance, AOV, and revenue trends',
    'Which dishes had the highest order volume this week?',
    'What is our cancellation rate and kitchen throughput status?',
    'Provide a catalog health check and sold-out items breakdown',
  ];

  const handleQuery = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.queryAI({ query: q, date_range: dateRange });
      if (res.success && res.data?.insights) {
        setInsights(res.data.insights);
      }
    } catch (err: any) {
      setError(err.message || 'AI Query failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-ai-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-brain"></i> AI Operations & Sales Insights
          </h1>
          <p className="admin-subheading">
            Applied AI Assistant grounded in PostgreSQL transactions and deterministic reporting tools
          </p>
        </div>

        <span className="badge-pill badge-ai-mode">
          <i className="fa-solid fa-circle-check"></i> Deterministic Grounding Active
        </span>
      </div>

      {/* Query Card */}
      <div className="admin-toolbar-card mt-3">
        <div className="form-group mb-3">
          <label className="form-label font-weight-bold">Ask an Operational Question</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Summarize sales trends, top dishes, or cancellation rate..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
            <button
              className="btn btn-accent"
              disabled={loading}
              onClick={() => handleQuery()}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Analyzing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Generate Insights
                </>
              )}
            </button>
          </div>
        </div>

        {/* Date Scope & Quick Questions */}
        <div className="ai-controls-row">
          <div className="scope-selector">
            <span className="small text-muted mr-2">Timeframe:</span>
            {['today', '7days', '30days', 'all'].map((dr) => (
              <button
                key={dr}
                className={`btn btn-xs mr-1 ${dateRange === dr ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setDateRange(dr)}
              >
                {dr === 'today' ? 'Today' : dr === '7days' ? 'Last 7 Days' : dr === '30days' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="sample-queries-box mt-2">
            <span className="small text-muted mr-2">Suggestions:</span>
            {sampleQuestions.map((sq, idx) => (
              <button
                key={idx}
                className="sample-query-pill"
                onClick={() => {
                  setQuery(sq);
                  handleQuery(sq);
                }}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {/* Insights Display */}
      {insights && (
        <div className="ai-insights-result-card mt-4">
          <div className="insights-result-header">
            <div className="insights-title-area">
              <span className="ai-sparkle-icon">
                <i className="fa-solid fa-sparkles"></i>
              </span>
              <h3>Executive Operations Summary</h3>
            </div>
            <span className="insights-timestamp text-muted small">
              Generated: {insights.generated_at}
            </span>
          </div>

          <div className="insights-summary-text mt-3">
            <p>{insights.summary}</p>
          </div>

          {/* Key Observations */}
          <div className="insights-section mt-4">
            <h4 className="insights-section-heading">
              <i className="fa-solid fa-magnifying-glass-chart"></i> Key Operational Observations
            </h4>
            <ul className="observations-list mt-2">
              {insights.key_observations?.map((obs: string, idx: number) => (
                <li key={idx} className="observation-item">
                  <i className="fa-solid fa-angle-right text-accent mr-2"></i>
                  {obs}
                </li>
              ))}
            </ul>
          </div>

          {/* Supporting Metrics Cards */}
          {insights.supporting_metrics?.sales_summary && (
            <div className="insights-metrics-grid mt-4">
              <div className="metric-chip">
                <span className="chip-label">Paid Revenue</span>
                <span className="chip-value">₹{insights.supporting_metrics.sales_summary.paid_revenue_inr.toFixed(2)}</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Total Orders</span>
                <span className="chip-value">{insights.supporting_metrics.sales_summary.total_orders}</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Avg Order Value</span>
                <span className="chip-value">₹{insights.supporting_metrics.sales_summary.average_order_value_inr.toFixed(2)}</span>
              </div>
              <div className="metric-chip">
                <span className="chip-label">Collected Orders</span>
                <span className="chip-value">{insights.supporting_metrics.sales_summary.completed_orders}</span>
              </div>
            </div>
          )}

          {/* Limitations & Policy Disclaimer */}
          <div className="ai-limitations-box mt-4">
            <h5>
              <i className="fa-solid fa-shield-halved"></i> Advisory Note & Data Grounding Policy
            </h5>
            <ul className="limitations-list">
              {insights.limitations?.map((lim: string, idx: number) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Follow-up Questions */}
          {insights.recommended_follow_up_questions?.length > 0 && (
            <div className="follow-up-section mt-4">
              <span className="small font-weight-bold text-muted">Recommended Follow-up Questions:</span>
              <div className="follow-up-pills mt-2">
                {insights.recommended_follow_up_questions.map((fq: string, idx: number) => (
                  <button
                    key={idx}
                    className="follow-up-pill"
                    onClick={() => {
                      setQuery(fq);
                      handleQuery(fq);
                    }}
                  >
                    <i className="fa-solid fa-arrow-turn-down-right"></i> {fq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

