import React, { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, Code2, Lightbulb,
  Zap, Flame, Calendar, CheckCircle2, Circle,
  X, Target, Brain, Activity, BookOpen, Layers,
  TrendingUp, Star, Trash2, Edit3, Copy, Check, Plus, Search, Tag, Sparkles
} from 'lucide-react';
import { ActivityItem, UserProfile, ThoughtItem, ThoughtCategory } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LivePerformanceDeckProps {
  user: UserProfile;
  activities: ActivityItem[];
  thoughts: ThoughtItem[];
  matrixState: Record<string, boolean[]>;
  isDarkMode: boolean;
  onAddThought?: (thought: ThoughtItem) => void;
  onUpdateThought?: (id: string, updated: Partial<ThoughtItem>) => void;
  onDeleteThought?: (id: string) => void;
  onToggleStarThought?: (id: string) => void;
}

type Tab = 'personal' | 'financial' | 'technical' | 'profiles' | 'improve';

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

// ─── Main Component ───────────────────────────────────────────────────────────
export const LivePerformanceDeck: React.FC<LivePerformanceDeckProps> = ({
  user, activities, thoughts = [], isDarkMode,
  onAddThought, onUpdateThought, onDeleteThought, onToggleStarThought,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  
  // Thought Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [thoughtTitle, setThoughtTitle] = useState('');
  const [thoughtContent, setThoughtContent] = useState('');
  const [thoughtCategory, setThoughtCategory] = useState<ThoughtCategory>('personal');
  const [thoughtTags, setThoughtTags] = useState('');
  const [thoughtPriority, setThoughtPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isStarredInput, setIsStarredInput] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─── Design Tokens ────────────────────────────────────────────────────────
  const D = useMemo(() => isDarkMode ? {
    panelBg:   '#0f1422',
    cardBg:    '#171e31',
    cardBorder:'rgba(255,255,255,0.08)',
    border:    'rgba(255,255,255,0.08)',
    borderAcc: 'rgba(99,102,241,0.3)',
    text:      '#f1f5f9',
    textSub:   '#94a3b8',
    textMut:   '#64748b',
    accent:    '#818cf8',
    accentGr:  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    green:     '#34d399',
    orange:    '#fb923c',
    red:       '#f87171',
    yellow:    '#fbbf24',
    tabBg:     'rgba(255,255,255,0.04)',
    inputBg:   '#121622',
    btnBg:     '#1e1b4b',
    btnBorder: 'rgba(99,102,241,0.4)',
    btnHover:  '#2e2a75',
  } : {
    panelBg:   '#ffffff',
    cardBg:    '#ffffff',
    cardBorder:'rgba(0,0,0,0.08)',
    border:    'rgba(0,0,0,0.08)',
    borderAcc: 'rgba(99,102,241,0.25)',
    text:      '#000000',
    textSub:   '#334155',
    textMut:   '#64748b',
    accent:    '#6366f1',
    accentGr:  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    green:     '#059669',
    orange:    '#ea580c',
    red:       '#dc2626',
    yellow:    '#d97706',
    tabBg:     'rgba(99,102,241,0.05)',
    inputBg:   '#ffffff',
    btnBg:     '#ffffff',
    btnBorder: 'rgba(0,0,0,0.15)',
    btnHover:  '#f8fafc',
  }, [isDarkMode]);

  // ─── Tabs Configuration ───────────────────────────────────────────────────
  const TABS: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { 
      id: 'personal',  
      icon: <Brain size={14}/>, 
      label: 'Personal Thoughts',
      badge: thoughts.filter(t => t.category === 'personal').length || undefined 
    },
    { 
      id: 'financial', 
      icon: <TrendingUp size={14}/>, 
      label: 'Financial Thoughts',
      badge: thoughts.filter(t => t.category === 'financial').length || undefined 
    },
    { 
      id: 'technical', 
      icon: <Lightbulb size={14}/>, 
      label: 'Technical Ideas',
      badge: thoughts.filter(t => t.category === 'technical').length || undefined 
    },
    { 
      id: 'profiles',   
      icon: <Code2 size={14}/>,         
      label: 'Coding Profiles'   
    },
    { 
      id: 'improve',    
      icon: <Sparkles size={14}/>,     
      label: 'Improve'    
    },
  ];

  // ─── Thought Actions ──────────────────────────────────────────────────────
  const openNewForm = (category: ThoughtCategory) => {
    setEditingThoughtId(null);
    setThoughtTitle('');
    setThoughtContent('');
    setThoughtCategory(category);
    setThoughtTags('');
    setThoughtPriority('medium');
    setIsStarredInput(false);
    setShowAddForm(true);
  };

  const openEditForm = (thought: ThoughtItem) => {
    setEditingThoughtId(thought.id);
    setThoughtTitle(thought.title);
    setThoughtContent(thought.content);
    setThoughtCategory(thought.category);
    setThoughtTags((thought.tags || []).join(', '));
    setThoughtPriority(thought.priority || 'medium');
    setIsStarredInput(!!thought.isStarred);
    setShowAddForm(true);
  };

  const handleSaveThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtTitle.trim()) return;

    const parsedTags = thoughtTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (editingThoughtId) {
      onUpdateThought?.(editingThoughtId, {
        title: thoughtTitle.trim(),
        content: thoughtContent.trim(),
        category: thoughtCategory,
        tags: parsedTags,
        priority: thoughtPriority,
        isStarred: isStarredInput,
      });
    } else {
      const newThought: ThoughtItem = {
        id: `thought_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: thoughtTitle.trim(),
        content: thoughtContent.trim(),
        category: thoughtCategory,
        tags: parsedTags,
        priority: thoughtPriority,
        isStarred: isStarredInput,
        createdAt: Date.now(),
      };
      onAddThought?.(newThought);
    }

    setShowAddForm(false);
    setEditingThoughtId(null);
  };

  const handleCopyContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Render Thoughts Section for (personal | financial | technical) ───────
  const renderThoughtsSection = (category: ThoughtCategory) => {
    const config = {
      personal: {
        title: '🧠 Personal Thoughts & Mindset',
        desc: 'Daily reflections, growth observations, mental models, and life principles.',
        placeholder: 'e.g. Morning routine takeaway, discipline breakthrough...',
        color: '#8b5cf6',
        badgeBg: 'rgba(139,92,246,0.15)',
        badgeText: '#7c3aed',
      },
      financial: {
        title: '💰 Financial Thoughts & Strategy',
        desc: 'Budgeting insights, investment thesis, revenue ideas, and wealth systems.',
        placeholder: 'e.g. Monthly SIP review, passive income roadmap, expenditure rule...',
        color: '#059669',
        badgeBg: 'rgba(5,150,105,0.15)',
        badgeText: '#047857',
      },
      technical: {
        title: '💡 Technical Ideas & Architecture',
        desc: 'System architectures, algorithm blueprints, app concepts & developer innovations.',
        placeholder: 'e.g. Distributed caching architecture, React micro-optimization...',
        color: '#3b82f6',
        badgeBg: 'rgba(59,130,246,0.15)',
        badgeText: '#2563eb',
      },
    }[category];

    const categoryThoughts = thoughts.filter(t => t.category === category);
    
    // Filter by search & tags
    const filtered = categoryThoughts.filter(t => {
      const matchSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchTag = !activeFilterTag || 
        (activeFilterTag === '__starred__' ? t.isStarred : (t.tags || []).includes(activeFilterTag));

      return matchSearch && matchTag;
    });

    const allTags = Array.from(new Set(categoryThoughts.flatMap(t => t.tags || [])));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header & New Thought Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: D.text }}>{config.title}</div>
            <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>{config.desc}</div>
          </div>
          <button
            onClick={() => openNewForm(category)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: D.accentGr,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={14} />
            <span>+ New {category === 'technical' ? 'Idea' : 'Thought'}</span>
          </button>
        </div>

        {/* Search & Tags Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
            background: D.inputBg, border: `1px solid ${D.border}`, borderRadius: 10, padding: '7px 12px',
          }}>
            <Search size={14} style={{ color: D.textMut }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category} thoughts...`}
              style={{
                width: '100%', border: 'none', background: 'transparent', color: D.text,
                fontSize: 12, fontWeight: 600, outline: 'none',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: D.textMut, cursor: 'pointer' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilterTag(null)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${!activeFilterTag ? config.color : D.border}`,
                background: !activeFilterTag ? config.badgeBg : 'transparent',
                color: !activeFilterTag ? config.badgeText : D.textSub,
              }}
            >
              All ({categoryThoughts.length})
            </button>

            <button
              onClick={() => setActiveFilterTag(activeFilterTag === '__starred__' ? null : '__starred__')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${activeFilterTag === '__starred__' ? '#eab308' : D.border}`,
                background: activeFilterTag === '__starred__' ? 'rgba(234,179,8,0.15)' : 'transparent',
                color: activeFilterTag === '__starred__' ? '#ca8a04' : D.textSub,
              }}
            >
              <Star size={11} fill={activeFilterTag === '__starred__' ? '#ca8a04' : 'none'} />
              <span>Starred</span>
            </button>

            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setActiveFilterTag(activeFilterTag === tag ? null : tag)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${activeFilterTag === tag ? D.accent : D.border}`,
                  background: activeFilterTag === tag ? D.tabBg : 'transparent',
                  color: activeFilterTag === tag ? D.accent : D.textSub,
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Add / Edit Form Modal/Card */}
        {showAddForm && (
          <form onSubmit={handleSaveThought} style={{
            background: isDarkMode ? '#13192b' : '#f8fafc',
            border: `1.5px solid ${config.color}50`,
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: config.color }}>
                {editingThoughtId ? 'Edit Entry' : `New ${category === 'technical' ? 'Technical Idea' : 'Thought'}`}
              </span>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: D.textMut, cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            {/* Title */}
            <input
              value={thoughtTitle}
              onChange={e => setThoughtTitle(e.target.value)}
              placeholder="Title / Heading (e.g. Key takeaway, investment rule, architecture pattern...)"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9,
                border: `1.5px solid ${D.border}`, background: D.inputBg, color: D.text,
                fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
              }}
            />

            {/* Content Note */}
            <textarea
              value={thoughtContent}
              onChange={e => setThoughtContent(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9,
                border: `1.5px solid ${D.border}`, background: D.inputBg, color: D.text,
                fontSize: 12, lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* Metadata inputs row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {/* Category */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.textMut, marginBottom: 4 }}>Category</div>
                <select
                  value={thoughtCategory}
                  onChange={e => setThoughtCategory(e.target.value as ThoughtCategory)}
                  style={{
                    width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${D.border}`,
                    background: D.inputBg, color: D.text, fontSize: 12, fontWeight: 600, outline: 'none',
                  }}
                >
                  <option value="personal">🧠 Personal</option>
                  <option value="financial">💰 Financial</option>
                  <option value="technical">💡 Technical</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.textMut, marginBottom: 4 }}>Priority</div>
                <select
                  value={thoughtPriority}
                  onChange={e => setThoughtPriority(e.target.value as 'low' | 'medium' | 'high')}
                  style={{
                    width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${D.border}`,
                    background: D.inputBg, color: D.text, fontSize: 12, fontWeight: 600, outline: 'none',
                  }}
                >
                  <option value="high">🔥 High Priority</option>
                  <option value="medium">⚡ Medium Priority</option>
                  <option value="low">🌿 Low Priority</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.textMut, marginBottom: 4 }}>Tags (comma-separated)</div>
                <input
                  value={thoughtTags}
                  onChange={e => setThoughtTags(e.target.value)}
                  placeholder="mindset, habit, scale"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${D.border}`,
                    background: D.inputBg, color: D.text, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Star Toggle */}
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: D.text, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isStarredInput}
                    onChange={e => setIsStarredInput(e.target.checked)}
                    style={{ accentColor: '#eab308' }}
                  />
                  <span>⭐ Favorite / Starred</span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${D.border}`,
                  background: 'transparent', color: D.textSub, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: D.accentGr, color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                }}
              >
                {editingThoughtId ? 'Update Entry' : 'Save to Database'}
              </button>
            </div>
          </form>
        )}

        {/* Thoughts List */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '36px 20px', background: D.cardBg,
            borderRadius: 14, border: `1.5px dashed ${D.border}`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{category === 'personal' ? '🧠' : category === 'financial' ? '💎' : '💡'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: D.text }}>No {category} thoughts recorded yet.</div>
            <div style={{ fontSize: 12, color: D.textMut, marginTop: 4 }}>
              Click "+ New {category === 'technical' ? 'Idea' : 'Thought'}" above to save your insights directly to database.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(thought => (
              <div
                key={thought.id}
                style={{
                  background: D.cardBg,
                  border: `1.5px solid ${thought.isStarred ? '#eab30860' : D.cardBorder}`,
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: thought.isStarred ? '0 4px 16px rgba(234,179,8,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Top Bar: Priority + Star */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                        background: thought.priority === 'high' ? 'rgba(239,68,68,0.15)' : thought.priority === 'medium' ? 'rgba(234,179,8,0.15)' : 'rgba(16,185,129,0.15)',
                        color: thought.priority === 'high' ? D.red : thought.priority === 'medium' ? D.yellow : D.green,
                        textTransform: 'uppercase',
                      }}>
                        {thought.priority === 'high' ? '🔥 High' : thought.priority === 'medium' ? '⚡ Med' : '🌿 Low'}
                      </span>
                      <span style={{ fontSize: 10, color: D.textMut, fontWeight: 600 }}>
                        {new Date(thought.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleStarThought?.(thought.id)}
                      title={thought.isStarred ? 'Unstar' : 'Star'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={15}
                        fill={thought.isStarred ? '#eab308' : 'none'}
                        color={thought.isStarred ? '#eab308' : D.textMut}
                      />
                    </button>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize: 14, fontWeight: 900, color: D.text, lineHeight: 1.3, marginBottom: 6 }}>
                    {thought.title}
                  </div>

                  {/* Content */}
                  {thought.content && (
                    <div style={{
                      fontSize: 12, color: D.textSub, lineHeight: 1.6,
                      whiteSpace: 'pre-line', marginBottom: 10,
                      maxHeight: 120, overflowY: 'auto',
                    }}>
                      {thought.content}
                    </div>
                  )}

                  {/* Tag chips */}
                  {thought.tags && thought.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {thought.tags.map(t => (
                        <span
                          key={t}
                          onClick={() => setActiveFilterTag(t)}
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            background: D.tabBg, color: D.accent, cursor: 'pointer',
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: `1px solid ${D.border}`, paddingTop: 8, marginTop: 4,
                }}>
                  <button
                    onClick={() => handleCopyContent(thought.id, `${thought.title}\n\n${thought.content}`)}
                    title="Copy note"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, background: 'none',
                      border: 'none', fontSize: 11, fontWeight: 700, color: D.textMut, cursor: 'pointer',
                    }}
                  >
                    {copiedId === thought.id ? <Check size={12} color={D.green} /> : <Copy size={12} />}
                    <span>{copiedId === thought.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => openEditForm(thought)}
                      title="Edit"
                      style={{ background: 'none', border: 'none', color: D.textSub, cursor: 'pointer', padding: 3 }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteThought?.(thought.id)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', color: D.red, cursor: 'pointer', padding: 3 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <div style={{ fontSize: 16, fontWeight: 900, color: D.text }}>🧑‍💻 Coding Profiles Analysis</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Your competitive programming portfolio at a glance.</div>
        </div>

        {/* Hero stats bar */}
        <div style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.04) 100%)',
          border: `1.5px solid ${D.borderAcc}`,
          borderRadius: 14, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                {hasAccount && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${p.gradFrom}, ${p.gradTo})`, opacity: 0.8 }}/>
                )}

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
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      {stat.solved != null && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.solved}</span><span style={{ color: D.textMut }}> solved</span></div>}
                      {stat.rating != null && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.rating}</span><span style={{ color: D.textMut }}> rating</span></div>}
                      {stat.rank && <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: p.color }}>{stat.rank}</span></div>}
                      <div style={{ fontSize: 12 }}><span style={{ fontWeight: 800, color: D.yellow }}>{streak}🔥</span></div>
                    </div>

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
      </div>
    );
  };

  // ─── Improve tab ───────────────────────────────────────────────────────────
  const renderImprove = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: D.text }}>🚀 Level Up & Habit Growth Strategy</div>
          <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>Actionable insights to maximize your consistency and Solo Leveling rank.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Flame size={16} color={D.orange} />
              <span style={{ fontSize: 13, fontWeight: 800, color: D.text }}>Streak Compounding Effect</span>
            </div>
            <p style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>
              Completing daily tasks every single day compounds your XP multipliers. Consistency beats intensity every time.
            </p>
          </div>

          <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Brain size={16} color={D.accent} />
              <span style={{ fontSize: 13, fontWeight: 800, color: D.text }}>Deep Work Habit Blocks</span>
            </div>
            <p style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>
              Pair your coding problems with uninterrupted 90-minute study blocks. Write down your personal insights in the Thoughts tab.
            </p>
          </div>

          <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <TrendingUp size={16} color={D.green} />
              <span style={{ fontSize: 13, fontWeight: 800, color: D.text }}>Financial & Career Systems</span>
            </div>
            <p style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>
              Set measurable targets for skills, side-projects, and savings. Document your technical ideas for high-leverage outcomes.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Shell ────────────────────────────────────────────────────────────────
  return (
    <div id="live-performance-deck" style={{
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif',
      marginTop: '16px',
      marginBottom: '24px',
    }}>
      {/* ── Toggle Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        boxSizing: 'border-box',
        marginBottom: isExpanded ? '16px' : '0px',
      }}>
        <button
          onClick={() => setIsExpanded(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '10px',
            border: `1px solid ${D.btnBorder}`,
            background: D.btnBg,
            color: D.text,
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = D.btnHover}
          onMouseLeave={e => e.currentTarget.style.background = D.btnBg}
        >
          <Layers size={14} style={{ color: '#818cf8' }} />
          <span>
            {isExpanded ? 'Hide Ideas & Platform Deck' : 'Show Ideas & Platform Deck'}
          </span>
          {isExpanded ? (
            <ChevronUp size={13} style={{ opacity: 0.8 }} />
          ) : (
            <ChevronDown size={13} style={{ opacity: 0.8 }} />
          )}
        </button>

        <div style={{
          fontSize: '11.5px',
          color: D.textMut,
          fontWeight: '700',
          letterSpacing: '0.2px',
        }}>
          Knowledge & Platform Deck • {user.hunterRank || 'E'}-Rank Hunter
        </div>
      </div>

      {/* ── Expandable Panel ── */}
      {isExpanded && (
        <div style={{
          background: D.panelBg,
          border: `1.5px solid ${D.border}`,
          borderRadius: '18px',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(99, 102, 241, 0.05)'
            : '0 10px 30px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}>
          {/* Tab navigation */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${D.border}`,
            paddingLeft: 16,
            paddingRight: 16,
            background: isDarkMode ? 'rgba(255,255,255,0.01)' : '#ffffff',
            overflowX: 'auto',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowAddForm(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  position: 'relative',
                  padding: '12px 16px 14px',
                  border: 'none',
                  borderBottom: `2.5px solid ${activeTab === tab.id ? D.accent : 'transparent'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: activeTab === tab.id ? (isDarkMode ? '#ffffff' : '#000000') : D.textSub,
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 900 : 600,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span style={{
                    marginLeft: 2,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === tab.id ? D.accent : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                    color: activeTab === tab.id ? '#ffffff' : D.textSub,
                    fontSize: 10,
                    fontWeight: 800,
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            padding: '20px',
            scrollbarWidth: 'thin',
          }}>
            {activeTab === 'personal'  && renderThoughtsSection('personal')}
            {activeTab === 'financial' && renderThoughtsSection('financial')}
            {activeTab === 'technical' && renderThoughtsSection('technical')}
            {activeTab === 'profiles'  && renderProfiles()}
            {activeTab === 'improve'   && renderImprove()}
          </div>
        </div>
      )}
    </div>
  );
};
