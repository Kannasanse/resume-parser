import { Handle, Position } from '@xyflow/react';

export default function PathNode({ data }) {
  return (
    <div className="bg-white border border-[var(--c-border)] rounded-xl px-4 py-3 min-w-[150px] max-w-[200px] cursor-pointer shadow-sm hover:border-[var(--c-primary)] transition-colors">
      <Handle type="target" position={Position.Left} style={{ background: '#94a3b8' }} />
      <p className="text-sm font-semibold text-[var(--c-text)] leading-tight">{data.title}</p>
      <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{data.seniority} · {data.category}</p>
      {data.skill_match !== undefined && (
        <div className="mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--c-primary)] rounded-full" style={{ width: `${data.skill_match}%` }} />
          </div>
          <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{data.skill_match}% skill match</p>
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#94a3b8' }} />
    </div>
  );
}
