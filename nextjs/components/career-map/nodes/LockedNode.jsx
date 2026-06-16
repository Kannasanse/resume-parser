import { Handle, Position } from '@xyflow/react';

export default function LockedNode({ data }) {
  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3 min-w-[150px] max-w-[200px] cursor-pointer opacity-60">
      <Handle type="target" position={Position.Left} style={{ background: '#d1d5db' }} />
      <div className="flex items-center gap-1.5 mb-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span className="text-xs text-gray-400 font-medium">Skill gap</span>
      </div>
      <p className="text-sm font-medium text-gray-400 leading-tight">{data.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{data.seniority}</p>
      <Handle type="source" position={Position.Right} style={{ background: '#d1d5db' }} />
    </div>
  );
}
