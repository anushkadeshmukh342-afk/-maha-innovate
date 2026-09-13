import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertCircle, ArrowRight, Award, BarChart3, Bell, Building2, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, Clock3,
  FileCheck2, FileText, Filter, Globe2, Home, Info, Landmark, LayoutDashboard, LifeBuoy,
  ListChecks, Map, Menu, MessageSquare, MoreHorizontal, Network, PackageCheck, PanelLeft,
  Plus, Search, Scale, Settings, ShieldCheck, Sparkles, Target, TrendingUp, UploadCloud,
  Users, WalletCards, X, Zap, LogIn, UserPlus, Mail, LockKeyhole
} from 'lucide-react';
import './styles.css';

async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(path, {
    credentials: 'include',
    headers: isFormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Unable to complete this action.');
  return body;
}

const navByRole = {
  officer: [
    ['Dashboard', LayoutDashboard], ['Problems', ListChecks], ['AI Matches', Sparkles],
    ['Compare & Shortlist', Scale], ['Shortlisted Startups', Users], ['Trials', Activity],
    ['Decisions', ClipboardCheck], ['Documents', FileText], ['Notifications', Bell],
    ['Profile', Users], ['Audit Trail', ShieldCheck]
  ],
  startup: [
    ['Dashboard', LayoutDashboard], ['Opportunities', Target], ['Applications & Trials', FileCheck2],
    ['Notifications', Bell], ['Documents', FileText], ['Profile', Users], ['Trust Passport', ShieldCheck],
    ['Grievances', LifeBuoy]
  ],
  admin: [
    ['State Overview', LayoutDashboard], ['Departments', Building2], ['Startups', Users], ['Pilots', Activity],
    ['Procurement', PackageCheck], ['Innovation Map', Map], ['Policy Compliance', ShieldCheck],
    ['ROI & Impact', TrendingUp], ['Grievances', LifeBuoy], ['Audit Logs', FileText],
    ['Notifications', Bell], ['Profile', Users]
  ]
};

const problems = [
  { id: 'MH-PROB-026', title: 'Improve urban waste segregation', department: 'Pune Municipal Corporation', district: 'Pune', sector: 'CleanTech', budget: '₹8 lakh', deadline: '28 Sep 2026', stage: 'Open for pilot', match: 91, current: '42%', target: '70%+' },
  { id: 'MH-PROB-021', title: 'Reduce water leakage in municipal zones', department: 'Maharashtra Jeevan Pradhikaran', district: 'Nashik', sector: 'Water & Utilities', budget: '₹12 lakh', deadline: '04 Oct 2026', stage: 'Shortlisting', match: 86, current: '31%', target: '15%' },
  { id: 'MH-PROB-019', title: 'Improve last-mile primary health access', department: 'Public Health Department', district: 'Gadchiroli', sector: 'HealthTech', budget: '₹15 lakh', deadline: '12 Oct 2026', stage: 'Open for pilot', match: 79, current: '58%', target: '85%' },
  { id: 'MH-PROB-017', title: 'Predictive maintenance for street lights', department: 'Thane Municipal Corporation', district: 'Thane', sector: 'CivicTech', budget: '₹10 lakh', deadline: '19 Oct 2026', stage: 'Open for pilot', match: 74, current: '66%', target: '92%' }
];

const startups = [
  { name: 'EcoVision AI', initials: 'EV', sector: 'CleanTech', city: 'Pune', match: 91, problem: 96, tech: 91, budget: 95, readiness: 82, status: 'Eligible', score: 82, pilots: 3, kpi: 94, color: 'violet' },
  { name: 'CivicFlow Labs', initials: 'CF', sector: 'CivicTech', city: 'Mumbai', match: 87, problem: 89, tech: 88, budget: 92, readiness: 86, status: 'Conditionally eligible', score: 76, pilots: 2, kpi: 88, color: 'blue' },
  { name: 'SortSmart Technologies', initials: 'ST', sector: 'CleanTech', city: 'Nagpur', match: 79, problem: 83, tech: 76, budget: 84, readiness: 78, status: 'Eligible', score: 71, pilots: 1, kpi: 81, color: 'orange' }
];

const milestones = [
  { title: 'Agreement & onboarding', amount: '₹1,00,000', status: 'Completed', date: '12 Aug 2026', detail: 'Agreement signed and deployment plan approved.' },
  { title: 'Deployment', amount: '₹2,00,000', status: 'Completed', date: '22 Aug 2026', detail: 'Sensors installed across 4 ward facilities.' },
  { title: 'Initial performance', amount: '₹2,00,000', status: 'In progress', date: 'Due 18 Sep 2026', detail: 'Collecting baseline and first 30-day results.' },
  { title: 'Field performance', amount: '₹2,00,000', status: 'Locked', date: 'Unlocks after milestone 3', detail: 'Requires verified initial performance evidence.' },
  { title: 'Final evaluation', amount: '₹1,00,000', status: 'Locked', date: 'After field performance', detail: 'Officer evaluation and scale recommendation.' }
];

const auditEvents = [
  ['09 Sep · 10:42', 'Department posted requirement', 'Pune Municipal Corporation', 'Completed'],
  ['09 Sep · 11:03', 'AI generated startup matches', 'GOV INNOVATE matching engine', 'Completed'],
  ['10 Sep · 14:20', 'Officer shortlisted 3 startups', 'Priya Deshmukh · PMC', 'Completed'],
  ['12 Sep · 09:45', 'Pilot approved', 'MH-INNO-2026-00482', 'Completed'],
  ['15 Sep · 16:32', 'Startup submitted milestone evidence', 'EcoVision AI', 'Awaiting review']
];

const translations = {
  hi: {
    'Dashboard':'डैशबोर्ड','Problems':'समस्याएँ','AI Matches':'AI मिलान','Compare & Shortlist':'तुलना और शॉर्टलिस्ट',
    'Shortlisted Startups':'शॉर्टलिस्ट किए गए स्टार्टअप','Trials':'पायलट','Decisions':'निर्णय','Documents':'दस्तावेज़',
    'Notifications':'सूचनाएँ','Profile':'प्रोफ़ाइल','Audit Trail':'ऑडिट ट्रेल','Opportunities':'अवसर',
    'Applications & Trials':'आवेदन और पायलट','Trust Passport':'ट्रस्ट पासपोर्ट','Grievances':'शिकायतें',
    'State Overview':'राज्य अवलोकन','Departments':'विभाग','Startups':'स्टार्टअप','Pilots':'पायलट',
    'Procurement':'सरकारी खरीद','Innovation Map':'नवाचार मानचित्र','Policy Compliance':'नीति अनुपालन',
    'ROI & Impact':'ROI और प्रभाव','Audit Logs':'ऑडिट लॉग','Government Officer':'सरकारी अधिकारी',
    'Startup':'स्टार्टअप','State Administrator':'राज्य प्रशासक','Help & guidance':'सहायता और मार्गदर्शन','Settings':'सेटिंग्स',
    'English':'अंग्रेज़ी','Hindi':'हिन्दी','Marathi':'मराठी'
  },
  mr: {
    'Dashboard':'डॅशबोर्ड','Problems':'समस्या','AI Matches':'AI जुळणी','Compare & Shortlist':'तुलना आणि शॉर्टलिस्ट',
    'Shortlisted Startups':'शॉर्टलिस्ट केलेले स्टार्टअप','Trials':'पायलट','Decisions':'निर्णय','Documents':'कागदपत्रे',
    'Notifications':'सूचना','Profile':'प्रोफाइल','Audit Trail':'ऑडिट ट्रेल','Opportunities':'संधी',
    'Applications & Trials':'अर्ज आणि पायलट','Trust Passport':'ट्रस्ट पासपोर्ट','Grievances':'तक्रारी',
    'State Overview':'राज्य आढावा','Departments':'विभाग','Startups':'स्टार्टअप','Pilots':'पायलट',
    'Procurement':'शासकीय खरेदी','Innovation Map':'नाविन्य नकाशा','Policy Compliance':'धोरण अनुपालन',
    'ROI & Impact':'ROI आणि परिणाम','Audit Logs':'ऑडिट लॉग','Government Officer':'शासकीय अधिकारी',
    'Startup':'स्टार्टअप','State Administrator':'राज्य प्रशासक','Help & guidance':'मदत आणि मार्गदर्शन','Settings':'सेटिंग्ज',
    'English':'इंग्रजी','Hindi':'हिंदी','Marathi':'मराठी'
  }
};
function applyLanguage(language) {
  const map = translations[language] || {};
  document.documentElement.lang = language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = map[key] || key;
  });
}

function translatePage(language) {
  const map = translations[language] || {};
  if (!Object.keys(map).length) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(textNode => {
    const parent = textNode.parentElement;
    if (!parent || ['SCRIPT','STYLE','OPTION','INPUT','TEXTAREA'].includes(parent.tagName)) return;
    const raw = textNode.nodeValue.trim();
    if (!raw || raw.length > 80) return;
    const translated = map[raw];
    if (translated && translated !== raw) textNode.nodeValue = textNode.nodeValue.replace(raw, translated);
  });
}


function App() {
  const [role, setRole] = useState('officer');
  const [page, setPage] = useState('Dashboard');
  const [publicMode, setPublicMode] = useState(true);
  const [authMode, setAuthMode] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem('gov-innovate-language') || 'en');
  const [unreadCount, setUnreadCount] = useState(0);

  const nav = navByRole[role];
  useEffect(() => {
    localStorage.setItem('gov-innovate-language', language);
    const timer = window.setTimeout(() => { applyLanguage(language); translatePage(language); }, 0);
    return () => window.clearTimeout(timer);
  }, [language, page, role, authUser]);
  useEffect(() => {
    fetch('/api/auth/me').then(response => response.ok ? response.json() : null)
      .then(user => { if (user?.user) { setAuthUser(user.user); setRole(user.user.role); } })
      .catch(() => {});
  }, []);
  // Poll unread notification count every 60s when authenticated
  useEffect(() => {
    if (!authUser) return;
    const load = () => apiRequest('/api/notifications').then(b => setUnreadCount(b?.unread || 0)).catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [authUser]);
  const logout = async () => {
    try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch {}
    setAuthUser(null); setRole('officer'); setPublicMode(true); setUnreadCount(0);
  };
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };
  useEffect(() => {
    const handler = (event) => jump(event.detail);
    window.addEventListener('gov-jump', handler);
    return () => window.removeEventListener('gov-jump', handler);
  }, []);
  const jump = (nextPage, message) => {
    setPublicMode(false);
    setPage(nextPage);
    setMobileNav(false);
    if (message) notify(message);
  };

  if (authMode) {
    return <AuthView mode={authMode} onBack={() => setAuthMode(null)} onSuccess={(user) => {
      setAuthUser(user);
      setRole(user.role);
      setPage('Dashboard');
      setAuthMode(null);
      setPublicMode(false);
    }} />;
  }

  if (publicMode) {
    return <Landing
      onEnter={() => { setPublicMode(false); setPage('Dashboard'); }}
      onLogin={() => setAuthMode('login')}
      onRegister={() => setAuthMode('register')}
    />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={20} /></button>
        <button className="brand" onClick={() => setPublicMode(true)} aria-label="Go to public home">
          <span className="brand-mark"><span /></span>
          <span><strong>GOV</strong><em>INNOVATE</em><small>Innovation Procurement Platform</small></span>
        </button>
        <div className="topbar-center">
          <div className="global-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search startup, problem, pilot or case ID" /><kbd>⌘ K</kbd></div>
        </div>
        <div className="top-actions">
            <div className="demo-switcher">
             <span className="demo-dot" /> {authUser ? 'Signed in' : 'Demo mode'}
             {authUser ? <strong>{authUser.name}</strong> : <><select value={role} onChange={e => { setRole(e.target.value); setPage('Dashboard'); }} aria-label="Switch demo role">
               <option value="officer">Government Officer</option>
               <option value="startup">Startup</option>
               <option value="admin">State Administrator</option>
             </select><ChevronDown size={14} /></>}
          </div>
          <label className="language-select" title="Interface language"><Globe2 size={16} /><select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></label><button className="icon-btn notification-btn" aria-label="Notifications" onClick={() => { jump('Notifications'); setUnreadCount(0); }}><Bell size={18} />{unreadCount > 0 && <i>{unreadCount > 99 ? '99+' : unreadCount}</i>}</button>
          {authUser && <button className="icon-btn" title="Log out" aria-label="Log out" onClick={logout} style={{fontSize:'12px',padding:'4px 8px',borderRadius:'6px',color:'var(--muted)'}}><LogIn size={15} style={{transform:'scaleX(-1)'}} /></button>}
          <div className="user-avatar">{(authUser?.name || (role === 'startup' ? 'Startup' : role === 'admin' ? 'Admin' : 'Officer')).split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div>
        </div>
      </header>

      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="sidebar-heading">
          <span>{role === 'officer' ? 'Department workspace' : role === 'startup' ? 'Startup workspace' : 'State view'}</span>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={17} /></button>
        </div>
        <nav>
          {nav.map(([label, Icon]) => <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => jump(label)}><Icon size={17} /><span data-i18n={label}>{label}</span>{label === 'AI Matches' && <b className="nav-count">3</b>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setDialog('help')}><CircleHelp size={17} /><span>Help & guidance</span></button>
          <button className="nav-item" onClick={() => setDialog('settings')}><Settings size={17} /><span>Settings</span></button>
          <div className="policy-note"><ShieldCheck size={16} /><div><strong>Built for accountable innovation</strong><span>Every decision has a traceable record.</span></div></div>
        </div>
      </aside>

       <main className="main-content">
        <div className="page-wrap">
          <div className="breadcrumb"><span>GOV INNOVATE</span><ChevronRight size={13} /><strong>{page}</strong>{!authUser && <span className="demo-label">DEMO MODE</span>}</div>
          <PageContent role={role} page={page} jump={jump} notify={notify} openDialog={setDialog} authUser={authUser} />
        </div>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={17} /><span>{toast}</span></div>}
       {dialog && <Dialog kind={dialog} onClose={() => setDialog(null)} notify={notify} jump={jump} />}
    </div>
  );
}

function Landing({ onEnter, onLogin, onRegister }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <button className="brand light-brand"><span className="brand-mark"><span /></span><span><strong>GOV</strong><em>INNOVATE</em><small>Maharashtra Innovation Procurement Platform</small></span></button>
        <div className="landing-links"><a href="#how">How it works</a><a href="#impact">Public impact</a><a href="#trust">Trust & compliance</a><button className="text-btn" onClick={onLogin}><LogIn size={15} /> Log in</button><button className="outline-btn" onClick={onRegister}><UserPlus size={15} /> Register</button></div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Maharashtra government innovation layer</div>
          <h1>From Government Problems to <span>Proven Solutions.</span></h1>
          <p>GOV INNOVATE helps Maharashtra government departments discover startups, test solutions through small trials, evaluate results, and adopt what works.</p>
          <div className="hero-actions"><button className="primary-btn large" onClick={onEnter}>Explore the demo workspace <ArrowRight size={17} /></button><button className="text-btn" onClick={onRegister}>Register your startup <ChevronRight size={16} /></button></div>
          <div className="hero-meta"><div><strong>18</strong><span>sample opportunities</span></div><div><strong>06</strong><span>pilots in progress</span></div><div><strong>4.6/5</strong><span>officer experience</span></div></div>
        </div>
        <div className="hero-visual">
          <div className="visual-orb orb-one" /><div className="visual-orb orb-two" />
          <div className="journey-card">
            <div className="journey-top"><span>THE INNOVATION JOURNEY</span><span className="live-pill"><i /> Demo flow</span></div>
            <div className="journey-path">{['Post problem', 'Find startups', 'Compare', 'Trial', 'Evaluate', 'Decide', 'Scale'].map((item, i) => <React.Fragment key={item}><div className={`journey-node ${i < 3 ? 'done' : ''}`}><span>{i < 3 ? <Check size={14} /> : i + 1}</span><b>{item}</b><small>{['Government need', 'Best-fit options', 'Check evidence', 'Small-scale test', 'Measure KPIs', 'Officer decision', 'Repeat success'][i]}</small></div>{i < 6 && <div className={`journey-line ${i < 2 ? 'done' : ''}`} />}</React.Fragment>)}</div>
            <div className="journey-insight"><Sparkles size={17} /><div><strong>AI-assisted, officer-led</strong><span>Recommendations explain the “why”. Final decisions stay with authorized officers.</span></div></div>
          </div>
          <div className="float-card problem-float"><div className="float-icon purple"><Target size={16} /></div><div><small>OPEN PROBLEM</small><strong>Urban waste segregation</strong><span>Pune · ₹8 lakh pilot</span></div><span className="float-score">91%</span></div>
          <div className="float-card result-float"><div className="float-icon green"><TrendingUp size={16} /></div><div><small>PILOT RESULT</small><strong>93% accuracy</strong><span>EcoVision AI · 103% of KPI</span></div></div>
        </div>
      </section>
       <section className="flow-section" id="how"><div className="section-kicker">HOW IT WORKS</div><h2>One clear journey from a public need<br /><span>to a proven solution.</span></h2><p className="section-lead">Government posts a problem. Startups propose a fit. A small trial creates evidence before an authorized officer decides what happens next.</p><div className="flow-grid">{[['01','Post a problem','A department defines the outcome, budget, timeline and success measures.'],['02','Find and compare','The platform finds suitable startups and shows why each one fits.'],['03','Trial and decide','Teams run a small trial, review results and recommend what happens next.']].map(([n,t,d]) => <div className="flow-item" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><ArrowRight size={17} /></div>)}</div><div className="role-cards"><div><strong>Government Officer</strong><span>I have a government problem.</span></div><div><strong>Startup</strong><span>I have an innovative solution.</span></div><div><strong>State Administrator</strong><span>I monitor and improve the ecosystem.</span></div></div></section>
       <section className="feature-section"><div className="section-kicker">SUPPORTING CAPABILITIES</div><h2>Everything needed to move<br /><span>from problem to proof.</span></h2><div className="feature-grid">{[['Smart Notifications','Keeps startups and officers updated at every important step.',Bell],['Automatic Startup Matching','Finds startups that best fit the government’s problem.',Sparkles],['Explainable Scoring & Comparison','Shows why a startup is recommended and lets officers compare options.',BarChart3],['Trial + KPI Evaluation','Tests the solution and measures whether it meets defined targets.',ClipboardCheck],['Application & Status Tracking','Tracks every application from submission to final outcome.',FileCheck2]].map(([title, description, Icon]) => <div className="feature-card" key={title}><div className="feature-icon"><Icon size={18} /></div><strong>{title}</strong><p>{description}</p></div>)}</div></section>
      <section className="impact-section" id="impact"><div><div className="section-kicker">Public transparency</div><h2>Small pilots.<br /><span>State-wide impact.</span></h2><p>Sample metrics from the demo environment. Live program data is shown only when verified by the relevant authority.</p></div><div className="impact-stats">{[['08','Startups onboarded'],['04','Government departments'],['06','Pilots completed'],['03','Solutions scaled']].map(([n,l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div></section>
      <footer className="landing-footer"><span>© 2026 Government of Maharashtra · Demo environment</span><span>Procurement · Eligibility · Compliance · Grievance</span></footer>
    </div>
  );
}

function PageContent({ role, page, jump, notify, openDialog, authUser }) {
  if (role === 'officer') return <OfficerPage page={page} jump={jump} notify={notify} openDialog={openDialog} authUser={authUser} />;
  if (role === 'startup') return <StartupPage page={page} jump={jump} notify={notify} openDialog={openDialog} authUser={authUser} />;
  return <AdminPage page={page} jump={jump} notify={notify} authUser={authUser} />;
}

function OfficerPage({ page, jump, notify, openDialog, authUser }) {
  if (page === 'Dashboard' || page === 'Overview') return <OfficerOverview jump={jump} openDialog={openDialog} authUser={authUser} />;
  if (page === 'Problems') return <ProblemsPage jump={jump} openDialog={openDialog} notify={notify} />;
  if (page === 'AI Matches') return <MatchesPage jump={jump} notify={notify} openDialog={openDialog} />;
  if (page === 'Compare & Shortlist') return <ComparisonPage jump={jump} notify={notify} openDialog={openDialog} />;
  if (page === 'Shortlisted Startups') return <ShortlistedStartupsPage jump={jump} notify={notify} />;
  if (page === 'Trials') return <PilotPage openDialog={openDialog} notify={notify} jump={jump} />;
  if (page === 'Decisions') return <DecisionPage jump={jump} notify={notify} openDialog={openDialog} />;
  if (page === 'Documents') return <DocumentsPage notify={notify} />;
  if (page === 'Notifications') return <NotificationsPage notify={notify} jump={jump} role="officer" />;
  if (page === 'Profile') return <OfficerProfilePage notify={notify} authUser={authUser} />;
  if (page === 'Audit Trail') return <AuditPage notify={notify} />;
  return <OfficerOverview jump={jump} openDialog={openDialog} authUser={authUser} />;
}
function OfficerOverview({ jump, openDialog, authUser }) {
  const [stats, setStats] = useState({ activeProblems: null, applications: null, activeTrials: null, awaitingEval: null });
  const [recentProblems, setRecentProblems] = useState(null);
  const [liveAudit, setLiveAudit] = useState(null);
  useEffect(() => {
    apiRequest('/api/dashboard/stats').then(body => {
      if (body?.stats) setStats(body.stats);
      if (body?.recentProblems) setRecentProblems(body.recentProblems);
    }).catch(() => {});
    apiRequest('/api/audit').then(body => {
      if (body?.events?.length) setLiveAudit(body.events.slice(0, 4).map(e => [
        new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        e.summary, `${e.actor?.slice(0, 8) || 'system'} · ${e.entityType}`, e.role === 'system' ? 'System event' : 'Completed'
      ]));
    }).catch(() => {});
  }, []);
  const fmt = (n) => n === null ? '—' : String(n).padStart(2, '0');
  const statCards = [
    [fmt(stats.activeProblems), 'Active problems', stats.activeProblems === null ? 'Loading…' : `${stats.activeProblems} open`, Target, 'purple'],
    [fmt(stats.applications), 'Applications received', stats.applications === null ? 'Loading…' : `Total submissions`, FileCheck2, 'blue'],
    [fmt(stats.activeTrials), 'Pilots running', stats.activeTrials === null ? 'Loading…' : `Active trials`, Activity, 'orange'],
    [fmt(stats.awaitingEval), 'Awaiting evaluation', stats.awaitingEval === null ? 'Loading…' : 'Review needed', ClipboardCheck, 'green']
  ];
  const workItems = recentProblems?.length
    ? recentProblems.map(p => ({
        id: p.id, title: p.title, department: p.department,
        stage: p.status === 'OPEN' ? 'Open for pilot' : p.status === 'MATCHING' ? 'Matching' : p.status === 'SHORTLISTED' ? 'Shortlisting' : p.status,
        budget: p.budgetMax ? `₹${Math.round(p.budgetMax / 100000)} lakh` : 'TBD'
      }))
    : problems.slice(0, 3);
  const auditRows = liveAudit || auditEvents.slice(0, 4);
  return <>
    <PageHeader eyebrow="DEPARTMENT WORKSPACE" title={`Good morning, ${(authUser?.name || 'Officer').split(' ')[0]}.`} subtitle="Move a live government problem from discovery to a decision you can defend." action={<button className="primary-btn" onClick={() => openDialog('requirement')}><Plus size={17} /> Post a problem</button>} />
    <div className="journey-banner"><div className="banner-icon"><Sparkles size={22} /></div><div><strong>Try the complete procurement journey</strong><span>Explore how a problem becomes a pilot, then a procurement-ready decision pack.</span></div><button className="banner-btn" onClick={() => jump('AI Matches', 'Demo journey opened at explainable matches.')}>Continue journey <ArrowRight size={16} /></button></div>
    <div className="stat-grid">{statCards.map(([n,l,s,I,c]) => <div className="stat-card" key={l}><div className={`stat-icon ${c}`}><I size={18} /></div><strong>{n}</strong><span>{l}</span><small>{s}</small></div>)}</div>
    <div className="content-grid two-one"><section className="panel"><PanelTitle title="Your active work" action="View all" onClick={() => jump('Problems')} /><div className="work-list">{workItems.map(p => <div className="work-row" key={p.id}><div className="work-mark"><Target size={16} /></div><div className="work-main"><strong>{p.title}</strong><span>{p.department} · {p.id}</span></div><div className="work-status"><Badge type={p.stage.includes('Short') ? 'warning' : 'purple'}>{p.stage}</Badge><small>{p.budget}</small></div><ChevronRight size={16} className="row-arrow" /></div>)}</div></section><section className="panel"><PanelTitle title="Pilot health" action="View pilots" onClick={() => jump('Trials')} /><div className="health-score"><div className="ring"><strong>{stats.activeTrials ?? '—'}</strong><span> active</span></div><div><strong>{stats.activeTrials === null ? 'Loading…' : stats.activeTrials > 0 ? 'Active pilot portfolio' : 'No active pilots'}</strong><p>{stats.awaitingEval ? `${stats.awaitingEval} need officer evaluation.` : 'Start a trial from a shortlisted application.'}</p></div></div><div className="health-bars">{[['Active trials', stats.activeTrials ?? 0, 'green'], ['Awaiting evaluation', stats.awaitingEval ?? 0, 'orange']].map(([l,n,c]) => <div key={l}><span>{l}</span><div className="mini-bar"><i className={c} style={{ width: `${Math.min(100, n * 20)}%` }} /></div><b>{n}</b></div>)}</div></section></div>
    <div className="content-grid two-one"><section className="panel"><PanelTitle title="Recent activity" action="Audit trail" onClick={() => jump('Audit Trail')} /><div className="activity-list">{auditRows.map(([date, action, actor, status]) => <div className="activity-row" key={date + action}><span className="activity-time">{date}</span><span className="activity-dot" /><div><strong>{action}</strong><small>{actor}</small></div><Badge type={status === 'Completed' ? 'success' : status === 'System event' ? 'purple' : 'warning'}>{status}</Badge></div>)}</div></section><section className="panel opportunity-panel"><div className="panel-kicker"><TrendingUp size={15} /> SCALE SIGNAL</div><h3>{stats.awaitingEval ? `${stats.awaitingEval} evaluation(s) pending` : 'Innovation dashboard'}</h3><p>{stats.activeTrials ? `${stats.activeTrials} active trial(s) running. Review applications and shortlist new startups.` : 'Post a problem to begin the innovation journey from challenge to proven solution.'}</p><button className="text-btn" onClick={() => jump('AI Matches')}>Review opportunities <ArrowRight size={15} /></button></section></div>
  </>;
}

function ProblemsPage({ jump, openDialog, notify, role = 'officer' }) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All stages');
  const [district, setDistrict] = useState('All districts');
  const [liveProblems, setLiveProblems] = useState(null);

  const fetchProblems = () => {
    apiRequest('/api/problems').then(body => {
      const mapped = (body?.problems || []).map(p => ({
        ...p,
        district: p.location || 'Maharashtra',
        budget: p.budgetMax ? `₹${Math.round(p.budgetMax / 100000)} lakh` : 'To be defined',
        deadline: 'Open',
        stage: p.status === 'OPEN' ? 'Open for pilot' : p.status === 'MATCHING' ? 'Matching' : p.status === 'SHORTLISTED' ? 'Shortlisting' : p.status === 'TRIAL' ? 'In trial' : (p.status || 'Open for pilot'),
        match: 0
      }));
      setLiveProblems(mapped);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchProblems();
    const handler = () => fetchProblems();
    window.addEventListener('gov-problems-refresh', handler);
    return () => window.removeEventListener('gov-problems-refresh', handler);
  }, []);

  // Merge: live DB records first, then demo records not already in DB (by title dedup)
  const dbIds = new Set((liveProblems || []).map(p => p.id));
  const demoPadding = liveProblems !== null ? problems.filter(p => !dbIds.has(p.id)) : problems;
  const sourceProblems = liveProblems !== null
    ? [...liveProblems, ...demoPadding]
    : problems;
  const visible = sourceProblems.filter(p => {
    const haystack = `${p.title} ${p.department} ${p.district} ${p.sector}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) &&
      (stage === 'All stages' || p.stage === stage) &&
      (district === 'All districts' || p.district === district);
  });
  const stages = ['All stages', 'Open for pilot', 'Shortlisting'];
  const districts = ['All districts', ...new Set(sourceProblems.map(p => p.district))];
  const apply = (problem) => apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify({ problemId: problem.id, proposal: `Proposal from ${problem.sector} startup`, capabilities: problem.sector })
  }).then(() => notify?.('Application submitted. You can track it under Applications & Trials.'))
    .catch(error => notify?.(error.message.includes('Authentication') ? 'Sign in as a startup to apply.' : error.message));
  return <><PageHeader eyebrow={role === 'startup' ? 'STARTUP OPPORTUNITIES' : 'PROBLEM BANK'} title={role === 'startup' ? 'Government opportunities' : 'Government problems'} subtitle={role === 'startup' ? 'Review open problems and apply with a focused pilot proposal.' : 'Post an outcome to solve. Startups respond with a pilot proposal, not a generic product pitch.'} action={role === 'startup' ? null : <button className="primary-btn" onClick={() => openDialog('requirement')}><Plus size={17} /> Post a problem</button>} /><div className="filter-row"><div className="search-inline"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by problem, department or district" /></div><label className="filter-select"><Filter size={15} /><select value={stage} onChange={e => setStage(e.target.value)} aria-label="Filter by stage">{stages.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label><label className="filter-select"><Map size={15} /><select value={district} onChange={e => setDistrict(e.target.value)} aria-label="Filter by district">{districts.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label></div><div className="problem-table panel"><div className="table-caption"><strong>{visible.length} problems</strong><span>{liveProblems ? 'Live records from MongoDB' : 'Illustrative Demo Data'}</span></div><table><thead><tr><th>Problem</th><th>Department</th><th>Sector</th><th>Pilot budget</th><th>Stage</th><th /></tr></thead><tbody>{visible.length ? visible.map(p => <tr key={p.id}><td><div className="table-primary"><span className="table-id">{p.id}</span><strong>{p.title}</strong><small>{p.district} · Deadline {p.deadline}</small></div></td><td>{p.department}</td><td><Badge type="neutral">{p.sector}</Badge></td><td><strong>{p.budget}</strong><small>90 day pilot</small></td><td><Badge type={p.stage === 'Shortlisting' ? 'warning' : 'purple'}>{p.stage}</Badge></td><td><button className="row-action" onClick={() => role === 'startup' ? apply(p) : jump('AI Matches')}>{role === 'startup' ? 'Apply' : 'View'} <ChevronRight size={14} /></button></td></tr>) : <tr><td colSpan="6"><div className="empty-state"><Search size={19} /><strong>No matching problems</strong><span>Try another search, stage or district.</span></div></td></tr>}</tbody></table></div></>;
}

function MatchesPage({ jump, notify, openDialog }) {
  const [refreshing, setRefreshing] = useState(false);
  const [matchRows, setMatchRows] = useState(startups);
  useEffect(() => {
    apiRequest('/api/problems').then(async ({ problems: liveProblems }) => {
      const problem = liveProblems?.[0];
      if (!problem) return;
      const body = await apiRequest(`/api/problems/${problem.id}/matches`);
      if (body?.matches?.length) {
        setMatchRows(body.matches.map((match, index) => ({
          name: match.startup?.startupName || match.startup?.name || 'Registered startup',
          startupId: match.startup?.id,
          initials: (match.startup?.startupName || match.startup?.name || 'ST').slice(0, 2).toUpperCase(),
          sector: match.startup?.sector || problem.sector,
          city: match.startup?.profile?.location || 'Maharashtra',
          match: match.overallScore,
          problem: match.capabilityScore,
          tech: match.capabilityScore,
          budget: match.budgetScore,
          readiness: match.readinessScore,
          status: 'Review required',
          pilots: match.experienceScore >= 75 ? 2 : 0,
          color: ['violet', 'blue', 'orange'][index % 3],
          reasons: match.reasons
        })));
      }
    }).catch(() => {});
  }, []);
  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
    notify('Matching engine refreshed using the latest problem details.');
  };
  return <><PageHeader eyebrow="EXPLAINABLE MATCHING" title="Best-fit startups" subtitle="Recommendations are evidence-based suggestions. The authorized officer makes the final decision." action={<button className="outline-btn" onClick={refresh}><Sparkles size={16} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh matches'}</button>} /><div className="match-context"><div className="context-icon"><Target size={20} /></div><div><span>SELECTED PROBLEM · MH-PROB-026</span><strong>Improve urban waste segregation</strong><p>Pune Municipal Corporation · CleanTech · ₹8 lakh pilot · 90 days</p></div><button className="text-btn" onClick={() => openDialog('requirement')}>Edit problem <ChevronRight size={15} /></button></div><div className="match-layout"><section>{matchRows.map((s, i) => <div className="match-card panel" key={s.name}><div className="match-card-top"><div className={`startup-logo ${s.color}`}>{s.initials}</div><div className="startup-title"><strong>{s.name}</strong><span>{s.sector} · {s.city}</span><div><Badge type={s.status === 'Eligible' ? 'success' : 'warning'}>{s.status}</Badge><Badge type="neutral">{s.pilots} completed pilots</Badge></div></div><div className="match-score"><strong>{s.match}%</strong><span>overall match</span></div></div><div className="match-reasons"><div><strong>Why this startup?</strong><p>{s.reasons?.join('. ') || (i === 0 ? "The startup's computer vision solution addresses the same operational problem and falls within the proposed pilot budget." : i === 1 ? 'Strong municipal deployment fit and an implementation team already based in Maharashtra.' : 'Relevant waste-processing technology, with a smaller track record and a lower evidence level.')}</p></div><div className="match-metrics">{[['Problem fit',s.problem],['Technology fit',s.tech],['Budget fit',s.budget],['Pilot readiness',s.readiness]].map(([l,n]) => <div key={l}><span>{l}<b>{n}%</b></span><div className="metric-track"><i style={{width:`${n}%`}} /></div></div>)}</div></div><div className="match-actions"><button className="link-btn" onClick={() => openDialog('profile')}>View innovation profile <ArrowRight size={14} /></button><button className="secondary-btn" onClick={() => jump('Compare & Shortlist', `${s.name} added to comparison.`)}>Compare</button><button className="primary-btn small" onClick={async () => { try { const body = await apiRequest('/api/applications'); const app = body?.applications?.find(a => a.startupId === s.startupId); if (!app) { notify(`${s.name} must submit an application before it can be shortlisted.`); return; } await apiRequest(`/api/applications/${app.id}/shortlist`, { method:'POST' }); notify(`${s.name} shortlisted. Startup notified and audit trail updated.`); jump('Trials'); } catch (error) { notify(error.message); } }}>Shortlist startup</button></div></div>)}</section><aside className="match-aside panel"><div className="panel-kicker"><ShieldCheck size={15} /> ELIGIBILITY CHECK</div><h3>Eligibility is not the same as experience.</h3><p>A new startup can qualify when it meets the applicable requirements. Track record is shown separately as evidence.</p><div className="eligibility-item"><CheckCircle2 size={16} /><div><strong>Potentially eligible</strong><span>Document and sector checks passed</span></div></div><div className="eligibility-item"><Info size={16} /><div><strong>Evidence level: Emerging</strong><span>1 completed government pilot</span></div></div><div className="policy-box"><small>DEMO POLICY NOTE</small><p>Potential policy-based relaxation identified. Final determination remains with the authorized procurement officer.</p></div><button className="text-btn" onClick={() => openDialog('eligibility')}>View rule explanation <ArrowRight size={15} /></button></aside></div></>;
}

function PilotPage({ openDialog, notify }) {
  const [liveTrials, setLiveTrials] = useState(null);
  useEffect(() => { apiRequest('/api/trials').then(body => setLiveTrials(body?.trials || [])).catch(() => {}); }, []);
  const trial = liveTrials?.[0];
  const isLive = Boolean(trial);
  const kpis = trial?.kpis || [];
  const progress = trial?.startDate && trial?.endDate ? Math.max(0, Math.min(100, Math.round(((Date.now() - new Date(trial.startDate)) / (new Date(trial.endDate) - new Date(trial.startDate))) * 100))) : 42;
  const title = trial ? `Trial · ${trial.id.slice(0, 12)}` : 'AI Waste Segregation';
  const status = trial?.status === 'COMPLETED' ? 'Completed' : 'In progress';
  return <><PageHeader eyebrow={`TRIAL (PILOT) · ${title}`} title={trial ? 'Live trial workspace' : 'AI Waste Segregation'} subtitle="A trial (pilot) is a small-scale test of a startup's solution before making a larger purchase. Review scope, evidence and KPIs in one place." action={<button className="primary-btn" onClick={() => openDialog('evaluation')}><ClipboardCheck size={17} /> Evaluate trial</button>} />
    {!isLive && <div className="demo-disclaimer"><Info size={15} /><strong>Illustrative Demo Data</strong><span>This example is not an actual Maharashtra government result or contract.</span></div>}
    {isLive ? <><div className="live-record-pill"><span className="demo-dot" /> Live record from MongoDB</div><div className="pilot-overview"><div><span className="status-live"><i /> {status}</span><strong>₹{Number(trial.budget || 0).toLocaleString('en-IN')}</strong><small>trial budget</small></div><div><strong>{progress}% <span>complete</span></strong><small>{trial.startDate} → {trial.endDate}</small><div className="progress-track"><i style={{width:`${progress}%`}} /></div></div><div><strong>{trial.startupName || trial.startupId}</strong><small>{trial.department || 'Government department'}</small></div><div className="pilot-risk"><span>Evaluation</span><strong><i /> {trial.evaluation?.result || 'Pending'}</strong><button onClick={() => notify('Trial evidence and KPI checks are available in this workspace.')}>Review checks</button></div></div><section className="panel pilot-timeline"><PanelTitle title="Trial workflow" action="View audit history" onClick={() => openDialog('history')} /><div className="timeline-flow">{['Approved','Agreement','Deployment','KPI evaluation','Completed','Decision'].map((x,i) => <div className={`timeline-step ${i < (trial.status === 'COMPLETED' ? 5 : 4) ? 'done' : i === 4 ? 'current' : ''}`} key={x}><span>{i < (trial.status === 'COMPLETED' ? 5 : 4) ? <Check size={13} /> : i + 1}</span><strong>{x}</strong>{i < 5 && <i />}</div>)}</div></section><div className="content-grid two-one"><section className="panel"><PanelTitle title="KPIs, evidence & updates" action="Upload evidence" onClick={() => openDialog('evidence')} /><div className="milestones">{kpis.length ? kpis.map((kpi,i) => <div className={`milestone ${kpi.status === 'MET' ? 'completed' : 'in-progress'}`} key={kpi.name || i}><div className="milestone-marker">{kpi.status === 'MET' ? <Check size={15} /> : <Clock3 size={15} />}</div><div className="milestone-main"><div><strong>{kpi.name}</strong><Badge type={kpi.status === 'MET' ? 'success' : 'warning'}>{kpi.status}</Badge></div><span>Target: {kpi.target} {kpi.unit} · Actual: {kpi.actual ?? '—'} {kpi.unit}</span><small>{kpi.evidenceReference ? `Evidence: ${kpi.evidenceReference}` : 'No evidence reference attached yet.'}</small></div></div>) : <div className="empty-state"><ClipboardCheck size={19} /><strong>No KPIs added yet</strong><span>Add KPIs when creating the trial.</span></div>}</div></section><aside className="panel"><PanelTitle title="Trial details" /><div className="radar-list"><div><strong>Scope</strong><span>{trial.scope || 'Not specified'}</span></div><div><strong>Location</strong><span>{trial.location || 'Not specified'}</span></div><div><strong>Evidence</strong><span>{trial.evidenceIds?.length || 0} linked records</span></div></div></aside></div></> : <div className="pilot-overview"><div><span className="status-live"><i /> In progress</span><strong>₹8,00,000</strong><small>trial budget</small></div><div><strong>Day 38 <span>/ 90</span></strong><small>trial timeline</small><div className="progress-track"><i style={{width:'42%'}} /></div></div><div><strong>EcoVision AI</strong><small>selected startup · Pune</small></div><div className="pilot-risk"><span>Overall risk</span><strong><i /> Low</strong><button onClick={() => notify('Risk radar opened with 5 category explanations.')}>View trial risk check</button></div></div>}
  </>;
}
function EvaluationPage({ openDialog, notify }) {
  const evaluations = [
    ['AI Waste Segregation', 'EcoVision AI', 'Pune', '91/100', 'Ready for decision', 'success'],
    ['Streetlight Predictive Maintenance', 'CivicFlow Labs', 'Thane', '88/100', 'Officer review', 'warning'],
    ['Water Loss Detection', 'AquaPulse Systems', 'Nashik', '—', 'Evidence missing', 'neutral']
  ];
  return <><PageHeader eyebrow="PILOT EVALUATIONS" title="Evaluate outcomes, not promises" subtitle="Compare target and actual KPI results before making a procurement or scale recommendation." action={<button className="outline-btn" onClick={() => notify('Evaluation methodology opened.')}>Evaluation methodology <Info size={15} /></button>} /><div className="evaluation-summary"><div><strong>03</strong><span>pilots ready for review</span></div><div><strong>87%</strong><span>average KPI achievement</span></div><div><strong>01</strong><span>decision pack ready</span></div></div><section className="panel evaluation-table"><div className="table-caption"><strong>Evaluation queue</strong><span>Every score shows how it was calculated</span></div><table><thead><tr><th>Pilot</th><th>Department</th><th>Performance score</th><th>Evidence</th><th>Next action</th></tr></thead><tbody>{evaluations.map(([pilot,startup,district,score,status,type]) => <tr key={pilot}><td><strong>{pilot}</strong><small>{startup} · {district}</small></td><td>{district} Municipal Corporation</td><td><strong className={type === 'success' ? 'score-text' : ''}>{score}</strong><small>Accuracy · time · cost · adoption</small></td><td><Badge type={type}>{status}</Badge></td><td><button className="row-action" onClick={() => score === '—' ? notify('Evidence request prepared for AquaPulse Systems.') : openDialog('evaluation')}>{score === '—' ? 'Request evidence' : 'Open evaluation'} <ChevronRight size={14} /></button></td></tr>)}</tbody></table></section><div className="content-grid two-one"><section className="panel score-method"><PanelTitle title="How the score is calculated" /><div>{[['Accuracy','40%'],['Processing time','25%'],['Cost reduction','20%'],['Adoption','15%']].map(([l,n]) => <span key={l}><strong>{l}</strong><b>{n}</b></span>)}</div></section><section className="panel"><PanelTitle title="Decision safeguard" /><p className="plain-panel-copy">The platform explains the score. It does not decide whether a department must procure a solution.</p><button className="text-btn" onClick={() => notify('Decision safeguard guidance opened.')}>Read guidance <ArrowRight size={15} /></button></section></div></>;
}

function ScaleOpportunitiesPage({ jump, notify }) {
  const opportunities = [
    ['MH-SCALE-018', 'Nashik Municipal Corporation', 'Urban waste segregation', '06', '₹8L', 'High fit', 'Pune pilot achieved 103% of the accuracy KPI.'],
    ['MH-SCALE-014', 'Nagpur Municipal Corporation', 'Material recovery facilities', '05', '₹9L', 'High fit', 'Similar sorting workflow and deployment requirements.'],
    ['MH-SCALE-011', 'Thane Municipal Corporation', 'Ward-level waste analytics', '04', '₹7L', 'Medium fit', 'Requires an integration review before replication.'],
    ['MH-SCALE-006', 'Chhatrapati Sambhajinagar', 'Waste collection monitoring', '03', '₹6L', 'Medium fit', 'Potential fit based on problem similarity and budget.']
  ];
  return <><PageHeader eyebrow="SCALE & REPLICATION" title="Solutions ready to travel" subtitle="Find departments with a similar problem, then let them review the original pilot evidence before starting a new pilot." action={<button className="outline-btn" onClick={() => notify('Replication engine refreshed using the latest successful pilots.')}><Sparkles size={16} /> Refresh opportunities</button>} /><div className="scale-hero"><div className="scale-hero-icon"><Network size={24} /></div><div><span>SUCCESSFUL PILOT · MH-INNO-2026-00482</span><h2>AI Waste Segregation</h2><p>18 potential replication opportunities detected across 12 departments. These are demo recommendations, not confirmed procurements.</p></div><div className="scale-hero-score"><strong>93%</strong><span>pilot accuracy</span></div></div><section className="panel scale-table"><div className="table-caption"><strong>Replication opportunities</strong><span>Ranked by problem similarity, budget and deployment fit</span></div><table><thead><tr><th>Opportunity</th><th>Department</th><th>Similar requirements</th><th>Budget</th><th>Fit</th><th>Action</th></tr></thead><tbody>{opportunities.map(([id,dept,problem,count,budget,fit,why]) => <tr key={id}><td><div className="table-primary"><span className="table-id">{id}</span><strong>{problem}</strong><small>{why}</small></div></td><td>{dept}</td><td><strong>{count}</strong><small>sample matches</small></td><td>{budget}</td><td><Badge type={fit === 'High fit' ? 'success' : 'warning'}>{fit}</Badge></td><td><button className="row-action" onClick={() => notify(`${dept} replication brief opened.`)}>View opportunity <ChevronRight size={14} /></button></td></tr>)}</tbody></table></section><div className="content-grid two-one"><section className="panel"><PanelTitle title="What the receiving department sees" /><div className="reason-line"><CheckCircle2 size={16} /><span>Original problem and pilot baseline</span></div><div className="reason-line"><CheckCircle2 size={16} /><span>KPI results, cost and implementation lessons</span></div><div className="reason-line"><CheckCircle2 size={16} /><span>Documents and deployment requirements</span></div></section><section className="panel"><PanelTitle title="Replication guardrail" /><p className="plain-panel-copy">A successful pilot is evidence for a new department, not a guarantee that the same result will occur everywhere.</p><button className="text-btn" onClick={() => jump('Procurement')}>Open decision pack <ArrowRight size={15} /></button></section></div></>;
}

function DecisionPage({ jump, notify, openDialog }) {
  const [decisionType, setDecisionType] = useState('RECOMMEND_PROCUREMENT');
  const [trial, setTrial] = useState(null);
  const [live, setLive] = useState(false);
  const [notes, setNotes] = useState('');
  const [extensionEndDate, setExtensionEndDate] = useState('');
  const [evidenceRequest, setEvidenceRequest] = useState('');
  useEffect(() => { apiRequest('/api/trials').then(body => { const completed = body?.trials?.find(t => t.status === 'COMPLETED'); if (completed) { setTrial(completed); setLive(true); } }).catch(() => {}); }, []);
  const submitDecision = async () => {
    if (!trial) { notify('Illustrative demo only — sign in and create a live completed trial to save a decision.'); return; }
    try {
      await apiRequest('/api/decisions', { method: 'POST', body: JSON.stringify({ trialId: trial.id, type: decisionType, notes, extensionEndDate, evidenceRequest }) });
      notify(decisionType === 'RECOMMEND_PROCUREMENT' ? 'Procurement recommendation saved. Startup and audit trail were updated.' : 'Decision saved. Startup and audit trail were updated.');
      const refreshed = await apiRequest('/api/trials'); setTrial(refreshed.trials?.find(t => t.id === trial.id) || trial);
    } catch (error) { notify(error.message); }
  };
  const evaluation = trial?.evaluation;
  const kpiAchievement = evaluation?.total ? Math.round((evaluation.met / evaluation.total) * 100) : 0;
  return <><PageHeader eyebrow="DECISION" title="The trial is complete. What happens next?" subtitle="Review the evidence, record one of four outcomes, and keep the decision traceable. Recommend procurement means moving the solution into the applicable government procurement process; it is not an automatic purchase." action={<button className="primary-btn" onClick={async()=>{ if(!trial){notify('No completed live trial is available yet.');return;} try{await apiRequest(`/api/trials/${trial.id}/pack-ready`,{method:'PATCH'});notify('Decision pack marked ready. Startup and audit trail updated.');}catch(e){notify(e.message)}}}><FileCheck2 size={17} /> Mark pack ready</button>} />
    {!live && <div className="demo-disclaimer"><Info size={15} /><strong>Illustrative Demo Data</strong><span>Results shown here are examples for the demo, not actual government performance.</span></div>}
    {live && <div className="live-record-pill"><span className="demo-dot" /> Live completed trial from MongoDB</div>}
    <div className="success-banner"><div className="success-icon"><CheckCircle2 size={25} /></div><div><strong>{live ? `Trial ${trial.id.slice(0, 12)} · ${evaluation?.result || 'Completed'}` : 'AI Waste Segregation · Trial successful'}</strong><span>{live ? `KPI achievement: ${kpiAchievement}% · ${trial.location || 'Location not specified'}` : 'Final KPI achievement: 96% · Performance score: 91/100 · Pune Municipal Corporation'}</span></div><Badge type="success">{live ? 'Live result' : 'Ready for decision'}</Badge></div>
    <div className="decision-grid"><section className="panel decision-summary"><PanelTitle title="Evidence and decision pack" action="Upload document" onClick={() => openDialog('evidence')} /><div className="decision-list">{(live ? [['Trial',trial.id],['Startup',trial.startupId],['Trial cost',`₹${Number(trial.budget || 0).toLocaleString('en-IN')}`],['Location',trial.location || 'Not specified'],['KPI outcome',`${kpiAchievement}% achievement`],['Evidence',`${trial.evidenceIds?.length || 0} linked documents`]] : [['Problem','Improve urban waste segregation'],['Startup','EcoVision AI · CleanTech'],['Trial cost','₹8,00,000 · 90 days'],['Eligibility','Eligible · final officer determination'],['Risk check','Low overall risk'],['KPI outcome','96% weighted achievement'],['Evidence','12 documents · 4 milestone submissions']]).map(([l,v]) => <div key={l}><span>{l}</span><strong>{v}</strong><ChevronRight size={14} /></div>)}</div><div className="score-explainer"><div className="score-big">{live ? kpiAchievement : 91}<span>/100</span></div><div><strong>Trial performance</strong><p>{live ? (evaluation?.explanation || 'Calculated from the server-side KPI evaluation.') : 'Illustrative weighted score from accuracy, processing time, cost reduction and adoption.'}</p><div className="score-bar"><i style={{width:`${live ? kpiAchievement : 91}%`}} /></div></div></div></section><section className="panel"><PanelTitle title="Officer decision" action="Add notes" onClick={() => document.getElementById('decision-notes')?.focus()} /><div className="recommendation-options"><button className={`recommendation ${decisionType === 'RECOMMEND_PROCUREMENT' ? 'selected' : ''}`} onClick={() => setDecisionType('RECOMMEND_PROCUREMENT')}><span><CheckCircle2 size={17} /></span><div><strong>Recommend procurement</strong><small>Pilot met the defined success criteria.</small></div><Check size={16} /></button><button className={`recommendation ${decisionType === 'EXTEND_TRIAL' ? 'selected' : ''}`} onClick={() => setDecisionType('EXTEND_TRIAL')}><span><Clock3 size={17} /></span><div><strong>Extend trial</strong><small>Collect more evidence before deciding.</small></div></button><button className={`recommendation ${decisionType === 'REQUEST_MORE_EVIDENCE' ? 'selected' : ''}`} onClick={() => setDecisionType('REQUEST_MORE_EVIDENCE')}><span><Info size={17} /></span><div><strong>Request more evidence</strong><small>Ask the startup to clarify a gap.</small></div></button><button className={`recommendation ${decisionType === 'REJECT' ? 'selected' : ''}`} onClick={() => setDecisionType('REJECT')}><span><X size={17} /></span><div><strong>Reject</strong><small>The outcome did not meet the target.</small></div></button></div>{decisionType === 'EXTEND_TRIAL' && <label className="decision-extra">New trial end date<input type="date" value={extensionEndDate} onChange={e => setExtensionEndDate(e.target.value)} /></label>}{decisionType === 'REQUEST_MORE_EVIDENCE' && <label className="decision-extra">Evidence request<textarea value={evidenceRequest} onChange={e => setEvidenceRequest(e.target.value)} placeholder="Example: Please share the field performance report and deployment evidence." /></label>}<label className="decision-extra">Decision note<textarea id="decision-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evidence-based explanation for the decision." /></label><button className="primary-btn full" onClick={submitDecision}>Submit decision <ArrowRight size={16} /></button></section></div></>;
}
function DocumentsPage({ notify, role = 'officer' }) {
  const [tab, setTab] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const load = () => apiRequest('/api/evidence').then(body => setDocuments(body.evidence || [])).catch(() => setDocuments([]));
  useEffect(() => { load(); }, []);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const body = await apiRequest('/api/evidence', { method: 'POST', body: form });
      notify(body?.evidence?.isDemo ? 'Document saved to the platform record. Configure Firebase Storage for permanent cloud file storage.' : 'Document uploaded securely.');
      load();
    } catch (error) { notify(error.message); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const sample = [['Technical proposal','EcoVision AI','PDF · 2.4 MB','Verified'],['DPIIT recognition','EcoVision AI','PDF · 840 KB','Verified'],['Milestone 3 field report','AI Waste Segregation','PDF · 4.1 MB','Needs review'],['Pilot agreement','Pune Municipal Corporation','PDF · 1.2 MB','Verified'],['KPI evidence pack','AI Waste Segregation','XLSX · 680 KB','Needs review']];
  const live = documents.map(d => [d.fileName, d.relatedTrial || d.relatedApplication || 'Platform record', `${d.fileType} · ${Math.max(1, Math.round((d.fileSize || 0)/1024))} KB`, 'Uploaded', d]);
  const rows = live.length ? live : sample.map(r => [...r, null]);
  const visible = tab === 'All' ? rows : rows.filter(r => tab === 'Needs review' ? r[3] === 'Needs review' : r[3] === 'Verified');
  const openDoc = async (row) => { if (!row[4]?.id) return notify(`${row[0]} is illustrative demo data; live uploaded files can be opened from their record.`); try { const body = await apiRequest(`/api/evidence/${row[4].id}`); if (body.downloadUrl) window.open(body.downloadUrl, '_blank', 'noopener,noreferrer'); else notify(`${row[0]} is stored as safe metadata because cloud storage is not configured.`); } catch (e) { notify(e.message); } };
  return <><PageHeader eyebrow="DOCUMENT VAULT" title="Documents" subtitle="Upload, review and open evidence attached to your innovation records." action={<label className="primary-btn upload-label"><UploadCloud size={17} /> {uploading ? 'Uploading…' : 'Add file'}<input type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx,.doc,.docx" onChange={upload} disabled={uploading} /></label>} /><div className="document-tabs"><button className={tab==='All'?'active':''} onClick={() => setTab('All')}>All documents <b>{live.length || 24}</b></button><button className={tab==='Needs review'?'active':''} onClick={() => setTab('Needs review')}>Needs review <b>3</b></button><button className={tab==='Verified'?'active':''} onClick={() => setTab('Verified')}>Verified <b>18</b></button></div><section className="panel document-list">{visible.length ? visible.map(([title,owner,meta,status,doc]) => <div className="document-row" key={title}><div className="file-icon"><FileText size={17} /></div><div><strong>{title}</strong><span>{owner} · {meta}</span></div><Badge type={status === 'Verified' ? 'success' : status === 'Needs review' ? 'warning' : 'purple'}>{status}</Badge><span className="doc-date">{doc ? new Date(doc.createdAt).toLocaleDateString() : 'Sample record'}</span><div className="document-actions"><button className="row-action" onClick={() => openDoc([title,owner,meta,status,doc])}>Open</button>{doc && <button className="row-action" onClick={() => openDoc([title,owner,meta,status,doc])}>Download</button>}<button className="icon-btn" aria-label={`More actions for ${title}`} onClick={() => notify(`Review actions opened for ${title}.`)}><MoreHorizontal size={17} /></button></div></div>) : <div className="empty-state"><FileText size={19}/><strong>No documents in this filter</strong><span>Upload a file to create a live record.</span></div>}</section></>;
}
function AuditPage({ notify }) {
  const [filter, setFilter] = useState('All events');
  const [liveEvents, setLiveEvents] = useState(null);
  useEffect(() => {
    apiRequest('/api/audit').then(body => {
      if (body?.events) setLiveEvents(body.events.map(event => [
        new Date(event.timestamp).toLocaleString(), event.summary, `${event.actor} · ${event.entityType}`, event.role === 'system' ? 'System event' : 'Completed'
      ]));
    }).catch(() => {});
  }, []);
  const allEvents = liveEvents || auditEvents.concat([['18 Sep · 09:10','Officer verified milestone evidence','Priya Deshmukh · Milestone 2','Completed'],['22 Sep · 17:25','Scale opportunity generated','Matching & replication engine','System event']]);
  const events = filter === 'All events' ? allEvents : allEvents.filter(([, , , status]) => status === filter);
  return <><PageHeader eyebrow="IMMUTABLE RECORD" title="Audit trail" subtitle="A clear history of who did what, when, and against which object." action={<label className="filter-select audit-filter"><Filter size={15} /><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter audit log"><option>All events</option><option>Completed</option><option>Awaiting review</option><option>System event</option></select><ChevronDown size={14} /></label>} /><div className="audit-note"><ShieldCheck size={17} /><span>Audit events cannot be edited from the normal user interface. Demo records are clearly marked as sample data.</span></div><section className="panel audit-table"><div className="table-caption"><strong>{events.length} events</strong><span>Filter updates the audit view instantly</span></div><table><thead><tr><th>Timestamp</th><th>Action</th><th>Actor / object</th><th>Status</th><th>Record</th></tr></thead><tbody>{events.length ? events.map(([time,action,actor,status]) => <tr key={time}><td><strong>{time}</strong></td><td>{action}</td><td><span className="actor-cell">{actor}</span></td><td><Badge type={status === 'Completed' ? 'success' : status === 'System event' ? 'purple' : 'warning'}>{status}</Badge></td><td><button className="row-action" onClick={() => notify(`Audit record opened: ${action}.`)}>Open <ChevronRight size={14} /></button></td></tr>) : <tr><td colSpan="5"><div className="empty-state"><ShieldCheck size={19} /><strong>No events in this filter</strong><span>Choose another audit status.</span></div></td></tr>}</tbody></table></section></>;
}

function StartupPage({ page, jump, notify, openDialog, authUser }) {
  if (page === 'Dashboard' || page === 'Overview') return <StartupOverview jump={jump} notify={notify} authUser={authUser} />;
  if (page === 'Opportunities') return <ProblemsPage jump={jump} openDialog={openDialog} notify={notify} role="startup" />;
  if (page === 'Applications & Trials') return <ApplicationsAndTrialsPage jump={jump} openDialog={openDialog} notify={notify} />;
  if (page === 'Notifications') return <NotificationsPage notify={notify} jump={jump} role="startup" />;
  if (page === 'Documents') return <DocumentsPage notify={notify} role="startup" />;
  if (page === 'Trust Passport') return <TrustPage />;
  if (page === 'Grievances') return <GrievancePage notify={notify} />;
  if (page === 'Profile') return <StartupProfilePage notify={notify} authUser={authUser} />;
  return <StartupOverview jump={jump} notify={notify} authUser={authUser} />;
}
function StartupOverview({ jump, notify, authUser }) {
  const [stats, setStats] = useState({ recommendedProblems: null, activeApplications: null, shortlisted: null, activePilots: null });
  const [activeTrial, setActiveTrial] = useState(null);
  useEffect(() => {
    apiRequest('/api/dashboard/stats').then(body => {
      if (body?.stats) setStats(body.stats);
      if (body?.nextMilestone) setActiveTrial(body.nextMilestone);
    }).catch(() => {});
  }, []);
  const fmt = (n) => n === null ? '—' : String(n).padStart(2, '0');
  const startupInitials = ((authUser?.startupName || authUser?.name || 'ST')).split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const startupLabel = [authUser?.startupName?.toUpperCase(), authUser?.profile?.location || 'MAHARASHTRA'].filter(Boolean).join(' · ');
  const statCards = [
    [fmt(stats.recommendedProblems), 'Recommended problems', stats.recommendedProblems === null ? 'Loading…' : 'Open opportunities', Target, 'purple'],
    [fmt(stats.activeApplications), 'Active applications', stats.shortlisted ? `${stats.shortlisted} shortlisted` : 'Submitted', FileCheck2, 'blue'],
    [fmt(stats.activePilots), 'Pilot in progress', stats.activePilots === null ? 'Loading…' : stats.activePilots > 0 ? 'Active pilot' : 'None active', Activity, 'orange'],
    [stats.activePilots ? fmt(stats.activePilots) : '—', 'Next milestone', activeTrial ? 'Trial active' : 'Start a pilot', WalletCards, 'green']
  ];
  return <><PageHeader eyebrow="STARTUP WORKSPACE" title={`Good morning, ${(authUser?.name || 'Founder').split(' ')[0]}.`} subtitle="Your government innovation profile is helping the right opportunities find you." action={<button className="primary-btn" onClick={() => jump('Opportunities')}><Target size={17} /> Find problems</button>} /><div className="startup-welcome"><div className="startup-avatar">{startupInitials}</div><div><span>{startupLabel}</span><strong>Government Innovation Profile</strong><p>{authUser?.sector ? `${authUser.sector} sector startup registered for government innovation challenges.` : 'Complete your profile to improve opportunity matching.'}</p></div><div className="passport-mini"><span>Trust Passport</span><strong>— <small>/100</small></strong><a onClick={() => jump('Trust Passport')}>View profile <ArrowRight size={14} /></a></div></div><div className="stat-grid">{statCards.map(([n,l,s,I,c]) => <div className="stat-card" key={l}><div className={`stat-icon ${c}`}><I size={18} /></div><strong>{n}</strong><span>{l}</span><small>{s}</small></div>)}</div><div className="content-grid two-one"><section className="panel"><PanelTitle title="Your pilot journey" action="Open workspace" onClick={() => jump('Applications & Trials')} /><div className="startup-journey">{activeTrial ? <><div className="journey-progress"><span>Trial active</span><div><i style={{width:'60%'}} /></div></div>{['Agreement & onboarding','Deployment','Initial performance','Field performance','Final evaluation'].map((x,i) => <div className={`sj-step ${i < 2 ? 'done' : i === 2 ? 'current' : ''}`} key={x}><span>{i < 2 ? <Check size={13} /> : i + 1}</span><div><strong>{x}</strong><small>{i < 2 ? 'Completed' : i === 2 ? 'Evidence submission open' : 'Locked until previous step'}</small></div></div>)}</> : <div className="empty-state"><Activity size={19}/><strong>No active pilots yet</strong><span>Apply to a government opportunity to start the pilot journey.</span></div>}</div></section><section className="panel"><PanelTitle title="Recommended for you" action="All opportunities" onClick={() => jump('Opportunities')} />{stats.recommendedProblems === null ? <div className="empty-state"><Target size={19}/><strong>Loading…</strong></div> : stats.recommendedProblems === 0 ? <div className="empty-state"><Target size={19}/><strong>No open problems yet</strong><span>Check back soon.</span></div> : <div className="work-list"><div className="work-row"><div className="work-mark"><Target size={16}/></div><div className="work-main"><strong>{stats.recommendedProblems} open challenge{stats.recommendedProblems !== 1 ? 's' : ''}</strong><span>Matching your sector profile</span></div><button className="row-action" onClick={() => jump('Opportunities')}>View <ChevronRight size={14}/></button></div></div>}</section></div><div className="content-grid two-one"><section className="panel"><PanelTitle title="What needs your attention" /><div className="attention-list">{activeTrial ? <div><span className="attention-icon orange"><UploadCloud size={15} /></span><div><strong>Active trial in progress</strong><small>Submit KPI evidence to advance the trial.</small></div><button className="link-btn" onClick={() => jump('Applications & Trials')}>Open <ChevronRight size={14} /></button></div> : <div><span className="attention-icon purple"><Target size={15} /></span><div><strong>Find your first opportunity</strong><small>Browse open government problems and apply.</small></div><button className="link-btn" onClick={() => jump('Opportunities')}>Browse <ChevronRight size={14} /></button></div>}</div></section><section className="panel trust-callout"><ShieldCheck size={22} /><strong>Keep your Trust Passport current</strong><p>Verified documents and pilot outcomes improve evidence visibility without making prior experience a barrier.</p><button className="text-btn" onClick={() => jump('Trust Passport')}>Review passport <ArrowRight size={15} /></button></section></div></>;
}

function ApplicationsPage({ jump }) {
  const [live, setLive] = useState(null);
  useEffect(() => { apiRequest('/api/applications').then(body => setLive(body?.applications || [])).catch(() => {}); }, []);
  const demo = [['Improve urban waste segregation','Pune Municipal Corporation','Shortlisted','91% match','AI Waste Segregation'],['Reduce water leakage in municipal zones','Maharashtra Jeevan Pradhikaran','Clarification requested','86% match','WaterSense proposal'],['Improve last-mile primary health access','Public Health Department','Draft','79% match','Not submitted']];
  return <><PageHeader eyebrow="STARTUP WORKSPACE" title="Applications" subtitle="Track every government opportunity, from first response to pilot selection." /><section className="panel application-list"><div className="table-caption"><strong>{live ? live.length : demo.length} applications</strong><span>{live ? 'Live records from MongoDB' : 'Illustrative Demo Data'}</span></div>{(live ? live : demo.map(([title,dept,status,match,sub]) => ({ title, dept, status, match, sub }))).map((item,i) => { const title=item.title || item.problemTitle || `Application ${item.id?.slice(0,8)}`; const dept=item.dept || item.department || 'Government opportunity'; const status=item.status || 'APPLIED'; const label=String(status).replaceAll('_',' '); const match=item.match || (item.matchScore != null ? `${item.matchScore}% match` : '—'); return <div className="application-row" key={item.id || title}><div className="app-type"><FileCheck2 size={17} /></div><div className="app-main"><strong>{title}</strong><span>{dept} · {item.sub || item.startupName || item.problemId || 'Live application'}</span></div><Badge type={String(status).includes('SHORT') || status === 'SELECTED' ? 'success' : String(status).includes('REJECT') ? 'neutral' : 'warning'}>{label}</Badge><strong className="app-match">{match}</strong><button className="row-action" onClick={() => jump(status === 'SHORTLISTED' || status === 'TRIAL' ? 'Pilot Journey' : 'Opportunities')}>Open <ChevronRight size={14} /></button></div>; })}</section></>;
}
function ApplicationsAndTrialsPage({ jump, notify, openDialog }) {
  return <><PageHeader eyebrow="STARTUP WORKSPACE" title="Applications & trials" subtitle="Follow each opportunity from application to shortlist, trial, evidence and result." action={<button className="primary-btn" onClick={() => jump('Opportunities')}><Target size={17} /> Find opportunities</button>} /><div className="workflow-strip">{['Applied','Under review','Shortlisted','Trial (Pilot)','Result'].map((step, i) => <React.Fragment key={step}><div className={`workflow-step ${i < 3 ? 'complete' : i === 3 ? 'current' : ''}`}><span>{i < 3 ? <Check size={13} /> : i + 1}</span><strong>{step}</strong></div>{i < 4 && <i />}</React.Fragment>)}</div><ApplicationsPage jump={jump} /><section className="panel trial-requirements"><PanelTitle title="My trial · AI Waste Segregation" action="Open trial workspace" onClick={() => openDialog('evidence')} /><div className="trial-facts"><div><span>Government department</span><strong>Pune Municipal Corporation</strong></div><div><span>Location & duration</span><strong>4 wards · 90 days</strong></div><div><span>What to submit next</span><strong>Field performance evidence</strong></div><div><span>Evaluation status</span><Badge type="warning">Evidence due 18 Sep</Badge></div></div><button className="text-btn" onClick={() => notify('Trial requirements opened. Submit evidence against each KPI before the deadline.')}><UploadCloud size={15} /> What do I need to submit? <ArrowRight size={15} /></button></section></>;
}

function TrustPage() {
  const [passport, setPassport] = useState(null);
  useEffect(() => { apiRequest('/api/startups/trust-passport').then(body => setPassport(body?.passport || null)).catch(() => {}); }, []);
  const live = passport && !passport.isDemo;
  const cards = live ? [
    ['Pilot history', `${passport.completedPilots} completed pilots`, 'Based on completed trials recorded on the platform.', `${Math.min(100, passport.completedPilots * 25)}%`, 'purple'],
    ['Successful pilots', `${passport.successfulPilots} successful`, 'Trials whose server-side KPI evaluation met every target.', `${Math.min(100, passport.successfulPilots * 25)}%`, 'success'],
    ['KPI achievement', passport.kpiAchievement == null ? 'No KPI history' : `${passport.kpiAchievement}% average`, 'Calculated from evaluated KPI records.', `${passport.kpiAchievement || 0}%`, 'blue'],
    ['Procurement recommendations', String(passport.procurementRecommendations), 'Recommendations recorded after successful trials.', `${Math.min(100, passport.procurementRecommendations * 25)}%`, 'green'],
    ['Evidence records', String(passport.evidenceCount), 'Evidence uploaded by this startup.', `${Math.min(100, passport.evidenceCount * 20)}%`, 'orange']
  ] : [['Verification','Company verified','Illustrative demo profile.','100%','success'],['Pilot history','3 completed pilots','Previous experience is evidence, not a mandatory barrier.','75%','purple'],['KPI achievement','94% average','Across completed pilot outcomes.','94%','blue'],['On-time delivery','97%','Milestones submitted within agreed dates.','97%','green'],['Government deployments','2 active','Illustrative demo history.','50%','orange'],['Officer rating','4.6 / 5','Illustrative feedback history.','92%','purple']];
  return <><PageHeader eyebrow="EVIDENCE, NOT EXCLUSION" title="Trust Passport" subtitle="A transparent view of your readiness, verification and previous evidence." /><div className="passport-header panel"><div className="passport-score"><div className="score-ring"><strong>{live ? passport.score : 82}</strong><span>/100</span></div><div><span>TRUST SCORE</span><strong>{live ? (passport.sufficientHistory ? 'Based on platform history' : 'Insufficient platform history') : 'Good evidence foundation'}</strong><small>{live ? 'Calculated from stored trials, KPIs, decisions and evidence' : 'Illustrative Demo Data'}</small></div></div><div className="passport-eligibility"><div><CheckCircle2 size={18} /><span><strong>{live && !passport.sufficientHistory ? 'History pending' : 'Eligible'}</strong><small>Eligibility is determined separately by the authorized officer</small></span></div></div></div><div className="passport-grid">{cards.map(([t,v,d,n,c]) => <div className="passport-card panel" key={t}><div className="passport-card-top"><span>{t}</span><Badge type={c === 'success' ? 'success' : 'purple'}>{n}</Badge></div><strong>{v}</strong><p>{d}</p><div className="score-bar"><i className={c} style={{width:n}} /></div></div>)}</div>{!live && <div className="demo-disclaimer"><Info size={15} /><strong>Illustrative Demo Data</strong><span>Demo passport values are not claims about a real startup.</span></div>}</>;
}
function GrievancePage({ notify }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('Decision review');
  const [description, setDescription] = useState('');
  useEffect(() => { apiRequest('/api/grievances').then(body => setItems(body?.grievances || [])).catch(() => {}); }, []);
  const submit = async () => { try { const body = await apiRequest('/api/grievances', { method:'POST', body: JSON.stringify({ type, description }) }); setItems(current => [body.grievance, ...(current || [])]); setDescription(''); setOpen(false); notify('Grievance submitted. It is now traceable for review.'); } catch (e) { notify(e.message); } };
  const demo = [['GRV-2026-014','Technical clarification not considered','Water leakage application','Under Review','Due 18 Sep'],['GRV-2026-008','Request review of rejection decision','MH-PROB-019','Resolved','Closed 02 Sep']];
  return <><PageHeader eyebrow="FAIR REVIEW" title="Grievances & appeals" subtitle="Raise a concern against a procurement or pilot decision and keep the response traceable." action={<button className="primary-btn" onClick={() => setOpen(true)}><Plus size={17} /> Raise a grievance</button>} />{open && <div className="dialog-backdrop" onClick={() => setOpen(false)}><div className="dialog" onClick={e => e.stopPropagation()}><button className="dialog-close" onClick={() => setOpen(false)}><X size={18} /></button><div className="dialog-kicker">FAIR REVIEW</div><h2>Raise a grievance</h2><p>Report a problem, concern, or unfair decision. The submission will be stored and auditable.</p><label>Type<select value={type} onChange={e => setType(e.target.value)}><option>Decision review</option><option>Technical clarification</option><option>Eligibility concern</option><option>Process concern</option></select></label><label>Description<textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain the concern and what should be reviewed." /></label><div className="dialog-actions"><button className="secondary-btn" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn" disabled={!description.trim()} onClick={submit}>Submit grievance <Check size={15} /></button></div></div></div>}<div className="grievance-list panel"><div className="table-caption"><strong>{items ? items.length : demo.length} grievances</strong><span>{items ? 'Live records from MongoDB' : 'Illustrative Demo Data'}</span></div>{(items ? items : demo.map(([id,issue,rel,status,due]) => ({id,description:issue,relatedApplication:rel,status,due}))).map(item => <div className="grievance-row" key={item.id}><div className="case-id">{item.id}</div><div><strong>{item.description}</strong><span>{item.relatedApplication || item.relatedTrial || 'Submitted for review'} · {item.due || new Date(item.createdAt || Date.now()).toLocaleDateString()}</span></div><Badge type={item.status === 'RESOLVED' || item.status === 'Resolved' ? 'success' : 'warning'}>{String(item.status).replaceAll('_',' ')}</Badge><ChevronRight size={17} /></div>)}</div><div className="grievance-flow"><div className="section-kicker">HOW REVIEW WORKS</div><div>{['Submitted','Under Review','Response','Resolved'].map((x,i) => <React.Fragment key={x}><span className={i < 2 ? 'active' : ''}>{i+1}<small>{x}</small></span>{i < 3 && <i />}</React.Fragment>)}</div></div></>;
}
function ShortlistedStartupsPage({ jump, notify }) {
  const [apps,setApps]=useState([]);
  useEffect(()=>{apiRequest('/api/applications').then(b=>setApps((b.applications||[]).filter(a=>['SHORTLISTED','SELECTED','TRIAL'].includes(a.status)))).catch(()=>{});},[]);
  return <><PageHeader eyebrow="SHORTLISTED STARTUPS" title="Shortlisted startups" subtitle="A dedicated workspace for startups that passed the comparison stage." action={<button className="primary-btn" onClick={()=>jump('Compare & Shortlist')}>Compare more <Scale size={16}/></button>} /><section className="panel"><div className="table-caption"><strong>{apps.length || 3} shortlisted records</strong><span>Live MongoDB records appear first; sample records remain clearly illustrative.</span></div><table><thead><tr><th>Startup</th><th>Problem</th><th>Status</th><th>Next step</th></tr></thead><tbody>{(apps.length?apps:[{id:'demo1',startupName:'EcoVision AI',problemTitle:'Improve urban waste segregation',status:'SHORTLISTED'},{id:'demo2',startupName:'CivicFlow Labs',problemTitle:'Smart civic operations',status:'SHORTLISTED'},{id:'demo3',startupName:'SortSmart Technologies',problemTitle:'Waste segregation',status:'SHORTLISTED'}]).map(a=><tr key={a.id}><td><strong>{a.startupName || a.startup?.name || 'Startup'}</strong></td><td>{a.problemTitle || a.problemId}</td><td><Badge type="success">{a.status}</Badge></td><td><button className="row-action" onClick={()=>jump('Trials')}>Open pilot <ChevronRight size={14}/></button></td></tr>)}</tbody></table></section></>;
}

function ComparisonPage({ jump, notify, openDialog }) {
  const rows = [
    ['Problem fit', '96%', '89%', '83%', 'EcoVision AI'],
    ['Technology fit', '91%', '88%', '76%', 'EcoVision AI'],
    ['Pilot cost', '₹8.0L', '₹7.4L', '₹6.8L', 'SortSmart'],
    ['Risk level', 'Low', 'Medium', 'Medium', 'EcoVision AI'],
    ['KPI confidence', '94%', '88%', '81%', 'EcoVision AI'],
    ['Eligibility', 'Eligible', 'Conditional', 'Eligible', 'EcoVision AI'],
    ['Readiness', 'TRL 8', 'TRL 7', 'TRL 6', 'EcoVision AI'],
    ['Previous evidence', '3 pilots', '2 pilots', '1 pilot', 'EcoVision AI']
  ];
  return <><PageHeader eyebrow="SHORTLISTING WORKSPACE" title="Compare shortlisted startups" subtitle="Use the same evidence across every proposal. Shortlisting is an officer decision, not an automated ranking." action={<button className="primary-btn" onClick={() => jump('Trials', 'EcoVision AI selected. Pilot workspace prepared.')}>Select EcoVision AI <ArrowRight size={16} /></button>} /><div className="comparison-note"><Info size={17} /><span>Three startups are being compared for <strong>MH-PROB-026 · Improve urban waste segregation</strong>. Previous experience is shown as evidence, not as an automatic eligibility barrier.</span></div><section className="panel compare-panel"><div className="compare-head"><div><span>COMPARISON VIEW</span><strong>Evidence-based shortlist</strong></div><button className="filter-btn" onClick={() => notify('Comparison criteria menu opened. Review the full evidence table below.') }><Filter size={14} /> Criteria <ChevronDown size={13} /></button></div><table><thead><tr><th>Criterion</th><th><div className="compare-startup"><span className="startup-logo violet">EV</span><strong>EcoVision AI</strong><small>Recommended</small></div></th><th><div className="compare-startup"><span className="startup-logo blue">CF</span><strong>CivicFlow Labs</strong><small>Conditional</small></div></th><th><div className="compare-startup"><span className="startup-logo orange">ST</span><strong>SortSmart</strong><small>Emerging evidence</small></div></th><th>Leading evidence</th></tr></thead><tbody>{rows.map(([label,a,b,c,lead]) => <tr key={label}><td><strong>{label}</strong></td><td className={lead === 'EcoVision AI' ? 'best' : ''}>{a}</td><td>{b}</td><td>{c}</td><td><Badge type={lead === 'EcoVision AI' ? 'success' : 'neutral'}>{lead}</Badge></td></tr>)}</tbody></table><div className="compare-footer"><button className="secondary-btn" onClick={() => openDialog('clarification')}>Request clarification</button><button className="secondary-btn" onClick={() => openDialog('rejection')}>Reject with reason</button><button className="primary-btn" onClick={() => jump('Trials', 'Shortlist complete. Pilot approval is the next step.')}>Shortlist selected <Check size={16} /></button></div></section><div className="content-grid two-one"><section className="panel reason-panel"><PanelTitle title="Why EcoVision AI is ranked higher" /><div className="reason-line"><CheckCircle2 size={16} /><span>Strongest match to the target waste classification outcome.</span></div><div className="reason-line"><CheckCircle2 size={16} /><span>Budget and 90-day deployment plan fit the pilot brief.</span></div><div className="reason-line"><CheckCircle2 size={16} /><span>Evidence level is established without making it a mandatory barrier.</span></div></section><section className="panel"><PanelTitle title="Decision guardrails" /><p className="plain-panel-copy">Every rejection requires a category and explanation. The startup can see the decision evidence and request a review.</p><button className="text-btn" onClick={() => openDialog('fair-rejection')}>View fair rejection guidance <ArrowRight size={15} /></button></section></div></>;
}

function NotificationsPage({ notify, jump, role = 'startup' }) {
  const [liveItems, setLiveItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const load = () => apiRequest('/api/notifications').then(body => { setLiveItems(body.notifications || []); setUnread(body.unread || 0); }).catch(() => {});
  useEffect(() => { load(); }, []);
  const markRead = () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }).then(() => { setUnread(0); notify('All notifications marked as read.'); }).catch(e => notify(e.message));
  const open = (item) => {
    const target = item?.relatedEntity?.page;
    const allowedByRole = role === 'admin' ? ['State Overview','Departments','Startups','Pilots','Procurement','Innovation Map','Policy Compliance','ROI & Impact','Grievances','Audit Logs','Notifications','Profile'] : role === 'officer' ? ['Dashboard','Problems','AI Matches','Compare & Shortlist','Shortlisted Startups','Trials','Decisions','Documents','Profile','Audit Trail','Notifications'] : ['Dashboard','Opportunities','Applications & Trials','Documents','Profile','Trust Passport','Grievances','Notifications'];
    if (target && allowedByRole.includes(target)) jump(target);
    else notify('Notification opened. The linked record is available in the workflow workspace.');
  };
  const sample = [{title:'Milestone evidence needs review',message:'A pilot evidence submission needs officer review.',type:'decision',createdAt:new Date().toISOString(),relatedEntity:{page:'Documents'}},{title:'New opportunity matches your profile',message:'A government problem fits your startup capabilities.',type:'application',createdAt:new Date().toISOString(),relatedEntity:{page:'Opportunities'}}];
  const items = liveItems.length ? liveItems : sample;
  return <><PageHeader eyebrow="NOTIFICATION CENTRE" title="Notifications" subtitle="Important decisions, requests and opportunities linked to your work." action={<div className="header-action-stack"><button className="outline-btn" onClick={markRead}>Mark all as read</button>{role !== 'startup' && <button className="primary-btn" onClick={async()=>{ const title=window.prompt('Notification title'); if(!title) return; const message=window.prompt('Message to the recipient'); if(!message) return; try { const body=await apiRequest('/api/users/startups'); const recipient=body?.users?.[0]; if(!recipient) throw new Error('No startup recipient found.'); await apiRequest('/api/notifications',{method:'POST',body:JSON.stringify({recipient:recipient.id,title,message,type:'update',relatedEntity:{page:'Notifications'}})}); notify(`Notification sent to ${recipient.email || 'the registered account email'}. Email delivery was attempted.`); load(); } catch(e){ notify(e.message); }}}><Plus size={16}/> Add notification</button>}</div>} /><div className="notification-tabs"><span className="active">All <b>{items.length}</b></span><span>Action needed <b>{unread}</b></span><span>Updates</span></div><section className="panel notification-list">{items.map((item,i) => <button className={`notification-row ${i < unread ? 'unread' : ''}`} key={`${item.id || item.title}-${item.createdAt}`} onClick={() => open(item)}><div className={`notification-symbol ${item.type === 'application' ? 'blue' : item.type === 'decision' ? 'success' : 'purple'}`}><Bell size={16} /></div><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.relatedEntity?.problemId || item.role || 'GOV INNOVATE'} · {new Date(item.createdAt).toLocaleString()}</small></div><ChevronRight size={16} /></button>)}</section></>;
}
function StartupProfilePage({ notify, authUser }) {
  const [form, setForm] = useState({});
  useEffect(() => { apiRequest('/api/auth/me').then(({user}) => setForm(user || authUser || {})).catch(() => setForm(authUser || {})); }, []);
  const update = k => e => setForm(v => ({...v, [k]: e.target.value}));
  const save = async () => { try { const {user} = await apiRequest('/api/auth/me', {method:'PATCH', body:JSON.stringify(form)}); setForm(user); notify('Startup profile saved.'); } catch(e) { notify(e.message); } };
  const initials=(form.startupName || form.name || 'ST').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return <><PageHeader eyebrow="GOVERNMENT INNOVATION PROFILE" title={form.startupName || form.name || 'Startup profile'} subtitle="Keep your solution, sector and contact details ready for government opportunity matching." action={<button className="primary-btn" onClick={save}>Save profile <Check size={16}/></button>} /><section className="profile-hero panel"><div className="profile-logo">{initials}</div><div className="profile-heading"><span>{(form.startupName || 'STARTUP').toUpperCase()} · {form.sector || 'INNOVATION'} · MAHARASHTRA</span><h2>{form.name || 'Authorized representative'}</h2><p>Authenticated startup account. Profile information is used to improve opportunity matching.</p><div><Badge type="success">Registered</Badge><Badge type="purple">{form.sector || 'Sector pending'}</Badge></div></div><div className="profile-contact"><span>PRIMARY CONTACT</span><strong>{form.name || '—'}</strong><small>{form.email || '—'}</small></div></section><section className="panel profile-facts-panel"><PanelTitle title="Profile details" /><div className="profile-edit-grid"><label>Startup name<input value={form.startupName || ''} onChange={update('startupName')} /></label><label>Authorized person<input value={form.name || ''} onChange={update('name')} /></label><label>Official email<input value={form.email || ''} disabled /></label><label>Mobile<input value={form.mobile || ''} onChange={update('mobile')} /></label><label>Sector<input value={form.sector || ''} onChange={update('sector')} /></label><label>Website<input value={form.website || ''} onChange={update('website')} /></label></div></section><section className="panel"><PanelTitle title="Profile actions" /><div className="profile-action-grid"><button className="secondary-btn" onClick={()=>notify('Profile improvement checklist opened. Add capabilities, deployments and evidence to increase matching confidence.')}>Improve profile</button><button className="secondary-btn" onClick={()=>notify('Deployment entry form opened. Add deployment evidence through Documents.')}>Add deployment</button><button className="secondary-btn" onClick={()=>notify('Officer conversation opened. Your message has been prepared in the notification workflow.')}>Message officer</button></div></section></>;
}
function OfficerProfilePage({ notify, authUser }) {
  const [form, setForm] = useState({});
  useEffect(() => { apiRequest('/api/auth/me').then(({user}) => setForm(user || authUser || {})).catch(() => setForm(authUser || {})); }, []);
  const update = k => e => setForm(v => ({...v, [k]: e.target.value}));
  const save = async () => { try { const {user} = await apiRequest('/api/auth/me', {method:'PATCH', body:JSON.stringify(form)}); setForm(user); notify('Profile saved. Mobile and Government ID are now stored in MongoDB.'); } catch(e) { notify(e.message); } };
  const initials = (form.name || 'Officer').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return <><PageHeader eyebrow="OFFICER PROFILE" title={form.name || 'Government Officer'} subtitle="Your department details and decision permissions." action={<button className="primary-btn" onClick={save}>Save profile <Check size={16} /></button>} /><section className="profile-grid"><div className="panel profile-simple"><div className="profile-logo">{initials}</div><div><span>GOVERNMENT OFFICER</span><h2>{form.department || 'Department not specified'}</h2><p>{form.designation || 'Officer workspace'}</p></div></div><section className="panel profile-facts-panel"><PanelTitle title="Account details" /><div className="profile-edit-grid"><label>Full name<input value={form.name || ''} onChange={update('name')} /></label><label>Official email<input value={form.email || ''} disabled /></label><label>Mobile<input value={form.mobile || ''} onChange={update('mobile')} /></label><label>Government ID<input value={form.governmentId || ''} onChange={update('governmentId')} /></label><label>Department<input value={form.department || ''} onChange={update('department')} /></label><label>Designation<input value={form.designation || ''} onChange={update('designation')} /></label></div></section></section><div className="policy-note wide"><ShieldCheck size={16} /><span>Mobile and Government ID are account fields stored with the authenticated user, not temporary display-only values.</span></div></>;
}
function AdminPage({ page, jump, notify, authUser }) {
  if (page === 'Dashboard' || page === 'State Overview') return <AdminOverview page="State Overview" notify={notify} authUser={authUser} jump={jump} />;
  const handlers = {
    'Departments': 'Departments', 'Startups': 'Startups', 'Pilots': 'Pilots', 'Procurement': 'Procurement',
    'Innovation Map': 'Innovation Map', 'Policy Compliance': 'Policy Compliance', 'ROI & Impact': 'ROI & Impact',
    'Grievances': 'Grievances', 'Audit Logs': 'Audit Logs', 'Notifications': 'Notifications', 'Profile': 'Profile'
  };
  if (handlers[page]) {
    if (page === 'Innovation Map') return <MapPage />;
    if (page === 'Policy Compliance') return <CompliancePage />;
    if (page === 'ROI & Impact') return <ImpactPage />;
    if (page === 'Audit Logs') return <AuditPage notify={notify} />;
    if (page === 'Notifications') return <NotificationsPage notify={notify} jump={jump} role="admin" />;
    if (page === 'Profile') return <AdminProfilePage notify={notify} authUser={authUser} />;
    return <AdminDataPage page={page} notify={notify} jump={jump} />;
  }
  return <AdminOverview page="State Overview" notify={notify} authUser={authUser} jump={jump} />;
}

function AdminDataPage({ page, notify, jump }) {
  const configs = {
    Departments: ['DEPARTMENTS', 'Departments across Maharashtra', 'Monitor participating departments, posted problems and pilot activity.', ['Pune Municipal Corporation','Public Health Department','Maharashtra Jeevan Pradhikaran','Thane Municipal Corporation']],
    Startups: ['STARTUP ECOSYSTEM', 'Registered startups', 'Review startup participation, evidence and pilot history.', ['EcoVision AI','CivicFlow Labs','SortSmart Technologies','AquaSense Labs']],
    Pilots: ['PILOT PORTFOLIO', 'Active and completed pilots', 'Track pilot progress, KPI evidence and outcomes.', ['Urban waste segregation','Water leakage detection','Primary health access','Street-light maintenance']],
    Procurement: ['PROCUREMENT', 'Procurement-ready decisions', 'Review evaluated pilots and the next authorized procurement step.', ['MH-INNO-2026-00482','MH-INNO-2026-00471','MH-INNO-2026-00458']],
    Grievances: ['GRIEVANCES', 'Grievance review', 'Track concerns and their review status without exposing raw database IDs.', ['GRV-2026-0041','GRV-2026-0038','GRV-2026-0029']]
  };
  const [eyebrow,title,subtitle,items] = configs[page] || ['STATE WORKSPACE', page, 'Review state innovation activity.', []];
  return <><PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} action={<button className="primary-btn" onClick={()=>notify(`${page} workspace refreshed from the platform data store.`)}><Activity size={16}/> Refresh data</button>} /><section className="panel"><PanelTitle title="Live workspace" /><div className="admin-list">{items.map((item,i)=><div className="work-row" key={item}><div className="work-mark"><CheckCircle2 size={16}/></div><div className="work-main"><strong>{item}</strong><span>{page} record · Maharashtra</span></div><Badge type={i===0?'success':'purple'}>{i===0?'Needs attention':'Active'}</Badge><button className="row-action" onClick={()=>notify(`${item} record opened.`)}>Open <ChevronRight size={14}/></button></div>)}</div><div className="policy-note wide"><Info size={16}/><span>Actions are connected to the authenticated workspace. Records shown here are demonstration records until live state data is available.</span></div></section></>;
}

function AdminProfilePage({ notify, authUser }) {
  const [form,setForm]=useState(authUser||{});
  useEffect(()=>{ apiRequest('/api/auth/me').then(({user})=>setForm(user||{})).catch(()=>{}); },[]);
  const update=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
  const save=async()=>{try{const {user}=await apiRequest('/api/auth/me',{method:'PATCH',body:JSON.stringify(form)});setForm(user);notify('State Administrator profile saved.');}catch(e){notify(e.message);}};
  return <><PageHeader eyebrow="STATE ADMINISTRATOR PROFILE" title={form.name||'State Administrator'} subtitle="Manage your state-level account and contact details." action={<button className="primary-btn" onClick={save}>Save profile <Check size={16}/></button>} /><section className="panel profile-facts-panel"><div className="profile-edit-grid"><label>Full name<input value={form.name||''} onChange={update('name')}/></label><label>Official email<input value={form.email||''} disabled/></label><label>Mobile<input value={form.mobile||''} onChange={update('mobile')}/></label><label>Government ID<input value={form.governmentId||''} onChange={update('governmentId')}/></label><label>Department<input value={form.department||''} onChange={update('department')}/></label><label>Designation<input value={form.designation||''} onChange={update('designation')}/></label></div></section></>;
}

function AdminOverview({ page, notify, authUser, jump }) {
  const title = page === 'State Overview' ? 'State innovation overview' : page;
  const [dbStats, setDbStats] = useState({ startups: null, activeTrials: null, scaledSolutions: null, totalBudget: null });
  useEffect(() => { apiRequest('/api/dashboard/stats').then(b => { if (b?.stats) setDbStats(b.stats); }).catch(() => {}); }, []);
  const budgetStr = dbStats.totalBudget === null ? '—' : dbStats.totalBudget >= 10000000 ? `₹${(dbStats.totalBudget/10000000).toFixed(1)}Cr` : dbStats.totalBudget >= 100000 ? `₹${Math.round(dbStats.totalBudget/100000)}L` : `₹${Number(dbStats.totalBudget||0).toLocaleString('en-IN')}`;
  const ls = (n, fb) => n === null ? fb : String(n).padStart(2,'0');
  return <><PageHeader eyebrow="STATE ADMINISTRATOR VIEW" title={`${title} · ${(authUser?.name || 'State Administrator').split(' ')[0]}`} subtitle="A state-level view of pilot health, procurement readiness and innovation impact." action={<button className="outline-btn" onClick={() => { const report = `GOV INNOVATE State Report\nGenerated: ${new Date().toLocaleString()}\nState: Maharashtra\nTotal startups: 48\nActive pilots: 06\nSolutions scaled: 03\nPilot budget: ₹42L\nProcurement value: ₹1.8Cr`; const blob = new Blob([report], {type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='GOV-INNOVATE-state-report.txt'; a.click(); URL.revokeObjectURL(url); notify('State report exported successfully.'); }}><FileText size={16} /> Export state report</button>} /><div className="admin-filter"><span><CalendarDays size={15} /> {new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span><span><Map size={15} /> Maharashtra · all districts</span>{dbStats.startups!==null?<span className="sample-pill">LIVE DATA</span>:<span className="sample-pill">LOADING</span>}</div><div className="stat-grid admin-stats">{[[ls(dbStats.startups,'—'),'Total startups',dbStats.startups===null?'Loading…':'Registered',Users,'purple'],[ls(dbStats.activeTrials,'—'),'Active pilots',dbStats.activeTrials===null?'Loading…':'Running',Activity,'blue'],[ls(dbStats.scaledSolutions,'—'),'Solutions scaled',dbStats.scaledSolutions===null?'Loading…':'Recommendations',TrendingUp,'green'],[budgetStr,'Pilot budget',dbStats.totalBudget===null?'Loading…':'Across all trials',WalletCards,'orange']].map(([n,l,s,I,c]) => <div className="stat-card" key={l}><div className={`stat-icon ${c}`}><I size={18} /></div><strong>{n}</strong><span>{l}</span><small>{s}</small></div>)}</div><div className="content-grid three-two"><section className="panel"><PanelTitle title="Pilot portfolio" action="View all pilots" onClick={() => jump('Pilots')} /><div className="portfolio-chart"><div className="chart-y"><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><div className="bars">{[['Aug','9','6','3'],['Sep','13','8','5'],['Oct','16','11','7'],['Nov','19','14','9'],['Dec','22','17','12']].map(([m,a,b,c]) => <div key={m}><div className="bar-stack"><i style={{height:`${a*3}px`}} /><i style={{height:`${b*3}px`}} /><i style={{height:`${c*3}px`}} /></div><span>{m}</span></div>)}</div><div className="chart-legend"><span><i className="purple-bg" /> Active</span><span><i className="blue-bg" /> Successful</span><span><i className="green-bg" /> Scaled</span></div></div></div></section><section className="panel"><PanelTitle title="Outcome health" action="Methodology" onClick={() => notify('Methodology: pilot health combines KPI achievement, milestone completion, evidence verification and unresolved review flags.')} /><div className="outcome-health"><div className="big-stat"><strong>87%</strong><span>average KPI achievement</span><div className="score-bar"><i style={{width:'87%'}} /></div></div><div className="outcome-list">{[['Successful pilots','03','green'],['Awaiting evaluation','03','orange'],['Review required','02','red']].map(([x,n,c]) => <div key={x}><span className={`status-dot ${c}`} />{x}<b>{n}</b></div>)}</div></div></section></div><div className="content-grid two-one"><section className="panel"><PanelTitle title="District activity" action="Open map" onClick={() => jump('Innovation Map')} /><div className="district-table">{[['Pune','08','03','02'],['Mumbai','06','02','01'],['Nashik','04','01','00'],['Nagpur','05','02','01'],['Thane','03','01','00']].map(([d,p,s,sc]) => <div key={d}><strong>{d}</strong><span>{p} startups</span><span>{s} active pilots</span><b>{sc} scaled</b><ChevronRight size={15} /></div>)}</div></section><section className="panel"><PanelTitle title="Policy signals" action="Review" onClick={() => jump('Policy Compliance')} /><div className="policy-signals"><div><span className="signal-num orange">04</span><div><strong>Requirements need review</strong><small>Potentially restrictive criteria detected</small></div></div><div><span className="signal-num green">11</span><div><strong>Startups benefited</strong><small>From startup-friendly criteria</small></div></div><div><span className="signal-num purple">07</span><div><strong>Pending policy reviews</strong><small>Awaiting administrator action</small></div></div></div></section></div></>;
}

function MapPage() {
  const districtNames = ['Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'];
  const [activity,setActivity]=useState([]); const [selected,setSelected]=useState('Pune');
  useEffect(()=>{apiRequest('/api/admin/district-activity').then(b=>setActivity(b.districts||[])).catch(()=>{});},[]);
  const get=(d)=>activity.find(x=>x.district===d)||{district:d,problems:0,pilots:0,startups:0,activity:0};
  return <><PageHeader eyebrow="MAHARASHTRA INNOVATION MAP" title="Innovation across all 36 districts" subtitle="Select a district to see database-driven problem, startup and pilot activity. District geometry is visual; activity comes from MongoDB." /><div className="map-layout"><section className="panel state-map"><div className="map-toolbar"><div><strong>Maharashtra district activity</strong><span>36 districts · live platform activity</span></div><div className="map-legend"><span><i className="dot purple-bg" /> Active</span><span><i className="dot green-bg" /> Higher activity</span></div></div><div className="district-map-grid">{districtNames.map(d=>{const a=get(d); return <button key={d} className={`district-chip ${d===selected?'selected':''}`} onClick={()=>setSelected(d)}><strong>{d}</strong><span>{a.activity} activity</span><small>{a.startups} startups · {a.pilots} pilots</small></button>})}</div></section><aside className="panel map-side"><PanelTitle title="Selected district" /><div className="selected-district"><div className="district-emblem">{selected.slice(0,2).toUpperCase()}</div><div><strong>{selected}</strong><span>Database-driven activity</span></div></div><div className="district-stats"><div><strong>{get(selected).startups}</strong><span>Startups</span></div><div><strong>{get(selected).pilots}</strong><span>Active pilots</span></div><div><strong>{get(selected).problems}</strong><span>Problems</span></div><div><strong>{get(selected).activity}</strong><span>Total activity</span></div></div><p className="plain-panel-copy">Counts update from registered startups, posted problems and pilots in the platform data store.</p></aside></div></>;
}
function CompliancePage() {
  return <><PageHeader eyebrow="POLICY COMPLIANCE" title="Review, don't automate the decision" subtitle="Spot requirements that may need policy review. This dashboard does not declare legal compliance." action={<button className="outline-btn"><FileText size={16} /> Policy references</button>} /><div className="compliance-banner"><ShieldCheck size={20} /><div><strong>11 startups benefited from startup-friendly criteria</strong><span>4 requirements need a closer review before publishing.</span></div><Badge type="warning">Review required</Badge></div><section className="panel compliance-table"><div className="table-caption"><strong>Requirements needing review</strong><span>Demo signals generated from configured policy rules</span></div><table><thead><tr><th>Requirement</th><th>Department</th><th>Signal</th><th>Impact</th><th>Action</th></tr></thead><tbody>{[['Minimum turnover of ₹5 crore','Maharashtra Jeevan Pradhikaran','Potentially restrictive','4 startups affected'],['5 completed government deployments','Public Health Department','Review required','7 startups affected'],['ISO 27001 before pilot','Thane Municipal Corporation','Evidence requested','2 startups affected']].map(r => <tr key={r[0]}><td><strong>{r[0]}</strong><small>Posted 03 Sep 2026</small></td><td>{r[1]}</td><td><Badge type="warning">{r[2]}</Badge></td><td>{r[3]}</td><td><button className="row-action">Review <ChevronRight size={14} /></button></td></tr>)}</tbody></table></section><div className="policy-note wide"><Info size={16} /><span>Demo policy rules are illustrative. No legal clause or official procurement instruction is being inferred by this application.</span></div></>;
}

function ImpactPage() {
  return <><PageHeader eyebrow="ROI & IMPACT" title="Evidence of public value" subtitle="Connect pilot outcomes to the decisions that follow. Metrics below are sample data." /><div className="impact-kpi-grid">{[['87%','Average KPI achievement','Across completed pilots',TrendingUp,'green'],['19%','Average cost reduction','Reported by pilot teams',Scale,'purple'],['42 days','Average time to pilot','From post to approval',Clock3,'blue'],['3.4×','Potential replication','Opportunities per success',Network,'orange']].map(([n,l,s,I,c]) => <div className="impact-kpi panel" key={l}><div className={`stat-icon ${c}`}><I size={18} /></div><strong>{n}</strong><span>{l}</span><small>{s}</small></div>)}</div><div className="content-grid two-one"><section className="panel"><PanelTitle title="Impact story" /><div className="impact-story"><div className="story-step"><span>01</span><div><strong>Problem</strong><p>Pune's baseline waste segregation efficiency was 42%.</p></div></div><div className="story-step"><span>02</span><div><strong>Pilot</strong><p>EcoVision AI ran a controlled 90-day deployment across 4 wards.</p></div></div><div className="story-step"><span>03</span><div><strong>Evidence</strong><p>Accuracy reached 93%, exceeding the target of 90%.</p></div></div><div className="story-step"><span>04</span><div><strong>Next decision</strong><p>Procurement consideration and 18 sample replication opportunities.</p></div></div></div></section><section className="panel"><PanelTitle title="Sector distribution" /><div className="sector-bars">{[['CleanTech','35%','purple'],['CivicTech','25%','blue'],['HealthTech','20%','green'],['Water & Utilities','12%','orange'],['Other','8%','neutral']].map(([s,n,c]) => <div key={s}><span>{s}</span><div><i className={c} style={{width:n}} /></div><b>{n}</b></div>)}</div></section></div></>;
}

function PageHeader({ eyebrow, title, subtitle, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="header-action">{action}</div>}</div>;
}
function PanelTitle({ title, action, onClick }) { return <div className="panel-title"><h2>{title}</h2>{action && <button className="link-btn" onClick={onClick}>{action} <ArrowRight size={14} /></button>}</div>; }
function Badge({ children, type='neutral' }) { return <span className={`badge ${type}`}>{children}</span>; }

function ActionDialog({ kind, onClose, notify }) {
  const configs = {
    help: ['HELP & GUIDANCE', 'How to use the demo workspace', 'Follow the journey from a government problem to a measured pilot and procurement decision. Use the role switcher to explore all three user experiences.', 'Start with the complete procurement journey'],
    settings: ['DEMO SETTINGS', 'Workspace settings', 'This environment uses seeded sample data. Role permissions, policy rules and audit history are read-only in Demo Mode.', 'Save demo settings'],
    eligibility: ['ELIGIBILITY EXPLANATION', 'Why was this startup considered eligible?', 'The rule engine found that the startup has the required company documents, a relevant sector and a deployment plan within the pilot scope. Prior government experience is shown separately as evidence.', 'Acknowledge explanation'],
    history: ['STATUS HISTORY · MH-INNO-2026-00482', 'Every pilot step is traceable', '12 Aug · Pilot approved\n16 Aug · Agreement signed\n22 Aug · Deployment verified\n02 Sep · Milestone 2 verified\n15 Sep · Milestone 3 submitted for review', 'Close history'],
    risk: ['PILOT RISK RADAR', 'Why is this pilot marked low risk?', 'The assessment combines milestone completion, document availability, field deployment readiness and the absence of unresolved compliance flags. It is a rule-based demo assessment, not a guaranteed prediction.', 'Close risk explanation'],
    profile: ['GOVERNMENT INNOVATION PROFILE', 'EcoVision AI', 'Verified company · CleanTech · Pune\nTrust score 82/100 · 3 completed pilots\nComputer vision for waste segregation and ward-level analytics.', 'Open full profile'],
    clarification: ['CLARIFICATION REQUEST', 'Ask for more evidence', 'Choose what the startup needs to clarify before the officer makes a final decision.', 'Send clarification request'],
    rejection: ['STRUCTURED REJECTION', 'Record a fair rejection reason', 'A rejection must include a clear category and evidence. The startup can see this reason and request a review.', 'Save rejection'],
    'fair-rejection': ['FAIR REJECTION GUIDANCE', 'Make every rejection explainable', 'Select one reason, reference the evidence and tell the startup what would change the decision. This protects a fair review path.', 'Open rejection checklist']
  };
  const [label, title, body, action] = configs[kind] || configs.help;
  const form = ['clarification', 'rejection', 'fair-rejection'].includes(kind);
  return <div className="dialog-backdrop" onClick={onClose}><div className="dialog action-dialog" onClick={e => e.stopPropagation()}><button className="dialog-close" onClick={onClose}><X size={18} /></button><div className={`dialog-icon ${kind === 'rejection' ? 'orange' : 'purple'}`}><Info size={21} /></div><div className="dialog-kicker">{label}</div><h2>{title}</h2><p className="dialog-preline">{body}</p>{form && <><label>Reason or note<textarea placeholder={kind === 'clarification' ? 'Example: Please share the ward network plan and expected installation date.' : 'Write the evidence-based explanation the startup should see.'} /></label><label>{kind === 'clarification' ? 'Request type' : 'Decision category'}<select><option>{kind === 'clarification' ? 'Technical clarification' : 'Technical mismatch'}</option><option>Eligibility</option><option>Budget</option><option>Compliance</option><option>Timeline</option><option>Other</option></select></label></>}<div className="dialog-actions"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={() => { onClose(); notify(`${action} saved in the demo audit trail.`); }}>{action} <Check size={15} /></button></div></div></div>;
}

function Dialog({ kind, onClose, notify, jump }) {
  const isRequirement = kind === 'requirement';
  const isEvidence = kind === 'evidence';
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Post Problem form state
  const [problemForm, setProblemForm] = useState({
    title: '', description: '', department: '', sector: '', location: '',
    budgetMax: '', requiredCapabilities: '', expectedOutcome: ''
  });
  const [problemSubmitting, setProblemSubmitting] = useState(false);
  const [problemError, setProblemError] = useState('');
  const updateProblem = (key) => (e) => setProblemForm(v => ({ ...v, [key]: e.target.value }));

  const submitProblem = async (e) => {
    e.preventDefault();
    if (!problemForm.title.trim() || !problemForm.description.trim() || !problemForm.department.trim() || !problemForm.sector.trim()) {
      setProblemError('Title, description, department and sector are required.');
      return;
    }
    setProblemSubmitting(true);
    setProblemError('');
    try {
      const body = await apiRequest('/api/problems', {
        method: 'POST',
        body: JSON.stringify({
          ...problemForm,
          budgetMax: problemForm.budgetMax ? Number(String(problemForm.budgetMax).replace(/[^0-9]/g, '')) : 0
        })
      });
      onClose();
      window.dispatchEvent(new CustomEvent('gov-problems-refresh'));
      jump('Problems', body.message || 'Problem posted successfully. Relevant startups have been notified.');
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('authentication')) {
        setProblemError('Sign in as a Government Officer to post a problem.');
      } else {
        setProblemError(err.message || 'Could not post the problem. Please try again.');
      }
    } finally {
      setProblemSubmitting(false);
    }
  };

  const uploadEvidence = async () => {
    if (!selectedFile) {
      notify('Choose a PDF, image or report before uploading.');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      try {
        const trialBody = await apiRequest('/api/trials');
        const trial = trialBody?.trials?.[0];
        if (trial) { form.append('relatedTrial', trial.id); form.append('relatedApplication', trial.applicationId || ''); }
        else { const appBody = await apiRequest('/api/applications'); const app = appBody?.applications?.[0]; if (app) form.append('relatedApplication', app.id); }
      } catch {}
      const body = await apiRequest('/api/evidence', { method: 'POST', body: form });
      onClose();
      notify(body?.evidence?.isDemo ? 'Evidence saved in safe demo mode.' : 'Evidence uploaded securely to Firebase Storage.');
    } catch (error) {
      notify(error.message);
    } finally {
      setUploading(false);
    }
  };
  if (!['requirement', 'evidence', 'evaluation'].includes(kind)) return <ActionDialog kind={kind} onClose={onClose} notify={notify} />;
  return <div className="dialog-backdrop" onClick={onClose}><div className="dialog" onClick={e => e.stopPropagation()}><button className="dialog-close" onClick={onClose}><X size={18} /></button>{isRequirement ? <form onSubmit={submitProblem}><div className="dialog-icon purple"><Target size={21} /></div><div className="dialog-kicker">POST A GOVERNMENT PROBLEM</div><h2>Post a new government challenge.</h2><p>Fill in the details below. Registered startups will be notified by email when the problem is saved.</p>{problemError && <div className="auth-error"><AlertCircle size={16} />{problemError}</div>}<label>Problem title <span style={{color:'#dc2626'}}>*</span><input required value={problemForm.title} onChange={updateProblem('title')} placeholder="e.g. Improve urban waste segregation" /></label><label>Description <span style={{color:'#dc2626'}}>*</span><textarea required value={problemForm.description} onChange={updateProblem('description')} placeholder="Describe the problem, current challenges and desired outcome." style={{minHeight:'72px',width:'100%',padding:'8px',boxSizing:'border-box',resize:'vertical'}} /></label><div className="dialog-grid"><label>Department <span style={{color:'#dc2626'}}>*</span><input required value={problemForm.department} onChange={updateProblem('department')} placeholder="e.g. Pune Municipal Corporation" /></label><label>Sector <span style={{color:'#dc2626'}}>*</span><input required value={problemForm.sector} onChange={updateProblem('sector')} placeholder="e.g. CleanTech, HealthTech" /></label><label>Location / District<input value={problemForm.location} onChange={updateProblem('location')} placeholder="e.g. Pune" /></label><label>Budget (₹)<input value={problemForm.budgetMax} onChange={updateProblem('budgetMax')} placeholder="e.g. 800000" type="number" min="0" /></label></div><label>Required capabilities<input value={problemForm.requiredCapabilities} onChange={updateProblem('requiredCapabilities')} placeholder="e.g. Computer vision, IoT sensors" /></label><label>Expected outcome<input value={problemForm.expectedOutcome} onChange={updateProblem('expectedOutcome')} placeholder="e.g. Achieve 70%+ segregation efficiency" /></label><div className="ai-suggestion"><Mail size={15} /><div><strong>Email notifications</strong><span>Registered startups will receive an email notification with the problem details when you post this challenge.</span></div></div><div className="dialog-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn" disabled={problemSubmitting}>{problemSubmitting ? 'Posting…' : <><Plus size={15} /> Post problem</>}</button></div></form> : isEvidence ? <><div className="dialog-icon orange"><UploadCloud size={21} /></div><div className="dialog-kicker">EVIDENCE UPLOAD</div><h2>Add pilot evidence</h2><p>Upload a PDF, image or report. Firebase Storage is used when configured; otherwise the platform keeps safe demo metadata.</p><label className="upload-file-label">Choose file<input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx,.doc,.docx" onChange={event => setSelectedFile(event.target.files?.[0] || null)} /></label>{selectedFile && <div className="evidence-file"><FileText size={20} /><div><strong>{selectedFile.name}</strong><span>{Math.round(selectedFile.size / 1024)} KB · Ready to upload</span></div><CheckCircle2 size={17} /></div>}<div className="review-note"><Info size={15} /><span>Only authenticated users can upload evidence. Record access is checked server-side.</span></div><div className="dialog-actions"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={uploadEvidence} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload evidence'} <UploadCloud size={16} /></button></div></> : <><div className="dialog-icon green"><ClipboardCheck size={21} /></div><div className="dialog-kicker">PILOT EVALUATION</div><h2>Evaluate pilot performance</h2><p>Review target vs actual results before generating the decision pack.</p><div className="kpi-review">{[['Classification accuracy','90%','93%','103%'],['Processing time','30 min','22 min','136%'],['Cost reduction','15%','19%','127%']].map(([a,b,c,d]) => <div key={a}><strong>{a}</strong><span>{b}</span><span>{c}</span><b>{d}</b></div>)}</div><div className="score-preview"><span>Calculated performance score</span><strong>91<span>/100</span></strong></div><button className="primary-btn full" onClick={() => { onClose(); notify('Evaluation saved. Decision pack is ready for review.'); }}>Save evaluation <ArrowRight size={16} /></button></>}</div></div>;
}

function AuthView({ mode, onBack, onSuccess }) {
  const [form, setForm] = useState({ role: 'officer', name: '', email: '', mobile: '', department: '', designation: '', governmentId: '', startupName: '', dpiitId: '', sector: '', website: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const update = (key) => (event) => setForm(current => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to complete authentication.');
      onSuccess(body.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  return <div className="auth-shell"><div className="auth-brand"><button className="brand" onClick={onBack}><span className="brand-mark"><span /></span><span><strong>GOV</strong><em>INNOVATE</em><small>Innovation Procurement Platform</small></span></button></div><main className="auth-layout"><section className="auth-intro"><div className="eyebrow"><span className="eyebrow-dot" /> Secure access</div><h1>{isRegister ? 'Create your platform account.' : 'Welcome back to the innovation journey.'}</h1><p>Move from a government problem to a proven solution with clear roles, evidence and decisions.</p><div className="auth-flow">{['Post problem','Find startups','Trial (Pilot)','Make a decision'].map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>)}</div></section><form className="auth-card panel" onSubmit={submit}><div className="section-kicker">{isRegister ? 'REGISTER' : 'LOGIN'}</div><h2>{isRegister ? 'Create an account' : 'Sign in to GOV INNOVATE'}</h2><p>{isRegister ? 'Choose a role to get started. State Administrator accounts can be created for the SIH demonstration environment.' : 'Use the email and password for your registered account. Your role determines the dashboard you see.'}</p>{error && <div className="auth-error"><AlertCircle size={16} />{error}</div>}{isRegister && <label>Account type<select value={form.role} onChange={update('role')}><option value="officer">Government Officer</option><option value="startup">Startup</option><option value="admin">State Administrator</option></select></label>}{isRegister && form.role === 'officer' && <><label>Full name<input required value={form.name} onChange={update('name')} placeholder="Priya Deshmukh" /></label><div className="auth-grid"><label>Official email<input required type="email" value={form.email} onChange={update('email')} placeholder="name@department.gov.in" /></label><label>Mobile number<input required value={form.mobile} onChange={update('mobile')} placeholder="+91..." /></label></div><div className="auth-grid"><label>Department<input required value={form.department} onChange={update('department')} placeholder="Department or corporation" /></label><label>Designation<input required value={form.designation} onChange={update('designation')} placeholder="Your designation" /></label></div><label>Government ID / verification reference<input required value={form.governmentId} onChange={update('governmentId')} placeholder="Verification reference" /></label></>}{isRegister && form.role === 'admin' && <><label>Full name<input required value={form.name} onChange={update('name')} placeholder="State Administrator" /></label><div className="auth-grid"><label>Official email<input required type="email" value={form.email} onChange={update('email')} placeholder="admin@maharashtra.gov.in" /></label><label>Mobile number<input required value={form.mobile} onChange={update('mobile')} placeholder="+91..." /></label></div><div className="auth-grid"><label>Department<input required value={form.department} onChange={update('department')} placeholder="Government of Maharashtra" /></label><label>Designation<input required value={form.designation} onChange={update('designation')} placeholder="State Administrator" /></label></div><label>Government ID / verification reference<input required value={form.governmentId} onChange={update('governmentId')} placeholder="Verification reference" /></label></>}{isRegister && form.role === 'startup' && <><label>Startup name<input required value={form.startupName} onChange={update('startupName')} placeholder="EcoVision Technologies" /></label><label>Authorized person<input required value={form.name} onChange={update('name')} placeholder="Founder or authorized representative" /></label><div className="auth-grid"><label>Official email<input required type="email" value={form.email} onChange={update('email')} placeholder="team@startup.com" /></label><label>Mobile number<input required value={form.mobile} onChange={update('mobile')} placeholder="+91..." /></label></div><div className="auth-grid"><label>Startup / DPIIT ID<input required value={form.dpiitId} onChange={update('dpiitId')} placeholder="Registration ID" /></label><label>Sector<input required value={form.sector} onChange={update('sector')} placeholder="CleanTech" /></label></div><label>Website<input type="url" value={form.website} onChange={update('website')} placeholder="https://..." /></label></>}{!isRegister && <><label>Email<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" /></label><label>Password<input required type="password" value={form.password} onChange={update('password')} placeholder="Your password" /></label></>}{isRegister && <div className="auth-grid"><label>Password<input required minLength="8" type="password" value={form.password} onChange={update('password')} placeholder="At least 8 characters" /></label><label>Confirm password<input required minLength="8" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Repeat password" /></label></div>}<button className="primary-btn full" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'} <ArrowRight size={16} /></button><button type="button" className="auth-back" onClick={onBack}>{isRegister ? 'Already have an account? Log in' : 'Need an account? Register'}</button></form></main></div>;
}

createRoot(document.getElementById('root')).render(<App />);