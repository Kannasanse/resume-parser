'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SkillsTable from './components/SkillsTable';
import AddSkillDrawer from './components/AddSkillDrawer';
import PendingSubmissionsTab from './components/PendingSubmissionsTab';
import ImportSkillsModal from './components/ImportSkillsModal';

export default function AdminSkillsPage() {
  const [activeTab, setActiveTab] = useState('skills');

  // Skills list state
  const [skills, setSkills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pending submissions count
  const [pendingCount, setPendingCount] = useState(0);

  // Categories
  const [categories, setCategories] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 50;

  // Sorting
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState('asc');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  // Import modal
  const [importOpen, setImportOpen] = useState(false);

  // Stats
  const [activeCount, setActiveCount] = useState(0);

  const searchTimeout = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchSkills = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit, sort, dir });
      if (search) params.set('q', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterSource) params.set('source', filterSource);

      const r = await fetch(`/api/v1/admin/skills?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSkills(d.skills || []);
      setTotal(d.total || 0);
      setActiveCount(d.active_count ?? d.skills?.filter(s => s.is_active).length ?? 0);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, dir, search, filterCategory, filterStatus, filterSource]);

  const fetchCategories = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/skills/categories');
      const d = await r.json();
      setCategories(d.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/admin/skills/submissions?status=pending');
      const d = await r.json();
      setPendingCount(d.total ?? d.submissions?.length ?? 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchSkills(page);
  }, [page, sort, dir, filterCategory, filterStatus, filterSource]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchSkills(1);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchCategories();
    fetchPendingCount();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (sort === col) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setDir('asc'); }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleOpenAdd = () => {
    setEditingSkill(null);
    setDrawerOpen(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setDrawerOpen(true);
  };

  const handleToggleActive = async (skill) => {
    const next = !skill.is_active;
    try {
      const r = await fetch(`/api/v1/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!r.ok) throw new Error();
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_active: next } : s));
      setActiveCount(c => next ? c + 1 : c - 1);
    } catch {
      // silently fail — could add toast
    }
  };

  const handleDelete = async (skill) => {
    if (!window.confirm(`Delete "${skill.name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/v1/admin/skills/${skill.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setSkills(prev => prev.filter(s => s.id !== skill.id));
      setTotal(t => t - 1);
      if (skill.is_active) setActiveCount(c => c - 1);
    } catch {
      alert('Failed to delete skill. Please try again.');
    }
  };

  const handleSaved = (savedSkill) => {
    setSkills(prev => {
      const exists = prev.find(s => s.id === savedSkill.id);
      if (exists) return prev.map(s => s.id === savedSkill.id ? savedSkill : s);
      setTotal(t => t + 1);
      if (savedSkill.is_active) setActiveCount(c => c + 1);
      return [savedSkill, ...prev];
    });
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gradient-primary">Skill Library</h1>
          <p className="text-sm text-[var(--ds-textMuted)] mt-0.5">
            Manage the global skills taxonomy
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-[var(--c-border)] text-[var(--c-text-muted)] font-medium">
              {loading ? '…' : total} total
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-[var(--c-border)] text-[var(--c-text-muted)] font-medium">
              {loading ? '…' : activeCount} active
            </span>
            {pendingCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 font-medium">
                {pendingCount} pending review
              </span>
            )}
          </div>
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 text-sm font-semibold border border-[var(--c-border)] dark:border-white/15 rounded-xl text-[var(--c-text)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-[var(--c-primary)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add Skill
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--c-border)]">
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'skills'
              ? 'border-[var(--c-primary)] text-[var(--c-primary)]'
              : 'border-transparent text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
          }`}
        >
          Skills Library
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-[var(--c-primary)] text-[var(--c-primary)]'
              : 'border-transparent text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold min-w-[1.2rem] text-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Skills tab content */}
      {activeTab === 'skills' && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-52">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search skills…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0D1830] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
              />
            </div>
            <select
              value={filterCategory}
              onChange={handleFilterChange(setFilterCategory)}
              className="px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0D1830] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id ?? c.slug ?? c} value={c.slug ?? c.id ?? c}>
                  {c.name ?? c}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={handleFilterChange(setFilterStatus)}
              className="px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0D1830] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filterSource}
              onChange={handleFilterChange(setFilterSource)}
              className="px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0D1830] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
            >
              <option value="">All sources</option>
              <option value="manual">Manual</option>
              <option value="esco">ESCO</option>
              <option value="user_submitted">User Submitted</option>
              <option value="import">Import</option>
            </select>
          </div>

          {/* Table */}
          <SkillsTable
            skills={skills}
            loading={loading}
            total={total}
            page={page}
            limit={limit}
            sort={sort}
            dir={dir}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* Pending tab content */}
      {activeTab === 'pending' && (
        <PendingSubmissionsTab
          onCountChange={(n) => setPendingCount(n)}
        />
      )}

      {/* Import modal */}
      <ImportSkillsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setPage(1); fetchSkills(1); }}
      />

      {/* Add / Edit Drawer */}
      <AddSkillDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        skill={editingSkill}
        categories={categories}
        onSaved={handleSaved}
      />
    </div>
  );
}
