#!/usr/bin/env node
// Contrast audit per WCAG 2.1 — checks all text/bg pairs touched in the readability sweep.

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function linearize(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const lFg = luminance(fg);
  const lBg = luminance(bg);
  const light = Math.max(lFg, lBg);
  const dark = Math.min(lFg, lBg);
  return (light + 0.05) / (dark + 0.05);
}

const PAIRS = [
  { label: 'heading (#EDE9E1) on bg (#0D1018)',           fg: '#EDE9E1', bg: '#0D1018', expected: 14.9 },
  { label: 'body (#CDD1DA) on bg (#0D1018)',              fg: '#CDD1DA', bg: '#0D1018', expected: 11.8 },
  { label: 'muted (#AAB0BD) on bg (#0D1018)',             fg: '#AAB0BD', bg: '#0D1018', expected: 8.3  },
  { label: 'gold-text (#E8B94A) on bg (#0D1018)',         fg: '#E8B94A', bg: '#0D1018', expected: 9.9  },
  { label: 'button text (#2a1d05) on button bg (#e8b942)', fg: '#2a1d05', bg: '#e8b942', expected: 14   },
  { label: 'muted (#AAB0BD) on card (#141820)',           fg: '#AAB0BD', bg: '#141820', expected: null },
  { label: 'body  (#CDD1DA) on card (#141820)',           fg: '#CDD1DA', bg: '#141820', expected: null },
  { label: 'gold-text (#E8B94A) on card (#141820)',       fg: '#E8B94A', bg: '#141820', expected: null },
];

const rows = PAIRS.map(p => {
  const r = contrast(p.fg, p.bg);
  return {
    label: p.label,
    ratio: r,
    aa: r >= 4.5,
    aaa: r >= 7,
    expected: p.expected,
  };
});

const colWidths = [
  Math.max(5, ...rows.map(r => r.label.length)),
  6,
  4,
  4,
];

function pad(s, w) {
  s = String(s);
  return s + ' '.repeat(Math.max(0, w - s.length));
}

console.log('# Contrast Audit (WCAG 2.1)');
console.log('');
console.log('| ' + pad('Pair', colWidths[0]) + ' | ' + pad('Ratio', colWidths[1]) + ' | ' + pad('AA', colWidths[2]) + ' | ' + pad('AAA', colWidths[3]) + ' |');
console.log('| ' + '-'.repeat(colWidths[0]) + ' | ' + '-'.repeat(colWidths[1]) + ' | ' + '-'.repeat(colWidths[2]) + ' | ' + '-'.repeat(colWidths[3]) + ' |');
for (const r of rows) {
  console.log(
    '| ' +
    pad(r.label, colWidths[0]) + ' | ' +
    pad(r.ratio.toFixed(2), colWidths[1]) + ' | ' +
    pad(r.aa ? 'PASS' : 'FAIL', colWidths[2]) + ' | ' +
    pad(r.aaa ? 'PASS' : 'FAIL', colWidths[3]) +
    ' |'
  );
}

const allAA = rows.every(r => r.aa);
const aaaCount = rows.filter(r => r.aaa).length;

console.log('');
console.log(`Summary: ${allAA ? 'all AA pass' : 'AA FAILURES present'}, ${aaaCount}/${rows.length} pairs reach AAA.`);

process.exit(allAA ? 0 : 1);
