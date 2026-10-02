import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, BookOpen, Brain, CalendarDays, Check, ChevronRight, CircleHelp, Flame, LayoutDashboard, LogIn, LogOut, Menu, MessageCircle, MoreHorizontal, Plus, Send, Sparkles, Square, Target, Trash2, Trophy, X } from 'lucide-react';
import { askTutor, buildQuiz } from './services/tutorAgent';
import './style.css';
import './study-plan.css';
import './workspace-pages.css';

const initialMessages = [
  { role: 'agent', text: 'Good morning, Ganiesghaa. I reviewed your plan and found one useful place to start.', time: '09:12' },
  { role: 'agent', text: 'Your Biology review is due today. Want a two-minute refresher before you begin?', time: '09:12' }
];
const lessons = [
  { title: 'Cellular respiration', subject: 'Biology', duration: '25 min', color: 'mint', progress: 72, icon: '◒' },
  { title: 'Quadratic equations', subject: 'Mathematics', duration: '35 min', color: 'coral', progress: 38, icon: '∿' },
  { title: 'The French Revolution', subject: 'History', duration: '20 min', color: 'gold', progress: 16, icon: '◈' }
];
const dates = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const calendarDates = [28, 29, 30, 1, 2, 3, 4];

function App() {
  const [active, setActive] = useState('Overview');
  const [messages, setMessages] = useState(() => {
    const savedMessages = JSON.parse(localStorage.getItem('orbit-messages') || 'null');
    return savedMessages ? savedMessages.map((message) => ({ ...message, text: message.text.replaceAll('Arjun', 'Ganiesghaa').replaceAll('Ganesha', 'Ganiesghaa') })) : initialMessages;
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('orbit-streak') || 7));
  const [completed, setCompleted] = useState(() => Number(localStorage.getItem('orbit-completed') || 12));
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quiz, setQuiz] = useState(() => buildQuiz('Cellular respiration'));
  const [mobileNav, setMobileNav] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem('orbit-signed-in') !== 'false');
  const tutorRequest = useRef(null);

  useEffect(() => localStorage.setItem('orbit-messages', JSON.stringify(messages)), [messages]);
  useEffect(() => { localStorage.setItem('orbit-streak', String(streak)); localStorage.setItem('orbit-completed', String(completed)); }, [streak, completed]);

  const sendMessage = async (event, preset) => {
    event?.preventDefault();
    const text = (preset || input).trim();
    if (!text || isThinking) return;
    setInput('');
    setMessages((current) => [...current, { role: 'user', text, time: 'now' }]);
    setIsThinking(true);
    const controller = new AbortController();
    tutorRequest.current = controller;
    try {
      const reply = await askTutor(text, { streak, completed, lessons }, controller.signal);
      setMessages((current) => [...current, { role: 'agent', text: reply, time: 'now' }]);
    } catch (error) {
      if (error.name !== 'AbortError') setMessages((current) => [...current, { role: 'agent', text: 'I could not complete that answer. Please try again.', time: 'now' }]);
    } finally {
      tutorRequest.current = null;
      setIsThinking(false);
    }
  };

  const stopTutor = () => tutorRequest.current?.abort();
  const clearChat = () => {
    tutorRequest.current?.abort();
    localStorage.removeItem('orbit-messages');
    setMessages([]);
    setIsThinking(false);
  };
  const signIn = () => { localStorage.setItem('orbit-signed-in', 'true'); setSignedIn(true); setShowAccount(false); };
  const signOut = () => { localStorage.setItem('orbit-signed-in', 'false'); setSignedIn(false); setShowAccount(false); setActive('Overview'); };

  const completeLesson = () => { setCompleted((value) => value + 1); setStreak((value) => value + 1); };
  const startQuiz = () => { setQuiz(buildQuiz('Cellular respiration')); setQuizIndex(0); setQuizScore(0); setShowQuiz(true); };
  const chooseAnswer = (answer) => { const nextScore = quizScore + (answer === quiz[quizIndex].answer ? 1 : 0); setQuizScore(nextScore); if (quizIndex < quiz.length - 1) setQuizIndex(quizIndex + 1); else setShowQuiz('done'); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>orbit</span><button className="icon-btn close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <button className="profile profile-button" onClick={() => setShowAccount(true)}><div className="avatar">{signedIn ? 'G' : '?'}</div><div><strong>{signedIn ? 'Ganiesghaa' : 'Guest'}</strong><span>{signedIn ? 'Year 12 · Science' : 'Sign in to sync'}</span></div><MoreHorizontal size={17} className="muted" /></button>
      <nav><p className="nav-label">Workspace</p>{[['Overview', LayoutDashboard], ['Tutor chat', MessageCircle], ['My subjects', BookOpen], ['Study plan', CalendarDays]].map(([label, Icon]) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{label === 'Tutor chat' && <i className="notification-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak-mini"><Flame size={17} /><div><strong>{streak} day streak</strong><span>Keep the rhythm going</span></div></div><button className={active === 'Goals' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('Goals'); setMobileNav(false); }}><Target size={18} /><span>Goals</span></button><button className={active === 'Achievements' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('Achievements'); setMobileNav(false); }}><Trophy size={18} /><span>Achievements</span></button></div>
      <div className="sidebar-footer"><span>Made for focused minds</span><span className="online"><i /> AI online</span></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-btn menu-btn" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{active}</strong></div><div className="top-actions"><button className="icon-btn" title="Help" onClick={() => setShowHelp(true)}><CircleHelp size={19} /></button><button className="avatar small" onClick={() => setShowAccount(true)}>{signedIn ? 'G' : '?'}</button></div></header>
      {active === 'Tutor chat' ? <ChatPage messages={messages} input={input} setInput={setInput} sendMessage={sendMessage} isThinking={isThinking} stopTutor={stopTutor} clearChat={clearChat} /> : active === 'Overview' ? <Dashboard setActive={setActive} completeLesson={completeLesson} startQuiz={startQuiz} completed={completed} streak={streak} sendMessage={sendMessage} /> : active === 'Study plan' ? <StudyPlanPage setActive={setActive} /> : active === 'Goals' ? <GoalsPage setActive={setActive} /> : active === 'Achievements' ? <AchievementsPage /> : active === 'My subjects' ? <SubjectsPage setActive={setActive} /> : <WorkspacePage active={active} setActive={setActive} />}
    </main>
    {showQuiz && <QuizModal quiz={quiz} state={showQuiz} index={quizIndex} score={quizScore} chooseAnswer={chooseAnswer} close={() => setShowQuiz(false)} />}
    {showHelp && <HelpModal close={() => setShowHelp(false)} />}
    {showAccount && <AccountModal signedIn={signedIn} signIn={signIn} signOut={signOut} close={() => setShowAccount(false)} />}
  </div>;
}

function Dashboard({ setActive, completeLesson, startQuiz, completed, streak, sendMessage }) {
  return <div className="page"><section className="welcome-row"><div><p className="eyebrow">THURSDAY, 1 OCTOBER 2026</p><h1>Good morning, Ganiesghaa <span>✦</span></h1><p className="subhead">A little progress today makes tomorrow easier.</p></div><button className="primary-btn" onClick={() => setActive('Tutor chat')}><MessageCircle size={17} /> Ask your tutor</button></section>
    <section className="metric-grid"><Metric label="Weekly progress" value="68%" detail="+12% from last week" trend="up" icon={Target} /><Metric label="Study streak" value={`${streak} days`} detail="Your best: 14 days" icon={Flame} warm /><Metric label="Completed" value={completed} detail="3 sessions this week" icon={Check} /></section>
    <div className="content-grid"><section className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR NEXT MOVE</p><h2>Continue learning</h2></div><button className="text-btn" onClick={() => setActive('My subjects')}>View all <ArrowUpRight size={15} /></button></div><div className="featured-lesson"><div className="lesson-art mint-art"><span>◒</span><div className="orbit-ring" /></div><div className="lesson-copy"><span className="tag mint-tag">BIOLOGY · 25 MIN</span><h3>Cellular respiration</h3><p>Pick up where you left off. Your last note was about the electron transport chain.</p><div className="progress-line"><span style={{ width: '72%' }} /></div><small>72% complete</small></div><button className="round-arrow" onClick={completeLesson}><ArrowUpRight size={20} /></button></div><div className="lesson-list">{lessons.slice(1).map((lesson) => <div className="lesson-row" key={lesson.title}><div className={`lesson-art small-art ${lesson.color}-art`}><span>{lesson.icon}</span></div><div className="lesson-row-copy"><strong>{lesson.title}</strong><span>{lesson.subject} · {lesson.duration}</span></div><div className="tiny-progress"><i style={{ width: `${lesson.progress}%` }} /></div><ChevronRight size={17} className="muted" /></div>)}</div></section>
      <section className="panel plan-panel"><div className="panel-heading"><div><p className="eyebrow">THIS WEEK</p><h2>Study rhythm</h2></div><button className="icon-btn"><MoreHorizontal size={18} /></button></div><div className="week-strip">{dates.map((date, index) => <div key={date} className={index === 3 ? 'date active-date' : 'date'}><span>{date}</span><b>{calendarDates[index]}</b>{index === 3 && <i />}</div>)}</div><div className="plan-summary"><div className="donut"><span>4.5<small>hrs</small></span></div><div><strong>You're on track</strong><p>2h 15m left to hit your weekly goal.</p><button className="text-btn" onClick={() => setActive('Study plan')}>Open plan <ArrowUpRight size={15} /></button></div></div><div className="goal-bar"><span style={{ width: '68%' }} /></div><div className="goal-label"><span>Weekly goal</span><strong>6h 45m / 10h</strong></div></section></div>
    <section className="bottom-grid"><section className="panel agent-panel"><div className="agent-icon"><Brain size={22} /></div><div><p className="eyebrow">ORBIT'S SUGGESTION</p><h2>Make your next session count</h2><p>You've been reviewing facts. A quick application quiz will help lock them in.</p><button className="secondary-btn" onClick={startQuiz}>Start a quick quiz <ArrowUpRight size={16} /></button></div></section><section className="panel quote-panel"><span className="quote-mark">“</span><blockquote>Small steps, consistently taken, become remarkable results.</blockquote><span className="quote-source">— James Clear</span></section></section>
  </div>;
}

function Metric({ label, value, detail, trend, icon: Icon, warm }) { return <div className="metric"><div className={`metric-icon ${warm ? 'warm' : ''}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small className={trend === 'up' ? 'trend' : ''}>{trend === 'up' && '↗ '}{detail}</small></div></div>; }
function StudyPlanPage({ setActive }) {
  const [selectedDay, setSelectedDay] = useState(3);
  const [showAdd, setShowAdd] = useState(false);
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('orbit-plan') || 'null') || [
    { id: 1, day: 3, time: '09:30', title: 'Cellular respiration', subject: 'Biology', duration: '25 min', color: 'mint', icon: '◒', done: false },
    { id: 2, day: 3, time: '16:00', title: 'Quadratic equations', subject: 'Mathematics', duration: '35 min', color: 'coral', icon: '∿', done: false },
    { id: 3, day: 5, time: '18:30', title: 'The French Revolution', subject: 'History', duration: '20 min', color: 'gold', icon: '◈', done: false }
  ]);
  const [newSession, setNewSession] = useState({ time: '17:00', title: '', subject: 'General study', duration: '25 min' });
  const daySessions = sessions.filter((session) => session.day === selectedDay);
  const completedCount = sessions.filter((session) => session.done).length;
  const addSession = (event) => {
    event.preventDefault();
    if (!newSession.title.trim()) return;
    setSessions((current) => [...current, { ...newSession, id: Date.now(), day: selectedDay, color: 'mint', icon: '✦', done: false }]);
    setNewSession({ time: '17:00', title: '', subject: 'General study', duration: '25 min' });
    setShowAdd(false);
  };
  const toggleSession = (id) => setSessions((current) => current.map((session) => session.id === id ? { ...session, done: !session.done } : session));
  useEffect(() => localStorage.setItem('orbit-plan', JSON.stringify(sessions)), [sessions]);
  return <div className="page study-plan-page"><section className="welcome-row"><div><p className="eyebrow">YOUR WEEKLY ROUTINE</p><h1>Study plan</h1><p className="subhead">A flexible rhythm that turns your goals into the next clear session.</p></div><button className="primary-btn" onClick={() => setShowAdd(true)}><Plus size={17} /> Add session</button></section><section className="metric-grid"><Metric label="Weekly goal" value="6h 45m" detail="of 10 hours planned" icon={Target} /><Metric label="Sessions done" value={`${completedCount} / ${sessions.length}`} detail="Keep your momentum" icon={Check} warm /><Metric label="Next session" value={daySessions[0]?.time || '--:--'} detail={daySessions[0]?.title || 'Nothing planned'} icon={CalendarDays} /></section><section className="panel calendar-panel"><div className="panel-heading"><div><p className="eyebrow">SEPTEMBER / OCTOBER 2026</p><h2>Choose a day</h2></div><button className="text-btn" onClick={() => setSelectedDay(3)}>Today <ArrowUpRight size={15} /></button></div><div className="plan-calendar">{dates.map((date, index) => <button key={date} className={selectedDay === index ? 'plan-date selected' : 'plan-date'} onClick={() => setSelectedDay(index)}><span>{date}</span><strong>{calendarDates[index]}</strong><small>{sessions.filter((session) => session.day === index).length} {sessions.filter((session) => session.day === index).length === 1 ? 'session' : 'sessions'}</small></button>)}</div></section><section className="plan-layout"><section className="panel session-panel"><div className="panel-heading"><div><p className="eyebrow">{dates[selectedDay]} · {selectedDay < 3 ? 'SEPTEMBER' : 'OCTOBER'} {calendarDates[selectedDay]}</p><h2>{selectedDay === 3 ? "Today's sessions" : 'Planned sessions'}</h2></div><button className="icon-btn" title="Add a session" onClick={() => setShowAdd(true)}><Plus size={18} /></button></div>{daySessions.length ? <div className="session-list">{daySessions.sort((a, b) => a.time.localeCompare(b.time)).map((session) => <div className={`session-card ${session.done ? 'completed-session' : ''}`} key={session.id}><div className="session-time"><strong>{session.time}</strong><span>{session.duration}</span></div><div className={`lesson-art small-art ${session.color}-art`}><span>{session.icon}</span></div><div className="lesson-row-copy"><strong>{session.title}</strong><span>{session.subject}</span></div><button className="session-check" aria-label={session.done ? 'Mark incomplete' : 'Mark complete'} onClick={() => toggleSession(session.id)}>{session.done ? <Check size={15} /> : <span />}</button></div>)}</div> : <div className="empty-plan"><CalendarDays size={24} /><strong>No sessions planned</strong><span>Give this day a small, focused next step.</span><button className="secondary-btn" onClick={() => setShowAdd(true)}><Plus size={15} /> Add a session</button></div>}</section><section className="panel focus-plan-panel"><p className="eyebrow">PLAN HEALTH</p><h2>You're building a steady rhythm.</h2><p>Short sessions spaced across the week are easier to remember than one long cram session.</p><div className="plan-health"><div className="donut"><span>{Math.round((completedCount / Math.max(sessions.length, 1)) * 100)}<small>%</small></span></div><div><strong>{completedCount ? 'Momentum is growing' : 'Start your first session'}</strong><p>{completedCount} completed this week</p></div></div><div className="goal-bar"><span style={{ width: `${Math.max(8, (completedCount / Math.max(sessions.length, 1)) * 100)}%` }} /></div><div className="goal-label"><span>Plan completion</span><strong>{completedCount} / {sessions.length}</strong></div><button className="secondary-btn" onClick={() => setActive('Tutor chat')}>Ask Orbit to adjust <ArrowUpRight size={16} /></button></section></section>{showAdd && <div className="modal-backdrop"><form className="add-session-modal" onSubmit={addSession}><button type="button" className="modal-close icon-btn" onClick={() => setShowAdd(false)}><X size={18} /></button><p className="eyebrow">NEW SESSION</p><h2>Add to {dates[selectedDay]}</h2><label>Topic<input autoFocus value={newSession.title} onChange={(event) => setNewSession({ ...newSession, title: event.target.value })} placeholder="e.g. Newton's laws" /></label><div className="form-row"><label>Time<input type="time" value={newSession.time} onChange={(event) => setNewSession({ ...newSession, time: event.target.value })} /></label><label>Duration<select value={newSession.duration} onChange={(event) => setNewSession({ ...newSession, duration: event.target.value })}><option>20 min</option><option>25 min</option><option>35 min</option><option>45 min</option></select></label></div><label>Subject<input value={newSession.subject} onChange={(event) => setNewSession({ ...newSession, subject: event.target.value })} /></label><button className="primary-btn" type="submit"><Plus size={16} /> Save session</button></form></div>}</div>;
}
function GoalsPage({ setActive }) {
  const goals = [{ title: 'Reach 10 study hours', progress: 68, detail: '6h 45m of 10h' }, { title: 'Complete Biology review', progress: 72, detail: '3 of 4 lessons' }, { title: 'Keep a 14 day streak', progress: 50, detail: '7 of 14 days' }];
  return <div className="page workspace-page"><section className="welcome-row"><div><p className="eyebrow">YOUR DIRECTION</p><h1>Goals</h1><p className="subhead">Small targets that keep your study sessions purposeful.</p></div><button className="primary-btn" onClick={() => setActive('Study plan')}><CalendarDays size={17} /> Open study plan</button></section><section className="metric-grid"><Metric label="Goals in progress" value="3" detail="All moving forward" icon={Target} /><Metric label="This week's score" value="82%" detail="+8% from last week" icon={Flame} warm /><Metric label="Next milestone" value="10h" detail="3h 15m remaining" icon={Trophy} /></section><section className="panel workspace-list"><div className="panel-heading"><div><p className="eyebrow">ACTIVE GOALS</p><h2>Keep going, Ganiesghaa</h2></div><button className="secondary-btn compact" onClick={() => setActive('Tutor chat')}><MessageCircle size={15} /> Ask Orbit</button></div><div className="goal-list">{goals.map((goal) => <div className="goal-item" key={goal.title}><div className="goal-item-top"><strong>{goal.title}</strong><span>{goal.detail}</span></div><div className="goal-bar"><span style={{ width: `${goal.progress}%` }} /></div><small>{goal.progress}% complete</small></div>)}</div></section></div>;
}
function AchievementsPage() {
  const achievements = [{ icon: '✦', title: 'First step', detail: 'Completed your first study session', unlocked: true }, { icon: '◒', title: '7-day rhythm', detail: 'Studied for seven days in a row', unlocked: true }, { icon: '◎', title: 'Deep focus', detail: 'Complete ten focused sessions', unlocked: false }, { icon: '◇', title: 'Subject explorer', detail: 'Study three different subjects', unlocked: false }];
  return <div className="page workspace-page"><section className="welcome-row"><div><p className="eyebrow">MILESTONES</p><h1>Achievements</h1><p className="subhead">A record of the habits you are building, one session at a time.</p></div><div className="achievement-score"><strong>2</strong><span>of {achievements.length} unlocked</span></div></section><section className="panel achievement-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR COLLECTION</p><h2>Progress worth noticing</h2></div><Trophy size={22} className="muted" /></div><div className="achievement-grid">{achievements.map((achievement) => <div className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`} key={achievement.title}><div className="achievement-icon">{achievement.icon}</div><div><strong>{achievement.title}</strong><p>{achievement.detail}</p></div><span>{achievement.unlocked ? 'Unlocked' : 'In progress'}</span></div>)}</div></section></div>;
}
function SubjectsPage({ setActive }) {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem('orbit-subjects') || 'null') || lessons);
  const [showAdd, setShowAdd] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const addSubject = (event) => {
    event.preventDefault();
    if (!subjectName.trim()) return;
    const next = [...subjects, { title: subjectName.trim(), subject: 'New subject', duration: '25 min', color: 'mint', progress: 0, icon: '✦' }];
    setSubjects(next);
    localStorage.setItem('orbit-subjects', JSON.stringify(next));
    setSubjectName('');
    setShowAdd(false);
  };
  return <div className="page workspace-page"><section className="welcome-row"><div><p className="eyebrow">YOUR LEARNING SPACE</p><h1>My subjects</h1><p className="subhead">Track every subject and jump into the next useful lesson.</p></div><button className="primary-btn" onClick={() => setShowAdd(true)}><Plus size={17} /> Add subject</button></section><section className="metric-grid"><Metric label="Active subjects" value={subjects.length} detail="Personalized to your plan" icon={BookOpen} /><Metric label="Average progress" value={`${Math.round(subjects.reduce((sum, subject) => sum + subject.progress, 0) / Math.max(subjects.length, 1))}%`} detail="Across all subjects" icon={Target} /><Metric label="Next focus" value="Biology" detail="Cellular respiration" icon={Brain} warm /></section><section className="panel workspace-list"><div className="panel-heading"><div><p className="eyebrow">SUBJECT LIBRARY</p><h2>Keep learning</h2></div><button className="text-btn" onClick={() => setActive('Study plan')}>View study plan <ArrowUpRight size={15} /></button></div><div className="workspace-items">{subjects.map((subject) => <div className="workspace-item" key={subject.title}><div className={`lesson-art small-art ${subject.color}-art`}><span>{subject.icon}</span></div><div className="lesson-row-copy"><strong>{subject.title}</strong><span>{subject.subject} · {subject.duration}</span></div><div className="workspace-progress"><div className="tiny-progress"><i style={{ width: `${subject.progress}%` }} /></div><small>{subject.progress}%</small></div><button className="round-arrow" onClick={() => setActive('Tutor chat')} aria-label={`Ask tutor about ${subject.title}`}><ArrowUpRight size={17} /></button></div>)}</div></section>{showAdd && <div className="modal-backdrop"><form className="add-session-modal" onSubmit={addSubject}><button type="button" className="modal-close icon-btn" onClick={() => setShowAdd(false)}><X size={18} /></button><p className="eyebrow">NEW SUBJECT</p><h2>Add a subject</h2><label>Subject name<input autoFocus value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="e.g. Physics" /></label><button className="primary-btn" type="submit"><Plus size={16} /> Add subject</button></form></div>}</div>;
}
function HelpModal({ close }) { return <div className="modal-backdrop"><div className="add-session-modal help-modal"><button className="modal-close icon-btn" onClick={close}><X size={18} /></button><p className="eyebrow">ORBIT GUIDE</p><h2>How can Orbit help?</h2><p>Ask a question in Tutor chat. Orbit can explain concepts, create study plans, quiz you, and help you decide what to study next.</p><div className="help-points"><span><MessageCircle size={15} /> Ask anything</span><span><CalendarDays size={15} /> Plan sessions</span><span><Target size={15} /> Track goals</span></div><button className="primary-btn" onClick={close}>Got it</button></div></div>; }
function AccountModal({ signedIn, signIn, signOut, close }) {
  const [email, setEmail] = useState('');
  const submit = (event) => { event.preventDefault(); if (email.trim()) signIn(); };
  return <div className="modal-backdrop"><div className="add-session-modal account-modal"><button className="modal-close icon-btn" onClick={close}><X size={18} /></button>{signedIn ? <><div className="account-avatar">G</div><p className="eyebrow">ACCOUNT</p><h2>Ganiesghaa</h2><p className="account-muted">Your study plan and progress are saved on this device.</p><button className="secondary-btn account-action" onClick={signOut}><LogOut size={16} /> Log out</button></> : <><div className="account-avatar guest">?</div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to Orbit</h2><p className="account-muted">Save your study progress and continue across sessions.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="primary-btn account-action" type="submit"><LogIn size={16} /> Sign in</button></form></>}</div></div>;
}
function WorkspacePage({ active, setActive }) {
  const subjectPage = active === 'My subjects';
  const items = subjectPage ? lessons : [
    { title: 'Biology review', subject: 'Today · 25 min', duration: '09:30', color: 'mint', progress: 72, icon: '◒' },
    { title: 'Math practice', subject: 'Tomorrow · 35 min', duration: '16:00', color: 'coral', progress: 38, icon: '∿' },
    { title: 'History recall', subject: 'Friday · 20 min', duration: '18:30', color: 'gold', progress: 16, icon: '◈' }
  ];
  return <div className="page workspace-page"><section className="welcome-row"><div><p className="eyebrow">WORKSPACE</p><h1>{active}</h1><p className="subhead">{subjectPage ? 'Your subjects, progress, and next best study actions.' : 'A simple plan that keeps your next session visible.'}</p></div><button className="primary-btn" onClick={() => setActive('Tutor chat')}><MessageCircle size={17} /> Ask your tutor</button></section><section className="metric-grid"><Metric label={subjectPage ? 'Active subjects' : 'Planned this week'} value={subjectPage ? '3' : '8'} detail={subjectPage ? 'All on your current plan' : '2 sessions today'} icon={BookOpen} /><Metric label="Time invested" value="4.5h" detail="68% of weekly goal" icon={CalendarDays} /><Metric label="Current focus" value="Biology" detail="Cellular respiration" icon={Target} warm /></section><section className="panel workspace-list"><div className="panel-heading"><div><p className="eyebrow">{subjectPage ? 'YOUR SUBJECTS' : 'UPCOMING SESSIONS'}</p><h2>{subjectPage ? 'Keep building momentum' : 'Your study rhythm'}</h2></div><button className="secondary-btn compact"><Plus size={15} /> Add {subjectPage ? 'subject' : 'session'}</button></div><div className="workspace-items">{items.map((item) => <div className="workspace-item" key={item.title}><div className={`lesson-art small-art ${item.color}-art`}><span>{item.icon}</span></div><div className="lesson-row-copy"><strong>{item.title}</strong><span>{item.subject}{subjectPage ? ` · ${item.duration}` : ''}</span></div><div className="workspace-progress"><div className="tiny-progress"><i style={{ width: `${item.progress}%` }} /></div><small>{item.progress}%</small></div><button className="round-arrow" onClick={() => setActive('Tutor chat')}><ArrowUpRight size={17} /></button></div>)}</div></section><section className="bottom-grid"><section className="panel agent-panel"><div className="agent-icon"><Brain size={22} /></div><div><p className="eyebrow">ORBIT'S NEXT STEP</p><h2>Need help choosing what to study?</h2><p>Ask Orbit to prioritize your next session based on time, difficulty, and your goals.</p><button className="secondary-btn" onClick={() => setActive('Tutor chat')}>Ask for a recommendation <ArrowUpRight size={16} /></button></div></section><section className="panel quote-panel"><span className="quote-mark">✦</span><blockquote>One clear next action is better than a perfect plan.</blockquote><span className="quote-source">Orbit study principle</span></section></section></div>;
}
function ChatPage({ messages, input, setInput, sendMessage, isThinking, stopTutor, clearChat }) { return <div className="chat-page"><div className="chat-heading"><div><p className="eyebrow">YOUR PERSONAL STUDY PARTNER</p><h1>Ask anything.</h1><p className="subhead">Orbit remembers your goals and adapts to how you learn.</p></div><div className="agent-status"><span className="agent-orb"><Sparkles size={20} /></span><span><strong>Orbit AI</strong><small>{isThinking ? 'Thinking...' : 'Ready to help'}</small></span><button className="icon-btn" title="Clear conversation" aria-label="Clear conversation" onClick={clearChat}><Trash2 size={15} /></button><i /></div></div><div className="chat-window"><div className="suggestion-row"><button onClick={(e) => sendMessage(e, 'Create a focused study plan for today')}>Create a study plan <ArrowUpRight size={14} /></button><button onClick={(e) => sendMessage(e, 'Explain this topic simply')}>Explain a topic <ArrowUpRight size={14} /></button><button onClick={(e) => sendMessage(e, 'Give me a quick quiz')}>Test my knowledge <ArrowUpRight size={14} /></button></div><div className="messages">{messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.time}-${index}`}><div className="message-avatar">{message.role === 'agent' ? <Sparkles size={15} /> : 'AK'}</div><div><p>{message.text}</p><small>{message.time}</small></div></div>)}{isThinking && <div className="message agent"><div className="message-avatar"><Sparkles size={15} /></div><div className="typing"><i /><i /><i /></div></div>}</div><form className="chat-input" onSubmit={sendMessage}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Orbit anything about your studies..." /><button type="submit" className="send-btn" aria-label="Send message"><Send size={17} /></button>{isThinking && <button type="button" className="icon-btn" title="Stop generating" aria-label="Stop generating" onClick={stopTutor}><Square size={14} /></button>}</form></div></div>; }
function QuizModal({ quiz, state, index, score, chooseAnswer, close }) { return <div className="modal-backdrop"><div className="quiz-modal"><button className="modal-close icon-btn" onClick={close}><X size={18} /></button>{state === 'done' ? <div className="quiz-result"><div className="result-icon"><Trophy size={28} /></div><p className="eyebrow">QUIZ COMPLETE</p><h2>Nice work.</h2><strong>{score} / {quiz.length}</strong><p>Every question you attempt makes recall a little stronger.</p><button className="primary-btn" onClick={close}>Back to dashboard</button></div> : <><div className="quiz-top"><span>QUICK QUIZ</span><b>{index + 1} / {quiz.length}</b></div><div className="quiz-progress"><i style={{ width: `${((index + 1) / quiz.length) * 100}%` }} /></div><p className="eyebrow">CHECK YOUR UNDERSTANDING</p><h2>{quiz[index].question}</h2><div className="answers">{quiz[index].options.map((option, answer) => <button key={option} onClick={() => chooseAnswer(answer)}><span>{String.fromCharCode(65 + answer)}</span>{option}</button>)}</div></>}</div></div>; }

createRoot(document.getElementById('root')).render(<App />);
