import { Handle, Position } from '@xyflow/react';

export default function CurrentRoleNode({ data }) {
  return (
    <div className="bg-[var(--c-success-bg)] border-2 border-[var(--c-success)] rounded-xl px-4 py-3 min-w-[160px] max-w-[200px] cursor-pointer shadow-sm">
      <Handle type="target" position={Position.Left} style={{ background: '#1D9E75' }} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-[var(--c-success)] uppercase tracking-wide">Current</span>
      </div>
      <p className="text-sm font-semibold text-[var(--c-text)] leading-tight">{data.title}</p>
      <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{data.seniority}</p>
      <Handle type="source" position={Position.Right} style={{ background: '#1D9E75' }} />
    </div>
  );
}
