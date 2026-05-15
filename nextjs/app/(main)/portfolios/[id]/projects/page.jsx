'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';
import { listProjects, deleteProject } from '@/lib/portfolioApi';

const STATUS_STYLES = {
  completed:   'bg-ds-successLight text-ds-success',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  concept:     'bg-ds-bg text-ds-textMuted border border-ds-border',
};

const STATUS_LABELS = {
  completed:   'Completed',
  in_progress: 'In Progress',
  concept:     'Concept',
};

const VISIBILITY_STYLES = {
  public:    'bg-ds-successLight text-ds-success',
  private:   'bg-ds-dangerLight text-ds-danger',
  unlisted:  'bg-ds-bg text-ds-textMuted border border-ds-border',
};

function DeleteConfirm({ project, portfolioId, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteProject(portfolioId, project.id);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-heading font-bold text-ds-text">Delete Project?</h2>
        <p className="text-sm text-ds-textMuted">
          <span className="font-medium text-ds-text">{project.title}</span> will be permanently removed.
        </p>
        <div className="bg-ds-dangerLight rounded px-3 py-2">
          <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ds-textMuted border border-ds-border rounded hover:bg-ds-bg transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="bg-ds-danger text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ project, portfolioId, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const techStack = Array.isArray(project.tech_stack) ? project.tech_stack : [];
  const visibleTech = techStack.slice(0, 3);
  const extraCount = techStack.length - visibleTech.length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <>
      <tr className="border-b border-ds-border hover:bg-ds-bg/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium text-ds-text">{project.title}</p>
              {project.category && (
                <p className="text-xs text-ds-textMuted capitalize">{project.category}</p>
              )}
            </div>
            {project.featured && (
              <span className="text-amber-500" title="Featured">★</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[project.status] || STATUS_STYLES.concept}`}>
            {STATUS_LABELS[project.status] || project.status || '—'}
          </span>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${VISIBILITY_STYLES[project.visibility] || VISIBILITY_STYLES.public}`}>
            {project.visibility || 'public'}
          </span>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="flex flex-wrap gap-1">
            {visibleTech.map(t => (
              <span key={t} className="bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded text-xs text-ds-text">{t}</span>
            ))}
            {extraCount > 0 && (
              <span className="bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded text-xs text-ds-textMuted">+{extraCount}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-xs text-ds-textMuted">{fmtDate(project.updated_at)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 justify-end">
            <Link
              href={`/portfolios/${portfolioId}/projects/${project.id}/edit`}
              className="text-sm text-primary hover:underline font-medium"
            >
              Edit
            </Link>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-ds-danger hover:underline font-medium"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {confirmDelete && (
        <DeleteConfirm
          project={project}
          portfolioId={portfolioId}
          onClose={() => setConfirmDelete(false)}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

export default function ProjectsPage() {
  const { id } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listProjects(id);
      setProjects(res.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/portfolios/${id}/edit`} className="text-ds-textMuted hover:text-ds-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <h1 className="font-heading font-bold text-xl text-ds-text">Projects</h1>
        </div>
        <Link
          href={`/portfolios/${id}/projects/new/edit`}
          className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Project
        </Link>
      </div>

      {loading ? (
        <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Sk className="h-5 w-40" />
                <Sk className="h-5 w-20" />
                <Sk className="h-5 w-16" />
                <Sk className="h-5 w-24 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-textMuted">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-ds-text">No projects yet</p>
            <p className="text-sm text-ds-textMuted mt-1">Add your first project to showcase your work.</p>
          </div>
          <Link
            href={`/portfolios/${id}/projects/new/edit`}
            className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add Project
          </Link>
        </div>
      ) : (
        <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ds-bg border-b border-ds-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden md:table-cell">Visibility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden lg:table-cell">Tech</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden lg:table-cell">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <ProjectRow key={p.id} project={p} portfolioId={id} onRefresh={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
