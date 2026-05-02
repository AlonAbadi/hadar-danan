'use client';

import { useState } from 'react';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, EmptyState } from '@/components/admin/ui';

export default function LeadsClient({ initialLeads, quizData }: { initialLeads: any; quizData: any }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { leads, total } = initialLeads;

  const filteredLeads = leads.filter((l: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!l.name?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q) && !l.phone?.includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && l.funnel_stage !== statusFilter) return false;
    return true;
  });

  const stageLabels: Record<string, string> = {
    lead: 'נרשם',
    engaged: 'מעורב',
    high_intent: 'כוונה גבוהה',
    buyer: 'רוכש',
    booked: 'פגישה',
  };

  const stageVariants: Record<string, any> = {
    lead: 'default',
    engaged: 'info',
    high_intent: 'warning',
    buyer: 'success',
    booked: 'gold',
  };

  // Quiz distribution
  const quizDist = quizData.distribution;
  const quizTotal = Object.values(quizDist).reduce((s: number, v: any) => s + v, 0) as number;

  return (
    <div>
      <PageHeader
        title="לידים ואנשי קשר"
        titleEn="Leads & CRM"
        subtitle={`${total.toLocaleString()} לידים במערכת`}
      />

      <KpiGrid cols={5}>
        {Object.entries(stageLabels).map(([stage, label]) => {
          const count = leads.filter((l: any) => l.funnel_stage === stage).length;
          return (
            <KpiCard
              key={stage}
              label={label}
              value={count}
              variant={stageVariants[stage]}
            />
          );
        })}
      </KpiGrid>

      {/* Search & filters */}
      <SectionCard
        title="רשימת לידים"
        titleEn="Leads List"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{total} סה״כ</span>
          </div>
        }
        noPadding
      >
        {/* Search bar */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
              fontFamily: "'Assistant', sans-serif",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              fontSize: '13px',
              outline: 'none',
              fontFamily: "'Assistant', sans-serif",
            }}
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(stageLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { key: 'name', label: 'שם', width: '18%' },
            { key: 'email', label: 'אימייל', width: '22%' },
            { key: 'phone', label: 'טלפון', width: '12%' },
            { key: 'status', label: 'סטטוס', align: 'center' },
            { key: 'score', label: 'ציון', align: 'center' },
            { key: 'source', label: 'מקור', align: 'center' },
            { key: 'created', label: 'נרשם', align: 'center' },
          ]}
          rows={filteredLeads.map((l: any) => ({
            name: <span style={{ fontWeight: 500, color: '#111827' }}>{l.name || '-'}</span>,
            email: <span style={{ fontSize: '12px', color: '#6b7280', direction: 'ltr', display: 'inline-block' }}>{l.email}</span>,
            phone: l.phone || '-',
            status: <Badge variant={stageVariants[l.funnel_stage] || 'default'}>{stageLabels[l.funnel_stage] || l.funnel_stage}</Badge>,
            score: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ fontWeight: 500, fontFamily: 'system-ui', fontSize: '13px', color: l.lead_score >= 70 ? '#16a34a' : l.lead_score >= 40 ? '#ca8a04' : '#9ca3af' }}>
                  {l.lead_score || 0}
                </span>
                <PercentBar value={l.lead_score || 0} height={4} color={l.lead_score >= 70 ? '#16a34a' : l.lead_score >= 40 ? '#eab308' : '#d1d5db'} />
              </div>
            ),
            source: <span style={{ fontSize: '11px', color: '#9ca3af' }}>{l.source || l.utm_source || 'direct'}</span>,
            created: <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(l.created_at).toLocaleDateString('he-IL')}</span>,
          }))}
          emptyMessage="לא נמצאו לידים"
        />

      </SectionCard>

      {/* Quiz distribution */}
      <SectionCard title="התפלגות קוויז" titleEn="Quiz Distribution">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(quizDist)
            .sort(([, a]: any, [, b]: any) => b - a)
            .map(([product, count]: [string, any]) => {
              const pct = quizTotal > 0 ? Math.round((count / quizTotal) * 100) : 0;
              return (
                <div key={product}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{product}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'system-ui' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <PercentBar value={pct} color="#c9a84c" />
                </div>
              );
            })}
        </div>
      </SectionCard>
    </div>
  );
}
