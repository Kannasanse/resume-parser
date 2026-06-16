'use client';
import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import CurrentRoleNode from './nodes/CurrentRoleNode';
import TargetRoleNode from './nodes/TargetRoleNode';
import PathNode from './nodes/PathNode';
import LockedNode from './nodes/LockedNode';

const nodeTypes = {
  current: CurrentRoleNode,
  target: TargetRoleNode,
  path: PathNode,
  locked: LockedNode,
};

const EDGE_COLORS = {
  vertical: '#185FA5',
  horizontal: '#1D9E75',
  diagonal: '#F59E0B',
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

function layoutGraph(rawNodes, rawEdges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40 });

  rawNodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  rawEdges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return rawNodes.map(n => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } };
  });
}

export default function CareerGraph({ graphData, onNodeClick }) {
  const { nodes: rawNodes, edges: rawEdges } = graphData;

  const mappedNodes = useMemo(() => {
    const positioned = layoutGraph(
      rawNodes.map(n => ({
        ...n,
        type: n.data?.is_locked ? 'locked' : (n.type || 'path'),
      })),
      rawEdges
    );
    return positioned;
  }, [rawNodes, rawEdges]);

  const mappedEdges = useMemo(() => rawEdges.map(e => ({
    ...e,
    animated: e.type === 'vertical',
    style: { stroke: EDGE_COLORS[e.type] || '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: EDGE_COLORS[e.type] || '#94a3b8' },
    label: e.type,
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  })), [rawEdges]);

  const [nodes, , onNodesChange] = useNodesState(mappedNodes);
  const [edges, , onEdgesChange] = useEdgesState(mappedEdges);

  const handleNodeClick = useCallback((_, node) => {
    onNodeClick(node);
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <MiniMap nodeColor={n => n.type === 'target' ? '#185FA5' : n.type === 'current' ? '#1D9E75' : '#94a3b8'} />
        <Controls />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-16 left-4 bg-white border border-[var(--c-border)] rounded-lg p-3 shadow-sm space-y-1.5 text-xs">
        {[
          { color: '#185FA5', label: 'Vertical (promotion)' },
          { color: '#1D9E75', label: 'Horizontal (lateral)' },
          { color: '#F59E0B', label: 'Diagonal (pivot)' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[var(--c-text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
