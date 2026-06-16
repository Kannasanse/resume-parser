import { Handle, Position } from '@xyflow/react';

export default function TargetRoleNode({ data }) {
  return (
    <div className="bg-[var(--c-primary)] border-2 border-[var(--c-primary-dark)] rounded-xl px-4 py-3 min-w-[160px] max-w-[200px] cursor-pointer shadow-md">
      <Handle type="target" position={Position.Left} style={{ background: '#fff' }} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Target</span>
        {data.skill_match !== undefined && (
          <span className="text-xs text-white bg-white/20 px-1.5 py-0.5 rounded-full">{data.skill_match}% match</span>
        )}
      </div>
      <p className="text-sm font-semibold text-white leading-tight">{data.title}</p>
      <p className="text-xs text-blue-200 mt-0.5">{data.seniority}</p>
      <Handle type="source" position={Position.Right} style={{ background: '#fff' }} />
    </div>
  );
}
