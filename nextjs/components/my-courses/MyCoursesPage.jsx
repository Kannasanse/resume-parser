'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CourseCard from './CourseCard';
import CourseStatsBar from './CourseStatsBar';
import EmptyState from './EmptyState';
import CourseCreationModal from './CourseCreationModal';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
];

const SORT_OPTIONS = [
  { value: 'updated', label: 'Last updated' },
  { value: 'most_progress', label: 'Most progress' },
  { value: 'least_progress', label: 'Least progress' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

function filterCourses(courses, tab) {
  if (tab === 'all') return courses;
  if (tab === 'in_progress') return courses.filter(c => c.status === 'active' && c.overallPercent > 0);
  if (tab === 'not_started') return courses.filter(c => c.status === 'active' && c.overallPercent === 0);
  if (tab === 'completed') return courses.filter(c => c.status === 'completed');
  if (tab === 'paused') return courses.filter(c => c.status === 'paused');
  return courses;
}

function sortCourses(courses, sort) {
  const arr = [...courses];
  if (sort === 'updated') return arr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (sort === 'most_progress') return arr.sort((a, b) => b.overallPercent - a.overallPercent);
  if (sort === 'least_progress') return arr.sort((a, b) => a.overallPercent - b.overallPercent);
  if (sort === 'newest') return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === 'oldest') return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return arr;
}

export default function MyCoursesPage() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [sort, setSort] = useState('updated');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(() => searchParams?.get('create') === '1');

  async function load() {
    setLoading(true);
    try {
      const [coursesRes, statsRes] = await Promise.all([
        fetch('/api/v1/my-courses'),
        fetch('/api/v1/my-courses/stats'),
      ]);
      const coursesData = await coursesRes.json();
      const statsData = await statsRes.json();
      setCourses(coursesData.courses || []);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    await fetch(`/api/v1/my-courses/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleDelete(id) {
    setCourses(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/v1/my-courses/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleResetProgress(id) {
    // Re-fetch after reset (reset is handled in CourseCardMenu via separate API calls)
    load();
  }

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(t => { counts[t.id] = filterCourses(courses, t.id).length; });
    return counts;
  }, [courses]);

  const filtered = useMemo(() => {
    let list = filterCourses(courses, activeTab);
    if (search) list = list.filter(c => c.targetRoleTitle.toLowerCase().includes(search.toLowerCase()));
    return sortCourses(list, sort);
  }, [courses, activeTab, sort, search]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="ds-skel h-8 w-40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="ds-skel h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--c-text)]">My Courses</h2>
          <p className="text-sm text-[var(--c-text-muted)] mt-1">Track your learning progress and pick up where you left off.</p>
        </div>
        <button
          onClick={() => setCourseModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Course
        </button>
      </div>

      {/* Stats bar */}
      {stats && <div className="stagger-children"><CourseStatsBar stats={stats} /></div>}

      {/* Filter tabs + sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="glass-light rounded-2xl p-1 shadow-sm inline-flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-xl ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#111F35] shadow-sm text-[var(--c-primary)] font-semibold'
                  : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
              }`}
            >
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full">
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center border border-[var(--c-border)] rounded-lg overflow-hidden">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="px-3 py-1.5 text-sm outline-none w-44 bg-transparent text-[var(--c-text)]"
              />
              <button onClick={() => { setSearch(''); setSearchOpen(false); }} className="px-2 text-[var(--c-text-muted)]">✕</button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-primary)] border border-[var(--c-border)] rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          )}

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-[var(--c-border)] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[var(--c-primary-light)] bg-[var(--c-surface)] text-[var(--c-text)]"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} hasAnyCourses={courses.length > 0} onNewCourse={() => setCourseModalOpen(true)} />
      ) : (
        <div className="stagger-children grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onResetProgress={handleResetProgress}
            />
          ))}
        </div>
      )}

      <CourseCreationModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onCreated={() => { setCourseModalOpen(false); load(); }}
      />
    </div>
  );
}
