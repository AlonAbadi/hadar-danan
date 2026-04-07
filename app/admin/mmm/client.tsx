'use client';

import { useState } from 'react';
import { PageHeader, KpiGrid, KpiCard, SectionCard, Badge, PercentBar, EmptyState, ActionButton } from '@/components/admin/ui';

// MMM requires sufficient historical data. This page shows the framework
// and will activate once Meta/Google Ads APIs are connected + 12 weeks of data.

const CHANNELS = [
  { id: 'meta', name: 'Meta Ads', icon: '📘', color: '#3b82f6' },
  { id: 'google', name: 'Google Ads', icon: '🔍', color: '#22c55e' },
  { id: 'organic', name: 'Organic / SEO', icon: '🌱', color: '#a855f7' },
  { id: 'email', name: 'Email', icon: '📧', color: '#eab308' },
  { id: 'referral', name: 'Referral', icon: '🤝', color: '#ec4899' },
  { id: 'direct', name: 'Direct', icon: '🔗', color: '#6b7280' },
];

export default function MmmClient() {
  const [totalBudget, setTotalBudget] = useState(10000);
  const [allocations, setAllocations] = useState<Record<string, number>>({
    meta: 40,
    google: 25,
    organic: 15,
    email: 10,
    referral: 5,
    direct: 5,
  });

  const dataReady = false; // Will be true once APIs connected + sufficient data

  return (
    <div>
      <PageHeader
        title="מודל MMM"
        titleEn="Media Mix Modeling"
        subtitle="אופטימיזציית תקציב, השפעת ערוצים וניתוח רגרסיה"
      />

      {!dataReady && (
        <div style={{
          padding: '24px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2563eb', marginBottom: '8px' }}>
            🧠 מודל MMM - דורש הכנה
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
            כדי להפעיל את מודל ה-MMM צריך:<br />
            1. חיבור Meta Ads API (הוצאות + חשיפות לפי קמפיין)<br />
            2. חיבור Google Ads API (הוצאות + המרות)<br />
            3. לפחות 12 שבועות של נתונים היסטוריים<br />
            4. נתוני הכנסה מ-Supabase<br /><br />
            המודל מבוסס על מתודולוגיית Bayesian MMM (בהשראת Google Meridian / Meta Robyn) -
            מחשב את ההשפעה של כל ערוץ על ההכנסות, מזהה נקודות רוויה, ומייצר המלצות לחלוקת תקציב אופטימלית.
          </div>
        </div>
      )}

      {/* Budget Optimizer (interactive even before data is ready) */}
      <SectionCard title="סימולטור תקציב" titleEn="Budget Optimizer">
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
            תקציב חודשי כולל
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#c9a84c' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#c9a84c', fontFamily: 'system-ui', minWidth: '100px', textAlign: 'left' }}>
              ₪{totalBudget.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CHANNELS.map((ch) => {
            const pct = allocations[ch.id] || 0;
            const amount = Math.round(totalBudget * pct / 100);
            return (
              <div key={ch.id} style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 80px 80px',
                gap: '12px',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ch.icon}</span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{ch.name}</span>
                </div>
                <div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={pct}
                    onChange={(e) => {
                      setAllocations({ ...allocations, [ch.id]: Number(e.target.value) });
                    }}
                    style={{ width: '100%', accentColor: ch.color }}
                  />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: ch.color, textAlign: 'center', fontFamily: 'system-ui' }}>
                  {pct}%
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'left', fontFamily: 'system-ui' }}>
                  ₪{amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            סה״כ הקצאה: {Object.values(allocations).reduce((s, v) => s + v, 0)}%
          </span>
          <Badge variant={Object.values(allocations).reduce((s, v) => s + v, 0) === 100 ? 'success' : 'warning'}>
            {Object.values(allocations).reduce((s, v) => s + v, 0) === 100 ? 'מאוזן' : 'לא מאוזן'}
          </Badge>
        </div>
      </SectionCard>

      {/* Channel contribution - will show real data once MMM is trained */}
      <SectionCard title="תרומת ערוצים להכנסה (הערכה)" titleEn="Channel Contribution">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {CHANNELS.map((ch) => (
            <div key={ch.id} style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              borderRight: `3px solid ${ch.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span>{ch.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{ch.name}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                Marginal ROI
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
                {dataReady ? '-' : '?'}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                {dataReady ? 'מחושב מהמודל' : 'ממתין לנתונים'}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Methodology explanation */}
      <SectionCard title="מתודולוגיה" titleEn="Methodology">
        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
          <p>המודל משתמש בגישת <span dir="ltr" style={{ color: '#c9a84c' }}>Bayesian Marketing Mix Modeling</span> -
          רגרסיה סטטיסטית שמפרקת את ההכנסות לגורמים:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#c9a84c', marginBottom: '4px' }}>Adstock Decay</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                השפעה מצטברת של פרסום לאורך זמן - קליק היום משפיע גם מחר
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#c9a84c', marginBottom: '4px' }}>Saturation Curves</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                זיהוי נקודת הרוויה - מתי תוספת תקציב מפסיקה להחזיר ערך
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#c9a84c', marginBottom: '4px' }}>Seasonality</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                הפרדת אפקטי עונתיות מהשפעת השיווק
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#c9a84c', marginBottom: '4px' }}>Budget Optimizer</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                סולבר אופטימיזציה - מציע חלוקת תקציב למקסימום ROI
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
