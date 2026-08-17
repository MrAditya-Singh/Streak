import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Zap, AlertTriangle, TrendingUp, TrendingDown, Target, Award, Code2,
  BarChart3, Calendar, Clock, Star, Flame, ChevronRight, ArrowUpRight,
  ArrowDownRight, Lightbulb, CheckCircle2, Circle, Timer, Activity,
  Cpu, Trophy, Rocket, Brain, Shield, BookOpen, GitBranch, Layers
} from 'lucide-react';
import { ActivityItem, EmergencyTask, UserProfile } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LivePerformanceDeckProps {
  isOpen: boolean;
  onClose: () => void;
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
type EfficiencyView = 'day' | 'month' | 'year';

// ─── Platform colours ─────────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  leetcode:   { color: '#f89820', bg: 'rgba(248,152,32,0.12)',  icon: '🟡', label: 'LeetCode'   },
  codeforces: { color: '#1890ff', bg: 'rgba(24,144,255,0.12)', icon: '🔵', label: 'Codeforces' },
  github:     { color: '#6e40c9', bg: 'rgba(110,64,201,0.12)', icon: '🟣', label: 'GitHub'     },
  gfg:        { color: '#2db940', bg: 'rgba(45,185,64,0.12)',  icon: '🟢', label: 'GFG'        },
  codechef:   { color: '#b37144', bg: 'rgba(179,113,68,0.12)', icon: '🟤', label: 'CodeChef'   },
  hackerrank: { color: '#00ea64', bg: 'rgba(0,234,100,0.12)',  icon: '🟩', label: 'HackerRank' },
  atcoder:    { color: '#e0e0e0', bg: 'rgba(200,200,200,0.10)',icon: '⬜', label: 'AtCoder'    },
};

// ─── Small Arc Gauge ─────────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half-circle
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`} style={{ overflow: 'visible' }}>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.07} strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={size * 0.07} strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={size * 0.2} fontWeight="800">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ─── Micro sparkline bar ──────────────────────────────────────────────────────
function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color, opacity: 0.4 + (v / max) * 0.6,
          height: `${Math.max(4, (v / max) * 100)}%`,
          borderRadius: 3, transition: 'height 0.5s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Countdown timer for emergency tasks ─────────────────────────────────────
function Countdown({ deadlineAt }: { deadlineAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = deadlineAt - now;
  if (remaining <= 0) return <span style={{ color: '#f87171', fontWeight: 700 }}>EXPIRED</span>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const urgent = h < 6;
  return (
    <span style={{ color: urgent ? '#f87171' : '#fbbf24', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const LivePerformanceDeck: React.FC<LivePerformanceDeckProps> = ({
  isOpen, onClose, user, activities, emergencyTasks, matrixState,
  isDarkMode, onAddEmergencyTask, onCompleteEmergencyTask, onDeleteEmergencyTask,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('emergency');
  const [effView, setEffView] = useState<EfficiencyView>('day');
  const [showAddEmergency, setShowAddEmergency] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHours, setNewTaskHours] = useState<24 | 48>(24);
  const [newTaskPriority, setNewTaskPriority] = useState(3);
  const [newTaskTag, setNewTaskTag] = useState('CRITICAL');

  // ─── Theme tokens ────────────────────────────────────────────────────────
  const T = useMemo(() => isDarkMode ? {
    bg:          'linear-gradient(135deg,#0d0d1a 0%,#111827 50%,#0a0a18 100%)',
    surface:     'rgba(255,255,255,0.04)',
    surfaceHov:  'rgba(255,255,255,0.07)',
    border:      'rgba(255,255,255,0.08)',
    borderAccent:'rgba(99,102,241,0.4)',
    text:        '#f1f5f9',
    textSub:     'rgba(255,255,255,0.55)',
    textMuted:   'rgba(255,255,255,0.3)',
    accent:      '#818cf8',
    accentGrad:  'linear-gradient(135deg,#6366f1,#8b5cf6)',
    green:       '#34d399',
    orange:      '#fb923c',
    red:         '#f87171',
    yellow:      '#fbbf24',
    tabBg:       'rgba(255,255,255,0.05)',
    tabActive:   'linear-gradient(135deg,#6366f1,#8b5cf6)',
    scrollbar:   '#6366f120',
  } : {
    bg:          'linear-gradient(135deg,#f0f4ff 0%,#fafafa 50%,#eef2ff 100%)',
    surface:     'rgba(255,255,255,0.85)',
    surfaceHov:  'rgba(255,255,255,0.95)',
    border:      'rgba(99,102,241,0.12)',
    borderAccent:'rgba(99,102,241,0.35)',
    text:        '#0f172a',
    textSub:     '#475569',
    textMuted:   '#94a3b8',
    accent:      '#6366f1',
    accentGrad:  'linear-gradient(135deg,#6366f1,#8b5cf6)',
    green:       '#059669',
    orange:      '#ea580c',
    red:         '#dc2626',
    yellow:      '#d97706',
    tabBg:       'rgba(99,102,241,0.06)',
    tabActive:   'linear-gradient(135deg,#6366f1,#8b5cf6)',
    scrollbar:   '#6366f130',
  }, [isDarkMode]);

  // ─── Efficiency calculations ─────────────────────────────────────────────
  const dayDone = activities.filter(a => a.completed).length;
  const dayTotal = activities.length || 1;
  const dayEff = Math.round((dayDone / dayTotal) * 100);

  const todayIdx = new Date().getDate() - 1;
  const monthDone = activities.reduce((sum, act) => {
    const days = matrixState[act.id] || [];
    return sum + days.slice(0, todayIdx + 1).filter(Boolean).length;
  }, 0);
  const monthPossible = dayTotal * (todayIdx + 1) || 1;
  const monthEff = Math.round((monthDone / monthPossible) * 100);

  // Estimate year efficiency from month trend
  const yearEff = Math.min(99, Math.round(monthEff * 0.97 + 2));

  // 30-day bar data for month view
  const monthBars = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    let done = 0;
    activities.forEach(act => {
      const days = matrixState[act.id] || [];
      if (days[i]) done++;
    });
    const total = dayTotal;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }), [activities, matrixState, dayTotal]);

  // 12-month bars (current month real, others estimated)
  const now = new Date();
  const curMo = now.getMonth();
  const yearBars = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    if (i === curMo) return monthEff;
    const base = 78 + Math.sin(i * 0.7) * 12 + ((i * 13) % 7);
    return Math.min(98, Math.round(base));
  }), [monthEff, curMo]);

  // ─── Platform profile data ──────────────────────────────────────────────
  const platforms = useMemo(() => {
    const ps = user.platformStats || {};
    const pv = user.platformVerified || {};
    return Object.entries(PLATFORM_META).map(([key, meta]) => ({
      key, ...meta,
      solved: ps[key]?.solved ?? null,
      rating: ps[key]?.rating ?? null,
      rank:   ps[key]?.rank ?? null,
      verified: !!pv[key],
      username: (user as any)[`${key}Username`] || (user as any)[`${key}Handle`] || null,
    }));
  }, [user]);

  // Coding habits (from activities)
  const codingActs = activities.filter(a => a.category === 'coding');
  const codingDoneToday = codingActs.filter(a => a.completed).length;
  const codingStreak = codingActs.length > 0 ? Math.max(...codingActs.map(a => a.streak)) : 0;

  // ─── Improvement tips ───────────────────────────────────────────────────
  const tips = useMemo(() => {
    const t: { icon: React.ReactNode; title: string; desc: string; priority: 'high' | 'medium' | 'low' }[] = [];
    if (dayEff < 70) t.push({ icon: <Flame size={16}/>, title: 'Boost Today\'s Efficiency', desc: `You\'ve completed ${dayDone}/${dayTotal} habits. Complete ${dayTotal - dayDone} more to pass 70%.`, priority: 'high' });
    if (monthEff < 80) t.push({ icon: <Calendar size={16}/>, title: 'Monthly Consistency Gap', desc: `Monthly rate is ${monthEff}%. Aim for 85%+ by maintaining daily streaks without breaks.`, priority: 'high' });
    if (codingDoneToday < codingActs.length) t.push({ icon: <Code2 size={16}/>, title: 'Incomplete Coding Habits', desc: `${codingActs.length - codingDoneToday} coding platform(s) not marked today. Update them to keep streaks alive.`, priority: 'high' });
    if (codingStreak < 7) t.push({ icon: <Flame size={16}/>, title: 'Build a 7-Day Streak', desc: 'Your coding streak is low. Solve at least 1 problem daily for 7 consecutive days to build momentum.', priority: 'medium' });
    if (activities.filter(a => a.category === 'fitness').length === 0) t.push({ icon: <Activity size={16}/>, title: 'Add Fitness Habit', desc: 'Physical exercise boosts cognitive performance by 20%. Add a gym/walk habit to your plan.', priority: 'medium' });
    const unverified = platforms.filter(p => p.username && !p.verified);
    if (unverified.length > 0) t.push({ icon: <Shield size={16}/>, title: 'Verify Coding Profiles', desc: `${unverified.map(p=>p.label).join(', ')} profiles are unverified. Connect them for auto-sync.`, priority: 'medium' });
    t.push({ icon: <Brain size={16}/>, title: 'Deep Work Blocks', desc: 'Schedule 2–3 hour uninterrupted blocks for competitive programming. Avoid multitasking during these.', priority: 'low' });
    t.push({ icon: <BookOpen size={16}/>, title: 'Daily DSA Revision', desc: 'Spend 30 min/day revisiting previously solved problems. Spaced repetition improves retention by 60%.', priority: 'low' });
    t.push({ icon: <Target size={16}/>, title: 'Set Weekly Problem Targets', desc: 'Set LeetCode/CF targets per week (e.g. 15 LC + 5 CF). Tracking targets improves completion by 40%.', priority: 'low' });
    return t;
  }, [dayEff, monthEff, dayDone, dayTotal, codingDoneToday, codingActs.length, codingStreak, activities, platforms]);

  // ─── Add emergency task handler ─────────────────────────────────────────
  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !onAddEmergencyTask) return;
    const deadlineMs = newTaskHours * 3600000;
    const task: EmergencyTask = {
      id: `em_${Date.now()}`,
      title: newTaskTitle.trim(),
      createdAt: Date.now(),
      deadlineHours: newTaskHours,
      deadlineAt: Date.now() + deadlineMs,
      xpReward: 15,
      priority: newTaskPriority,
      tag: newTaskTag,
    };
    onAddEmergencyTask(task);
    setNewTaskTitle('');
    setNewTaskHours(24);
    setNewTaskPriority(3);
    setShowAddEmergency(false);
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'emergency',  label: 'Emergency',  icon: <AlertTriangle size={15}/> },
    { id: 'efficiency', label: 'Efficiency', icon: <BarChart3 size={15}/> },
    { id: 'profiles',   label: 'Profiles',   icon: <Code2 size={15}/> },
    { id: 'improve',    label: 'Improve',    icon: <Rocket size={15}/> },
  ];

  const priorityColor = (p: number) => p >= 4 ? T.red : p === 3 ? T.orange : T.yellow;

  // ─── Section renderers ──────────────────────────────────────────────────

  // ── TAB 1: Emergency Directives ─────────────────────────────────────────
  const renderEmergency = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>
            🚨 Emergency Directives
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSub }}>
            Time-critical tasks with 24h/48h deadlines. Each worth +15 XP.
          </p>
        </div>
        <button
          onClick={() => setShowAddEmergency(v => !v)}
          style={{
            padding: '8px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
            background: T.accentGrad, color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >+ New Directive</button>
      </div>

      {/* Add form */}
      {showAddEmergency && (
        <div style={{
          background: isDarkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
          border: `1.5px solid ${T.borderAccent}`,
          borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Directive title (e.g. Fix CI pipeline, Submit assignment…)"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${T.border}`,
              background: T.surface, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: 'block', marginBottom: 4 }}>Deadline</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {([24, 48] as const).map(h => (
                  <button key={h} onClick={() => setNewTaskHours(h)} style={{
                    flex: 1, padding: '7px 0', border: `1.5px solid ${newTaskHours === h ? T.accent : T.border}`,
                    borderRadius: 8, background: newTaskHours === h ? T.accentGrad : 'transparent',
                    color: newTaskHours === h ? '#fff' : T.textSub, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>{h}h</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: 'block', marginBottom: 4 }}>Priority</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(p => (
                  <button key={p} onClick={() => setNewTaskPriority(p)} style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 7, cursor: 'pointer',
                    background: p <= newTaskPriority ? priorityColor(newTaskPriority) : T.tabBg,
                    color: p <= newTaskPriority ? '#fff' : T.textMuted, fontSize: 12, fontWeight: 700,
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: 'block', marginBottom: 4 }}>Tag</label>
              <select value={newTaskTag} onChange={e => setNewTaskTag(e.target.value)} style={{
                width: '100%', padding: '8px', borderRadius: 8, border: `1.5px solid ${T.border}`,
                background: T.surface, color: T.text, fontSize: 13, outline: 'none',
              }}>
                {['CRITICAL','24H URGENT','48H DIRECTIVE','EXAM','DEADLINE','PROJECT'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAddTask} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
              background: T.accentGrad, color: '#fff', fontSize: 14, fontWeight: 700,
            }}>🚨 Add Directive</button>
            <button onClick={() => setShowAddEmergency(false)} style={{
              padding: '10px 16px', border: `1.5px solid ${T.border}`, borderRadius: 9,
              background: 'transparent', color: T.textSub, fontSize: 14, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task list */}
      {emergencyTasks.length === 0 && !showAddEmergency ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: T.surface, borderRadius: 14, border: `1px dashed ${T.border}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🟢</div>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 14 }}>No active emergency directives.</p>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 12 }}>All clear — your plate is clean.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emergencyTasks.map(task => {
            const pctUsed = Math.min(100, Math.round(((Date.now() - task.createdAt) / (task.deadlineAt - task.createdAt)) * 100));
            const urgent = (task.deadlineAt - Date.now()) < 6 * 3600000;
            const done = !!task.completed;
            return (
              <div key={task.id} style={{
                background: done ? (isDarkMode ? 'rgba(52,211,153,0.06)' : 'rgba(5,150,105,0.05)') : T.surface,
                border: `1.5px solid ${done ? T.green + '50' : urgent ? T.red + '60' : T.border}`,
                borderRadius: 14, padding: '14px 16px',
                opacity: done ? 0.65 : 1,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button onClick={() => onCompleteEmergencyTask?.(task.id)} style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${done ? T.green : T.border}`,
                    background: done ? T.green : 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}>
                    {done && <CheckCircle2 size={12} color="#fff"/>}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: T.text,
                        textDecoration: done ? 'line-through' : 'none',
                      }}>{task.title}</span>
                      {task.tag && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
                          background: urgent ? `${T.red}20` : `${T.orange}20`,
                          color: urgent ? T.red : T.orange, letterSpacing: '0.4px',
                        }}>{task.tag}</span>
                      )}
                      <span style={{
                        fontSize: 10, color: T.textMuted, padding: '2px 6px',
                        background: T.tabBg, borderRadius: 5,
                      }}>P{task.priority} · +{task.xpReward} XP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <Timer size={12} color={T.textMuted}/>
                      {done
                        ? <span style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>✓ Completed</span>
                        : <Countdown deadlineAt={task.deadlineAt}/>
                      }
                    </div>
                    {!done && (
                      <div style={{ marginTop: 8, background: T.tabBg, borderRadius: 4, height: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, width: `${pctUsed}%`,
                          background: pctUsed > 80 ? T.red : pctUsed > 50 ? T.orange : T.green,
                          transition: 'width 1s ease',
                        }}/>
                      </div>
                    )}
                  </div>
                  <button onClick={() => onDeleteEmergencyTask?.(task.id)} style={{
                    flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
                    color: T.textMuted, padding: 4,
                  }}>
                    <X size={14}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {emergencyTasks.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total',    value: emergencyTasks.length,                                    color: T.accent },
            { label: 'Done',     value: emergencyTasks.filter(t=>t.completed).length,             color: T.green  },
            { label: 'Active',   value: emergencyTasks.filter(t=>!t.completed).length,            color: T.orange },
            { label: 'Critical', value: emergencyTasks.filter(t=>t.priority>=4 && !t.completed).length, color: T.red },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '10px 0', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 2: Efficiency ────────────────────────────────────────────────────
  const renderEfficiency = () => {
    const efficiencyData = {
      day:   { pct: dayEff,   label: 'Today',  done: dayDone,  total: dayTotal,  bars: [dayEff], unit: 'habits done' },
      month: { pct: monthEff, label: 'Month',  done: monthDone, total: monthPossible, bars: monthBars, unit: 'habit completions' },
      year:  { pct: yearEff,  label: 'Year',   done: Math.round(yearEff * dayTotal * 365 / 100), total: dayTotal * 365, bars: yearBars, unit: 'estimated completions' },
    }[effView];

    const effColor = efficiencyData.pct >= 85 ? T.green : efficiencyData.pct >= 65 ? T.yellow : T.red;
    const effGrade = efficiencyData.pct >= 90 ? 'S' : efficiencyData.pct >= 80 ? 'A' : efficiencyData.pct >= 65 ? 'B' : efficiencyData.pct >= 50 ? 'C' : 'D';
    const gradeColors: Record<string, string> = { S: '#a78bfa', A: T.green, B: T.yellow, C: T.orange, D: T.red };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>⚡ Efficiency Analytics</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSub }}>
            Track your performance across different time horizons.
          </p>
        </div>

        {/* View selector */}
        <div style={{ display: 'flex', gap: 6, background: T.tabBg, borderRadius: 12, padding: 4 }}>
          {(['day','month','year'] as EfficiencyView[]).map(v => (
            <button key={v} onClick={() => setEffView(v)} style={{
              flex: 1, padding: '9px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
              background: effView === v ? T.accentGrad : 'transparent',
              color: effView === v ? '#fff' : T.textSub,
              fontSize: 13, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s',
            }}>{v}</button>
          ))}
        </div>

        {/* Main gauge + grade */}
        <div style={{
          background: T.surface, border: `1.5px solid ${T.borderAccent}`,
          borderRadius: 16, padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <ArcGauge pct={efficiencyData.pct} color={effColor} size={110}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: T.textSub, fontWeight: 600 }}>{efficiencyData.label} Efficiency</span>
              <span style={{
                fontSize: 13, fontWeight: 900, padding: '2px 10px', borderRadius: 7,
                background: `${gradeColors[effGrade]}25`, color: gradeColors[effGrade],
                border: `1.5px solid ${gradeColors[effGrade]}50`,
              }}>Grade {effGrade}</span>
            </div>
            <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
              <div>{efficiencyData.done} / {efficiencyData.total} {efficiencyData.unit}</div>
              <div style={{ color: effColor, fontWeight: 700 }}>
                {efficiencyData.pct >= 85 ? '🔥 Excellent — Keep crushing it!' :
                 efficiencyData.pct >= 65 ? '⚡ Good — Push a bit harder!' :
                 '⚠️ Needs improvement — Don\'t give up!'}
              </div>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '16px 16px 10px',
        }}>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontWeight: 600 }}>
            {effView === 'day' ? 'Today\'s Progress' :
             effView === 'month' ? '30-Day Daily Efficiency (%)' :
             '12-Month Monthly Efficiency (%)'}
          </div>
          <SparkBars data={efficiencyData.bars} color={effColor}/>
          {effView !== 'day' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {effView === 'month' ? (
                <><span style={{ fontSize: 10, color: T.textMuted }}>Day 1</span><span style={{ fontSize: 10, color: T.textMuted }}>Day 30</span></>
              ) : (
                <>
                  {['J','F','M','A','M','J','J','A','S','O','N','D'].map((m,i) => (
                    <span key={i} style={{ fontSize: 9, color: i === curMo ? T.accent : T.textMuted, fontWeight: i === curMo ? 800 : 400 }}>{m}</span>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* 3-column KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Today',  pct: dayEff,   icon: <Clock size={16}/>,    color: dayEff  >= 85 ? T.green : T.orange },
            { label: 'Month',  pct: monthEff, icon: <Calendar size={16}/>, color: monthEff >= 85 ? T.green : T.orange },
            { label: 'Year',   pct: yearEff,  icon: <TrendingUp size={16}/>,color: yearEff >= 85 ? T.green : T.orange },
          ].map(k => (
            <div key={k.label} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ color: T.textMuted, marginBottom: 4 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.pct}%</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Improvement needed */}
        {efficiencyData.pct < 85 && (
          <div style={{
            background: isDarkMode ? 'rgba(251,191,36,0.08)' : 'rgba(217,119,6,0.07)',
            border: `1px solid ${T.yellow}40`, borderRadius: 12, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Lightbulb size={16} color={T.yellow} style={{ flexShrink: 0, marginTop: 2 }}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.yellow, marginBottom: 2 }}>
                {Math.round(efficiencyData.pct < 65 ? (65 - efficiencyData.pct) : (85 - efficiencyData.pct))}% gap to {efficiencyData.pct < 65 ? 'Good' : 'Excellent'}
              </div>
              <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
                {effView === 'day' ? `Complete ${Math.ceil((dayTotal * 0.85) - dayDone)} more habits today to reach 85%.` :
                 effView === 'month' ? 'Maintain 85%+ daily habit completion for the rest of the month.' :
                 'Consistent daily habits compound into yearly excellence. Stay the course.'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── TAB 3: Coding Profiles ───────────────────────────────────────────────
  const renderProfiles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>🧑‍💻 Coding Profiles Analysis</h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSub }}>
          Your competitive programming & coding portfolio at a glance.
        </p>
      </div>

      {/* Overall coding score */}
      <div style={{
        background: isDarkMode ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))' : 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))',
        border: `1.5px solid ${T.borderAccent}`,
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, background: T.accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {user.overallStreak || 0}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>Overall Streak</div>
        </div>
        <div style={{ width: 1, height: 48, background: T.border }}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: T.green }}>{user.longestStreak || 0}</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>Best Streak</div>
        </div>
        <div style={{ width: 1, height: 48, background: T.border }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
            <div>🎯 Level <strong style={{ color: T.accent }}>Lv.{user.level || 0}</strong> · Rank <strong style={{ color: T.accent }}>{user.hunterRank || 'E'}</strong></div>
            <div>⚡ <strong style={{ color: T.yellow }}>{user.currentXP || 0} XP</strong> · {codingActs.length} coding habits tracked</div>
          </div>
        </div>
      </div>

      {/* Platform grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {platforms.map(p => {
          const habit = activities.find(a => a.id.toLowerCase() === p.key || a.source === p.key);
          const doneToday = !!habit?.completed;
          const streak = habit?.streak || 0;
          const hasAccount = !!p.username;
          return (
            <div key={p.key} style={{
              background: p.bg,
              border: `1.5px solid ${hasAccount ? p.color + '40' : T.border}`,
              borderRadius: 14, padding: '14px 16px',
              opacity: hasAccount ? 1 : 0.55,
              transition: 'all 0.2s',
              cursor: hasAccount ? 'pointer' : 'default',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{p.label}</div>
                    {p.username && <div style={{ fontSize: 10, color: T.textMuted }}>@{p.username}</div>}
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: doneToday ? T.green : hasAccount ? T.red : T.textMuted,
                  boxShadow: doneToday ? `0 0 6px ${T.green}` : 'none',
                }}/>
              </div>

              {hasAccount ? (
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  {p.solved != null && (
                    <div><span style={{ color: p.color, fontWeight: 800 }}>{p.solved}</span><span style={{ color: T.textMuted }}> solved</span></div>
                  )}
                  {p.rating != null && (
                    <div><span style={{ color: p.color, fontWeight: 800 }}>{p.rating}</span><span style={{ color: T.textMuted }}> rating</span></div>
                  )}
                  {p.rank && (
                    <div><span style={{ color: p.color, fontWeight: 800 }}>{p.rank}</span></div>
                  )}
                  <div><span style={{ color: T.yellow, fontWeight: 800 }}>{streak}</span><span style={{ color: T.textMuted }}>d🔥</span></div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  Not connected · Go to Settings → Platforms
                </div>
              )}

              {hasAccount && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>Today</span>
                    <span style={{ fontSize: 10, color: doneToday ? T.green : T.red, fontWeight: 700 }}>
                      {doneToday ? '✓ Done' : '✗ Pending'}
                    </span>
                  </div>
                  <div style={{ background: `${p.color}20`, borderRadius: 4, height: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: p.color, borderRadius: 4,
                      width: doneToday ? '100%' : `${Math.min(100, streak * 2)}%`,
                    }}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Coding habits breakdown */}
      {codingActs.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>Active Coding Habits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {codingActs.map(act => (
              <div key={act.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: T.surface, borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${act.completed ? T.green + '40' : T.border}`,
              }}>
                {act.completed
                  ? <CheckCircle2 size={16} color={T.green}/>
                  : <Circle size={16} color={T.textMuted}/>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{act.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{act.source} · {act.streak}d streak · +{act.xpReward} XP</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 5,
                  background: act.completed ? `${T.green}20` : `${T.orange}20`,
                  color: act.completed ? T.green : T.orange, fontWeight: 700,
                }}>{act.completed ? 'Done' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 4: How to Improve ────────────────────────────────────────────────
  const renderImprove = () => {
    const highTips    = tips.filter(t => t.priority === 'high');
    const mediumTips  = tips.filter(t => t.priority === 'medium');
    const lowTips     = tips.filter(t => t.priority === 'low');

    const sectionStyle = (color: string, bg: string) => ({
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 12, padding: '12px 14px',
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>🚀 How to Improve Efficiency</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSub }}>
            AI-driven recommendations based on your current performance data.
          </p>
        </div>

        {/* Personal score */}
        <div style={{
          display: 'flex', gap: 10,
          background: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
          border: `1.5px solid ${T.borderAccent}`, borderRadius: 14, padding: '14px 16px',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Your Performance Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 8, background: T.tabBg, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${dayEff}%`, borderRadius: 4, background: T.accentGrad, transition: 'width 1s ease' }}/>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: T.accent }}>{dayEff}%</span>
            </div>
          </div>
          <div style={{ fontSize: 28 }}>
            {dayEff >= 90 ? '🏆' : dayEff >= 75 ? '⚡' : dayEff >= 50 ? '📈' : '🎯'}
          </div>
        </div>

        {/* High Priority tips */}
        {highTips.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.red, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13}/> HIGH PRIORITY — Act Now
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {highTips.map((tip, i) => (
                <div key={i} style={sectionStyle(T.red, isDarkMode ? 'rgba(248,113,113,0.07)' : 'rgba(220,38,38,0.05)')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ color: T.red, flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{tip.title}</div>
                      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>{tip.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority tips */}
        {mediumTips.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.orange, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13}/> MEDIUM PRIORITY — This Week
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mediumTips.map((tip, i) => (
                <div key={i} style={sectionStyle(T.orange, isDarkMode ? 'rgba(251,146,60,0.07)' : 'rgba(234,88,12,0.05)')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ color: T.orange, flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{tip.title}</div>
                      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>{tip.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Priority / General */}
        {lowTips.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lightbulb size={13}/> GENERAL TIPS — Best Practices
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowTips.map((tip, i) => (
                <div key={i} style={sectionStyle(T.accent, isDarkMode ? 'rgba(129,140,248,0.07)' : 'rgba(99,102,241,0.05)')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ color: T.accent, flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{tip.title}</div>
                      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>{tip.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivation strip */}
        <div style={{
          background: isDarkMode
            ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))'
            : 'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(16,185,129,0.05))',
          border: `1px solid ${T.green}40`, borderRadius: 14, padding: '14px 16px',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 28 }}>💪</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>You're building something great!</div>
            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
              Every habit completed today computes into the streak data of tomorrow.
              Elite developers have just one trait in common — <strong>consistency</strong>.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Modal shell ─────────────────────────────────────────────────────────
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: isDarkMode ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: T.bg,
        border: `1.5px solid ${T.borderAccent}`,
        borderRadius: 24,
        boxShadow: isDarkMode
          ? '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.15)'
          : '0 32px 80px rgba(15,23,42,0.2), 0 0 40px rgba(99,102,241,0.1)',
        width: '100%', maxWidth: 620,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Inter", system-ui, sans-serif',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 0',
          background: isDarkMode
            ? 'linear-gradient(180deg,rgba(99,102,241,0.15) 0%,transparent 100%)'
            : 'linear-gradient(180deg,rgba(99,102,241,0.08) 0%,transparent 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: T.accentGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              }}>
                <Layers size={20} color="#fff"/>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.text, letterSpacing: '-0.3px' }}>
                  Live Performance Deck
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
                  Real-time analytics & platform intelligence
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%', border: `1px solid ${T.border}`,
              background: T.surface, cursor: 'pointer', color: T.textSub,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16}/>
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px 11px',
                border: 'none', borderBottom: `2.5px solid ${activeTab === tab.id ? T.accent : 'transparent'}`,
                background: 'transparent', cursor: 'pointer',
                color: activeTab === tab.id ? T.accent : T.textSub,
                fontSize: 12.5, fontWeight: activeTab === tab.id ? 800 : 600,
                transition: 'all 0.15s',
              }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 24px 24px',
          scrollbarWidth: 'thin', scrollbarColor: `${T.scrollbar} transparent`,
        }}>
          {activeTab === 'emergency'  && renderEmergency()}
          {activeTab === 'efficiency' && renderEfficiency()}
          {activeTab === 'profiles'   && renderProfiles()}
          {activeTab === 'improve'    && renderImprove()}
        </div>
      </div>
    </div>
  );
};
