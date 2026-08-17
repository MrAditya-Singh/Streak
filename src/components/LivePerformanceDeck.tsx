import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, AlertTriangle, BarChart3, Code2, Lightbulb,
  Zap, Flame, Clock, Calendar, TrendingUp, CheckCircle2, Circle,
  Timer, X, Target, Rocket, Brain, Activity, Shield, BookOpen,
  Star, Trophy, GitBranch, Layers
} from 'lucide-react';
import { ActivityItem, EmergencyTask, UserProfile } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LivePerformanceDeckProps {
  user: UserProfile;
  activities: ActivityItem[];
  emergencyTasks: EmergencyTask[];
  matrixState: Record<string, boolean[]>;
  isDarkMode: boolean;
  onAddEmergencyTask?: (task: EmergencyTask) => void;
  onCompleteEmergencyTask?: (id: string) => void;
  onDeleteEmergencyTask?: (id: string) => void;
}

type Tab = 'emergency' | 'efficiency' | 'profiles' | 'improve';
type EffView = 'day' | 'month' | 'year';

// ─── Platform metadata with SVG logos ────────────────────────────────────────
const PLATFORMS = [
  {
    key: 'leetcode', label: 'LeetCode', usernameKey: 'leetcodeUsername',
    color: '#f89820', gradFrom: '#f89820', gradTo: '#e07a10',
    logo: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 2.328l.001.013c.213 1.163.88 2.293 1.955 3.21l.16.138c.5.443 1.07.847 1.694 1.2.63.36 1.327.669 2.09.927a13.448 13.448 0 0 0 2.457.523 16.617 16.617 0 0 0 2.718.073c.88-.041 1.714-.18 2.47-.413 1.522-.47 2.84-1.388 3.772-2.667 1.145-1.586 1.624-3.601 1.263-5.517l-.036-.188c-.11-.503-.3-.994-.565-1.455l-.015-.025-4.13-7.14A1.35 1.35 0 0 0 13.483 0z" fill="#f89820"/>
        <path d="M8.646 14.235l4.235-4.236a.735.735 0 0 1 1.04 1.04l-4.236 4.236a.735.735 0 0 1-1.04-1.04z" fill="#fff"/>
      </svg>
    ),
    bg: 'rgba(248,152,32,0.12)',
  },
  {
    key: 'codeforces', label: 'Codeforces', usernameKey: 'codeforcesHandle',
    color: '#1890ff', gradFrom: '#1890ff', gradTo: '#0070e0',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <rect x="1" y="9" width="5" height="14" rx="1.5" fill="#1890ff"/>
        <rect x="9" y="5" width="5" height="18" rx="1.5" fill="#f44336"/>
        <rect x="17" y="1" width="5" height="22" rx="1.5" fill="#1890ff"/>
      </svg>
    ),
    bg: 'rgba(24,144,255,0.12)',
  },
  {
    key: 'github', label: 'GitHub', usernameKey: 'githubUsername',
    color: '#6e40c9', gradFrom: '#8b5cf6', gradTo: '#6d28d9',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#8b5cf6">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    bg: 'rgba(139,92,246,0.12)',
  },
  {
    key: 'gfg', label: 'GeeksForGeeks', usernameKey: 'gfgUsername',
    color: '#2db940', gradFrom: '#2db940', gradTo: '#1a8a2e',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <path d="M21.45 14.315c-.143.28-.34.532-.58.733a2.834 2.834 0 0 1-1.755.594 2.747 2.747 0 0 1-1.355-.34 2.68 2.68 0 0 1-.927-.92L12 8.635l-4.833 5.747a2.713 2.713 0 0 1-2.282 1.26 2.84 2.84 0 0 1-1.755-.594 2.691 2.691 0 0 1-.58-.733c-.457-.944-.34-2.05.3-2.877L8.456 4.43A2.857 2.857 0 0 1 10.7 3.195h2.6a2.857 2.857 0 0 1 2.244 1.235l5.606 6.988c.64.826.757 1.933.3 2.877z" fill="#2db940"/>
      </svg>
    ),
    bg: 'rgba(45,185,64,0.12)',
  },
  {
    key: 'codechef', label: 'CodeChef', usernameKey: 'codechefUsername',
    color: '#b37144', gradFrom: '#b37144', gradTo: '#8a5530',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#b37144">
        <path d="M11.257.004C5.963-.138.012 5.97 0 11.195c-.01 4.6 3.89 10.098 7.638 11.176.356.103.72.054 1.03-.103l.08-.042a2.32 2.32 0 0 0 .36-.262c.667-.622.76-1.556.76-1.556l.034-.405c.063-.62.17-1.312.49-1.793.398-.6.956-.738 1.404-.738h.41c.448 0 1.006.138 1.404.738.32.48.427 1.172.49 1.793l.033.405s.094.934.76 1.556c.098.09.221.178.362.262l.08.042c.31.157.672.206 1.028.103C19.11 21.293 23.01 15.795 23 11.195 22.988 5.97 17.037-.138 11.743.004h-.486z"/>
      </svg>
    ),
    bg: 'rgba(179,113,68,0.12)',
  },
  {
    key: 'hackerrank', label: 'HackerRank', usernameKey: 'hackerrankUsername',
    color: '#00ea64', gradFrom: '#00ea64', gradTo: '#00b84e',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#00ea64">
        <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .642 1.114.642 11.886 0 13-.642 1.114-9.107 6-10.392 6-1.285 0-9.75-4.886-10.392-6C1.008 17.886 1.008 7.114 1.608 6 2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v1.906H9.963V7.057a.258.258 0 1 0-.516 0v9.886a.258.258 0 1 0 .516 0v-1.906h4.074v1.906a.258.258 0 1 0 .516 0V7.057a.258.258 0 0 0-.258-.258zm-.258 5.43H9.963v-2.458h4.074v2.458z"/>
      </svg>
    ),
    bg: 'rgba(0,234,100,0.12)',
  },
  {
    key: 'atcoder', label: 'AtCoder', usernameKey: 'atcoderUsername',
    color: '#888', gradFrom: '#aaa', gradTo: '#666',
    logo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <circle cx="12" cy="12" r="11" stroke="#888" strokeWidth="2"/>
        <text x="6" y="17" fontSize="12" fontWeight="bold" fill="#888">AC</text>
      </svg>
    ),
    bg: 'rgba(150,150,150,0.1)',
  },
];

// ─── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ deadlineAt }: { deadlineAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = deadlineAt - now;
  if (remaining <= 0) return <span style={{ color: '#f87171', fontWeight: 800, fontSize: 12 }}>EXPIRED</span>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const urgent = h < 6;
  return (
    <span style={{ color: urgent ? '#f87171' : '#fbbf24', fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ─── Animated half-circle gauge ───────────────────────────────────────────────
function HalfGauge({ pct, color, size = 100, label }: { pct: number; color: string; size?: number; label: string }) {
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.55;
  const len = Math.PI * r;
  const offset = len * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`} style={{ overflow: 'visible' }}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth={size * 0.085} strokeLinecap="round"/>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth={size * 0.085} strokeLinecap="round"
          strokeDasharray={`${len} ${len}`} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}80)` }}/>
        <text x={cx} y={cy - 3} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="900" fontFamily="system-ui">
          {Math.round(pct)}%
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(128,128,128,0.8)', marginTop: -4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

// ─── Sparkline bars ───────────────────────────────────────────────────────────
function SparkBars({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color,
          opacity: 0.3 + (v / max) * 0.7,
          height: `${Math.max(6, (v / max) * 100)}%`,
          borderRadius: '2px 2px 0 0',
          transition: 'height 0.6s ease',
        }}/>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const LivePerformanceDeck: React.FC<LivePerformanceDeckProps> = ({
  user, activities, emergencyTasks, matrixState, isDarkMode,
  onAddEmergencyTask, onCompleteEmergencyTask, onDeleteEmergencyTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('emergency');
  const [effView, setEffView] = useState<EffView>('day');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHours, setNewHours] = useState<24 | 48>(24);
  const [newPriority, setNewPriority] = useState(3);
  const [newTag, setNewTag] = useState('CRITICAL');

  // ─── Design Tokens ────────────────────────────────────────────────────────
  const D = useMemo(() => isDarkMode ? {
    outerBg:   'linear-gradient(180deg, #0a0a14 0%, #0d1022 100%)',
    panelBg:   'rgba(15, 20, 35, 0.95)',
    cardBg:    'rgba(255,255,255,0.04)',
    border:    'rgba(255,255,255,0.08)',
    borderAcc: 'rgba(99,102,241,0.3)',
    text:      '#f1f5f9',
    textSub:   'rgba(255,255,255,0.6)',
    textMut:   'rgba(255,255,255,0.35)',
    accent:    '#818cf8',
    accentGr:  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    green:     '#34d399',
    orange:    '#fb923c',
    red:       '#f87171',
    yellow:    '#fbbf24',
    tabBg:     'rgba(255,255,255,0.04)',
    inputBg:   'rgba(255,255,255,0.06)',
    footerBg:  '#0b0f19',
    btnBg:     '#1e1b4b',
    btnBorder: 'rgba(99,102,241,0.4)',
    btnHover:  '#2e2a75',
  } : {
    outerBg:   'linear-gradient(180deg, #f0f4ff 0%, #fafafa 100%)',
    panelBg:   'rgba(255, 255, 255, 0.98)',
    cardBg:    'rgba(99,102,241,0.03)',
    border:    'rgba(99,102,241,0.12)',
    borderAcc: 'rgba(99,102,241,0.25)',
    text:      '#0f172a',
    textSub:   '#475569',
    textMut:   '#64748b',
    accent:    '#6366f1',
    accentGr:  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    green:     '#059669',
    orange:    '#ea580c',
    red:       '#dc2626',
    yellow:    '#d97706',
    tabBg:     'rgba(99,102,241,0.05)',
    inputBg:   '#ffffff',
    footerBg:  '#F4EFE6',
    btnBg:     '#ffffff',
    btnBorder: 'rgba(15,23,42,0.15)',
    btnHover:  '#f8fafc',
  }, [isDarkMode]);

  // ─── Data calculations ─────────────────────────────────────────────────────
  const todayIdx = new Date().getDate() - 1;
  const curMonth = new Date().getMonth();
  const dayDone  = activities.filter(a => a.completed).length;
  const dayTotal = activities.length || 1;
  const dayEff   = Math.round((dayDone / dayTotal) * 100);

  const monthDone = activities.reduce((s, act) => s + (matrixState[act.id] || []).slice(0, todayIdx + 1).filter(Boolean).length, 0);
  const monthPoss = dayTotal * (todayIdx + 1) || 1;
  const monthEff  = Math.round((monthDone / monthPoss) * 100);
  const yearEff   = Math.min(99, Math.round(monthEff * 0.97 + 2));

  const monthBars = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const done = activities.reduce((s, act) => s + (matrixState[act.id]?.[i] ? 1 : 0), 0);
    return dayTotal > 0 ? Math.round((done / dayTotal) * 100) : 0;
  }), [activities, matrixState, dayTotal]);

  const yearBars = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    if (i === curMonth) return monthEff;
    return Math.min(98, Math.round(78 + Math.sin(i * 0.7) * 12 + ((i * 13) % 7)));
  }), [monthEff, curMonth]);

  const effColor = (pct: number) => pct >= 85 ? D.green : pct >= 60 ? D.yellow : D.red;
  const effGrade = (pct: number) => pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : 'D';
  const gradeColor: Record<string, string> = { S: '#a78bfa', A: D.green, B: D.yellow, C: D.orange, D: D.red };

  // ─── Improvement tips ─────────────────────────────────────────────────────
  const tips = useMemo(() => {
    const t: { icon: React.ReactNode; title: string; desc: string; level: 'high' | 'med' | 'low' }[] = [];
    if (dayEff < 70)  t.push({ icon: <Flame size={14}/>, title: 'Complete Today\'s Habits', desc: `${dayDone}/${dayTotal} done. Need ${Math.ceil(dayTotal*0.85)-dayDone} more to hit 85%.`, level: 'high' });
    if (monthEff < 80) t.push({ icon: <Calendar size={14}/>, title: 'Month Consistency Gap', desc: `Monthly: ${monthEff}%. Target 85%+ for Grade A performance.`, level: 'high' });
    const codingActs = activities.filter(a => a.category === 'coding');
    const pendingCode = codingActs.filter(a => !a.completed).length;
    if (pendingCode > 0) t.push({ icon: <Code2 size={14}/>, title: `${pendingCode} Coding Habit(s) Pending`, desc: 'Solve at least one problem per platform today to keep streaks alive.', level: 'high' });
    const maxStreak = codingActs.length > 0 ? Math.max(...codingActs.map(a => a.streak)) : 0;
    if (maxStreak < 7) t.push({ icon: <Flame size={14}/>, title: 'Build a 7-Day Streak', desc: 'Solve 1 problem daily for 7 days straight. Consistency beats intensity.', level: 'med' });
    if (!activities.find(a => a.category === 'fitness')) t.push({ icon: <Activity size={14}/>, title: 'Add a Fitness Habit', desc: '20 min workout increases brain dopamine by 30% — boosts coding performance too.', level: 'med' });
    t.push({ icon: <Brain size={14}/>, title: 'Deep Work Blocks', desc: 'Schedule 2–3h uninterrupted CP sessions. Put phone in DND mode.', level: 'low' });
    t.push({ icon: <BookOpen size={14}/>, title: 'Daily DSA Revision', desc: 'Spend 30 min/day reviewing solved problems. Spaced repetition = 60% better recall.', level: 'low' });
    t.push({ icon: <Target size={14}/>, title: 'Set Weekly Problem Targets', desc: 'Track specific weekly goals (e.g. 15 LC Mediums). Measurement drives performance.', level: 'low' });
    return t;
  }, [dayEff, monthEff, dayDone, dayTotal, activities]);

  // ─── Add task handler ──────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!newTitle.trim() || !onAddEmergencyTask) return;
    onAddEmergencyTask({
      id: `em_${Date.now()}`,
      title: newTitle.trim(),
      createdAt: Date.now(),
      deadlineHours: newHours,
      deadlineAt: Date.now() + newHours * 3600000,
      xpReward: 15,
      priority: newPriority,
      tag: newTag,
    });
    setNewTitle(''); setNewHours(24); setNewPriority(3); setShowAddForm(false);
  };

  const pColor = (p: number) => p >= 4 ? D.red : p === 3 ? D.orange : D.yellow;

  const TABS: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'emergency',  icon: <AlertTriangle size={14}/>, label: 'Emergency',  badge: emergencyTasks.filter(t => !t.completed).length || undefined },
    { id: 'efficiency', icon: <BarChart3 size={14}/>,     label: 'Efficiency' },
    { id: 'profiles',   icon: <Code2 size={14}/>,         label: 'Profiles'   },
    { id: 'improve',    icon: <Lightbulb size={14}/>,     label: 'Improve'    },
  ];

  // ─── Emergency tab ─────────────────────────────────────────────────────────
  const renderEmergency = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: D.text }}>🚨 Emergency Directives</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Time-critical tasks with countdown. +15 XP each.</div>
        </div>
        <button onClick={() => setShowAddForm(v => !v)} style={{
          padding: '7px 14px', border: 'none', borderRadius: 9, cursor: 'pointer',
          background: D.accentGr, color: '#fff', fontSize: 12, fontWeight: 700,
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>+ New</button>
      </div>

      {showAddForm && (
        <div style={{
          background: isDarkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
          border: `1.5px solid ${D.borderAcc}`, borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Directive title (e.g. Submit assignment, Fix bug before demo…)"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${D.border}`, background: D.inputBg, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Deadline */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: D.textMut, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deadline</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {([24, 48] as const).map(h => (
                  <button key={h} onClick={() => setNewHours(h)} style={{
                    flex: 1, padding: '7px 0', border: `1.5px solid ${newHours === h ? D.accent : D.border}`,
                    borderRadius: 7, background: newHours === h ? D.accentGr : 'transparent',
                    color: newHours === h ? '#fff' : D.textSub, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>{h}h</button>
                ))}
              </div>
            </div>
            {/* Priority */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: D.textMut, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(p => (
                  <button key={p} onClick={() => setNewPriority(p)} style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: p <= newPriority ? pColor(newPriority) : D.tabBg,
                    color: p <= newPriority ? '#fff' : D.textMut, fontSize: 11, fontWeight: 800,
                  }}>{p}</button>
                ))}
              </div>
            </div>
            {/* Tag */}
            <div style={{ flex: 1.4 }}>
              <div style={{ fontSize: 11, color: D.textMut, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tag</div>
              <select value={newTag} onChange={e => setNewTag(e.target.value)} style={{
                width: '100%', padding: '7px 8px', borderRadius: 7, border: `1.5px solid ${D.border}`,
                background: D.inputBg, color: D.text, fontSize: 12, outline: 'none',
              }}>
                {['CRITICAL','24H URGENT','48H DIRECTIVE','EXAM','DEADLINE','PROJECT','REVIEW'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={handleAdd} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer', background: D.accentGr, color: '#fff', fontSize: 13, fontWeight: 700 }}>🚨 Add Directive</button>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '9px 14px', border: `1.5px solid ${D.border}`, borderRadius: 8, background: 'transparent', color: D.textSub, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task list */}
      {emergencyTasks.length === 0 && !showAddForm ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: D.cardBg, borderRadius: 12, border: `1px dashed ${D.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🟢</div>
          <div style={{ color: D.textMut, fontSize: 13 }}>No active directives. Plate is clean.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {emergencyTasks.map(task => {
            const pctUsed = Math.min(100, Math.round(((Date.now() - task.createdAt) / (task.deadlineAt - task.createdAt)) * 100));
            const urgent = (task.deadlineAt - Date.now()) < 6 * 3600000;
            const done = !!task.completed;
            return (
              <div key={task.id} style={{
                background: done ? (isDarkMode ? 'rgba(52,211,153,0.06)' : 'rgba(5,150,105,0.04)') : D.cardBg,
                border: `1.5px solid ${done ? D.green + '40' : urgent ? D.red + '50' : D.border}`,
                borderRadius: 12, padding: '12px 14px',
                opacity: done ? 0.6 : 1, transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button onClick={() => onCompleteEmergencyTask?.(task.id)} style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%', marginTop: 2,
                    border: `2px solid ${done ? D.green : D.border}`, background: done ? D.green : 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{done && <CheckCircle2 size={11} color="#fff"/>}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: D.text, textDecoration: done ? 'line-through' : 'none' }}>{task.title}</span>
                      {task.tag && <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: urgent ? `${D.red}20` : `${D.orange}20`, color: urgent ? D.red : D.orange }}>{task.tag}</span>}
                      <span style={{ fontSize: 10, color: D.textMut, background: D.tabBg, padding: '1px 6px', borderRadius: 4 }}>P{task.priority} · +{task.xpReward}XP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                      <Timer size={11} color={D.textMut}/>
                      {done ? <span style={{ fontSize: 12, color: D.green, fontWeight: 700 }}>✓ Done</span> : <Countdown deadlineAt={task.deadlineAt}/>}
                    </div>
                    {!done && (
                      <div style={{ marginTop: 7, background: D.tabBg, borderRadius: 3, height: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pctUsed}%`, background: pctUsed > 80 ? D.red : pctUsed > 50 ? D.orange : D.green, transition: 'width 1s ease' }}/>
                      </div>
                    )}
                  </div>
                  <button onClick={() => onDeleteEmergencyTask?.(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.textMut, padding: 2, flexShrink: 0 }}><X size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary strip */}
      {emergencyTasks.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'Total',    v: emergencyTasks.length,                              c: D.accent  },
            { l: 'Done',     v: emergencyTasks.filter(t=>t.completed).length,       c: D.green   },
            { l: 'Active',   v: emergencyTasks.filter(t=>!t.completed).length,      c: D.orange  },
            { l: 'Critical', v: emergencyTasks.filter(t=>t.priority>=4&&!t.completed).length, c: D.red },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 9, padding: '8px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: D.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Efficiency tab ────────────────────────────────────────────────────────
  const renderEfficiency = () => {
    const pct   = effView === 'day' ? dayEff : effView === 'month' ? monthEff : yearEff;
    const bars  = effView === 'day' ? [dayEff] : effView === 'month' ? monthBars : yearBars;
    const grade = effGrade(pct);
    const clr   = effColor(pct);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: D.text }}>⚡ Efficiency Analytics</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Track your performance across day, month & year horizons.</div>
        </div>

        {/* Horizon tabs */}
        <div style={{ display: 'flex', gap: 5, background: D.tabBg, borderRadius: 10, padding: 4 }}>
          {(['day','month','year'] as EffView[]).map(v => (
            <button key={v} onClick={() => setEffView(v)} style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
              background: effView === v ? D.accentGr : 'transparent',
              color: effView === v ? '#fff' : D.textSub, textTransform: 'capitalize', transition: 'all 0.2s',
            }}>{v}</button>
          ))}
        </div>

        {/* Main gauge row */}
        <div style={{
          background: D.cardBg, border: `1.5px solid ${D.borderAcc}`, borderRadius: 14, padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <HalfGauge pct={pct} color={clr} size={110} label={`${effView} efficiency`}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: D.textSub, fontWeight: 600, textTransform: 'capitalize' }}>{effView} Score</span>
              <span style={{ fontSize: 12, fontWeight: 900, padding: '2px 9px', borderRadius: 6, background: `${gradeColor[grade]}20`, color: gradeColor[grade], border: `1.5px solid ${gradeColor[grade]}40` }}>
                Grade {grade}
              </span>
            </div>
            <div style={{ fontSize: 13, color: D.textSub, lineHeight: 1.7 }}>
              {effView === 'day'   ? `${dayDone}/${dayTotal} habits completed` :
               effView === 'month' ? `${monthDone} completions / ${monthPoss} expected` :
               `Estimated ${yearEff}% yearly completion rate`}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: clr, marginTop: 3 }}>
              {pct >= 85 ? '🔥 Excellent — Keep crushing it!' : pct >= 65 ? '⚡ Good — Push harder!' : '⚠️ Needs focus — Don\'t stop!'}
            </div>
          </div>
        </div>

        {/* Chart */}
        {effView !== 'day' && (
          <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, padding: '14px 14px 8px' }}>
            <div style={{ fontSize: 11, color: D.textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {effView === 'month' ? '30-Day Completion Rate' : '12-Month Completion Rate'}
            </div>
            <SparkBars data={bars} color={clr} height={44}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {effView === 'month'
                ? <><span style={{ fontSize: 9, color: D.textMut }}>Day 1</span><span style={{ fontSize: 9, color: D.textMut }}>Day 30</span></>
                : ['J','F','M','A','M','J','J','A','S','O','N','D'].map((m,i) => (
                    <span key={i} style={{ fontSize: 9, color: i === curMonth ? D.accent : D.textMut, fontWeight: i === curMonth ? 800 : 400 }}>{m}</span>
                  ))
              }
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Today',  p: dayEff,   icon: <Clock size={14}/> },
            { l: 'Month',  p: monthEff, icon: <Calendar size={14}/> },
            { l: 'Year',   p: yearEff,  icon: <TrendingUp size={14}/> },
          ].map(k => {
            const c = effColor(k.p);
            return (
              <div key={k.l} style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 11, padding: '12px 0', textAlign: 'center' }}>
                <div style={{ color: D.textMut, marginBottom: 3 }}>{k.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{k.p}%</div>
                <div style={{ fontSize: 10, color: D.textMut, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.l}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Profiles tab ──────────────────────────────────────────────────────────
  const renderProfiles = () => {
    const ps = user.platformStats || {};
    const pv = user.platformVerified || {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: D.text }}>🧑‍💻 Coding Profiles Analysis</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Your competitive programming portfolio at a glance.</div>
        </div>

        {/* Hero stats bar */}
        <div style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.04) 100%)',
          border: `1.5px solid ${D.borderAcc}`,
          borderRadius: 14, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'space-between',
        }}>
          {[
            { label: 'Level',    value: `Lv. ${user.level || 0}`,    color: D.accent  },
            { label: 'Rank',     value: `${user.hunterRank || 'E'}-Rank`, color: '#a78bfa' },
            { label: 'Streak',   value: `${user.overallStreak || 0}🔥`, color: D.orange  },
            { label: 'Best',     value: `${user.longestStreak || 0}d`, color: D.green   },
            { label: 'Total XP', value: `${user.currentXP || 0}`,   color: D.yellow   },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: D.textMut, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 36, background: D.border, flexShrink: 0 }}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Platform cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {PLATFORMS.map(p => {
            const username = (user as any)[p.usernameKey] || null;
            const stat = ps[p.key] || {};
            const verified = !!pv[p.key];
            const habit = activities.find(a => a.id.toLowerCase() === p.key || a.source === p.key);
            const doneToday = !!habit?.completed;
            const streak = habit?.streak || 0;
            const hasAccount = !!username;
            return (
              <div key={p.key} style={{
                background: hasAccount ? p.bg : D.tabBg,
                border: `1.5px solid ${hasAccount ? p.color + '35' : D.border}`,
                borderRadius: 14, padding: '14px 16px',
                opacity: hasAccount ? 1 : 0.5,
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}>
                {/* Subtle top glow for active accounts */}
                {hasAccount && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${p.gradFrom}, ${p.gradTo})`, opacity: 0.8 }}/>
                )}

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: hasAccount ? `0 4px 12px ${p.color}30` : 'none',
                      border: `1px solid ${p.color}30`,
                    }}>
                      {p.logo}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: D.text, lineHeight: 1.2 }}>{p.label}</div>
                      {username && <div style={{ fontSize: 10, color: D.textMut, marginTop: 1 }}>@{username}</div>}
                    </div>
                  </div>
                  {/* Status dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: doneToday ? D.green : hasAccount ? D.red : D.textMut,
                      boxShadow: doneToday ? `0 0 8px ${D.green}` : 'none',
                    }}/>
                    {verified && <div style={{ fontSize: 9, color: D.green, fontWeight: 700 }}>✓</div>}
                  </div>
                </div>

                {hasAccount ? (
                  <>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      {stat.solved != null && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.solved}</span><span style={{ color: D.textMut }}> solved</span></div>}
                      {stat.rating != null && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.rating}</span><span style={{ color: D.textMut }}> rating</span></div>}
                      {stat.rank && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.rank}</span></div>}
                      <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: D.yellow }}>{streak}🔥</span></div>
                    </div>

                    {/* Today status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: D.textMut }}>Today</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: doneToday ? D.green : D.red }}>
                        {doneToday ? '✓ Done' : '✗ Pending'}
                      </span>
                    </div>
                    <div style={{ background: `${p.color}20`, borderRadius: 3, height: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${p.gradFrom}, ${p.gradTo})`, borderRadius: 3, width: doneToday ? '100%' : `${Math.min(100, streak * 3)}%`, transition: 'width 0.8s ease' }}/>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: D.textMut, lineHeight: 1.5 }}>
                    Not connected<br/>
                    <span style={{ color: D.accent, fontSize: 10, fontWeight: 700 }}>Settings → Platforms</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coding habits status */}
        {activities.filter(a => a.category === 'coding').length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Coding Habits Today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activities.filter(a => a.category === 'coding').map(act => (
                <div key={act.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: D.cardBg, borderRadius: 10, padding: '9px 13px',
                  border: `1px solid ${act.completed ? D.green + '40' : D.border}`,
                }}>
                  {act.completed ? <CheckCircle2 size={15} color={D.green}/> : <Circle size={15} color={D.textMut}/>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{act.name}</div>
                    <div style={{ fontSize: 11, color: D.textMut }}>{act.source} · {act.streak}d streak · +{act.xpReward}XP</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 700, background: act.completed ? `${D.green}20` : `${D.orange}20`, color: act.completed ? D.green : D.orange }}>
                    {act.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Improve tab ───────────────────────────────────────────────────────────
  const renderImprove = () => {
    const high = tips.filter(t => t.level === 'high');
    const med  = tips.filter(t => t.level === 'med');
    const low  = tips.filter(t => t.level === 'low');

    const renderGroup = (items: typeof tips, title: string, icon: React.ReactNode, color: string, bgColor: string) => (
      items.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {icon} {title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {items.map((tip, i) => (
              <div key={i} style={{ background: isDarkMode ? bgColor : bgColor.replace('0.1', '0.06'), border: `1px solid ${color}25`, borderRadius: 11, padding: '11px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ color, flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 2 }}>{tip.title}</div>
                    <div style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{tip.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: D.text }}>🚀 How to Improve Efficiency</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Smart recommendations based on your real-time performance data.</div>
        </div>

        {/* Score bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
          border: `1.5px solid ${D.borderAcc}`, borderRadius: 13, padding: '13px 16px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: D.textMut, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Performance Score</div>
            <div style={{ height: 8, background: D.tabBg, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${dayEff}%`, borderRadius: 4, background: D.accentGr, transition: 'width 1s ease', boxShadow: `0 0 8px ${D.accent}60` }}/>
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 50 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: effColor(dayEff) }}>{dayEff}%</div>
            <div style={{ fontSize: 9, color: D.textMut }}>Today</div>
          </div>
          <span style={{ fontSize: 28 }}>{dayEff >= 90 ? '🏆' : dayEff >= 75 ? '⚡' : dayEff >= 50 ? '📈' : '🎯'}</span>
        </div>

        {renderGroup(high, 'High Priority — Act Now', <AlertTriangle size={13}/>, D.red,   'rgba(248,113,113,0.1)')}
        {renderGroup(med,  'Medium — This Week',      <Zap size={13}/>,           D.orange, 'rgba(251,146,60,0.1)')}
        {renderGroup(low,  'General Best Practices',  <Lightbulb size={13}/>,     D.accent, 'rgba(129,140,248,0.1)')}

        {/* Motivational footer */}
        <div style={{
          background: isDarkMode ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))' : 'linear-gradient(135deg,rgba(5,150,105,0.07),rgba(16,185,129,0.04))',
          border: `1px solid ${D.green}35`, borderRadius: 13, padding: '13px 15px',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 28 }}>💪</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: D.green }}>You're building something great!</div>
            <div style={{ fontSize: 12, color: D.textSub, lineHeight: 1.5, marginTop: 2 }}>
              Every habit today compounds into tomorrow's streak. Elite developers share one trait — <strong>relentless consistency</strong>.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Shell ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Spacer to prevent fixed footer overlapping last element when scrolled to bottom */}
      <div style={{ height: '54px' }} />

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}>
        {/* ── Expandable Panel (Slides up from the bottom) ── */}
        {isExpanded && (
          <div style={{
            background: D.panelBg,
            borderTop: `1px solid ${D.border}`,
            borderBottom: `1.5px solid ${D.border}`,
            maxHeight: '60vh',
            overflowY: 'auto',
            backdropFilter: 'blur(16px)',
            boxShadow: isDarkMode 
              ? '0 -10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.1)'
              : '0 -10px 30px rgba(15, 23, 42, 0.08)',
          }}>
            {/* Tab navigation */}
            <div style={{
              display: 'flex', borderBottom: `1px solid ${D.border}`,
              paddingLeft: 24, paddingRight: 24,
              background: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(99,102,241,0.01)',
            }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
                  padding: '11px 16px 13px',
                  border: 'none', borderBottom: `2.5px solid ${activeTab === tab.id ? D.accent : 'transparent'}`,
                  background: 'transparent', cursor: 'pointer',
                  color: activeTab === tab.id ? D.accent : D.textSub,
                  fontSize: 13, fontWeight: activeTab === tab.id ? 800 : 600,
                  transition: 'all 0.15s',
                }}>
                  {tab.icon}
                  {tab.label}
                  {tab.badge && (
                    <span style={{
                      position: 'absolute', top: 6, right: 4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: D.red, color: '#fff', fontSize: 9, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              padding: '20px 24px 24px',
              maxWidth: 1280, margin: '0 auto',
              scrollbarWidth: 'thin',
            }}>
              {activeTab === 'emergency'  && renderEmergency()}
              {activeTab === 'efficiency' && renderEfficiency()}
              {activeTab === 'profiles'   && renderProfiles()}
              {activeTab === 'improve'    && renderImprove()}
            </div>
          </div>
        )}

        {/* ── Toggle Footer Bar (Exact Visual Copy of Image) ── */}
        <div style={{
          background: D.footerBg,
          borderTop: `1px solid ${D.border}`,
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '48px',
          boxSizing: 'border-box',
          boxShadow: isDarkMode ? '0 -4px 10px rgba(0,0,0,0.3)' : '0 -2px 8px rgba(0,0,0,0.03)',
        }}>
          {/* Left: Button Styled exactly like the image */}
          <button
            onClick={() => setIsExpanded(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9px',
              border: `1px solid ${D.btnBorder}`,
              background: D.btnBg,
              color: D.text,
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = D.btnHover}
            onMouseLeave={e => e.currentTarget.style.background = D.btnBg}
          >
            {/* Blue-purple layout/layers icon */}
            <Layers size={13} style={{ color: '#818cf8' }} />
            <span>
              {isExpanded ? 'Hide Live Performance & Platform Deck' : 'Show Live Performance & Platform Deck'}
            </span>
            {isExpanded ? (
              <ChevronDown size={13} style={{ opacity: 0.8 }} />
            ) : (
              <ChevronDown size={13} style={{ opacity: 0.8 }} />
            )}
          </button>

          {/* Right: Muted status text */}
          <div style={{
            fontSize: '11.5px',
            color: D.textMut,
            fontWeight: '600',
            letterSpacing: '0.2px',
          }}>
            Live Solo Leveling Sync • {user.hunterRank || 'E'}-Rank
          </div>
        </div>
      </div>
    </>
  );
};
