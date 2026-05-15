'use client';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const C = { primary: '#185FA5', border: '#D1DCE8', bg: '#F4F8FC', secondary: '#6B7280', error: '#D93025' };

function DragHandle({ listeners, attributes }) {
  return (
    <button {...listeners} {...attributes} aria-label="Drag to reorder"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0, background: 'none', border: 'none', cursor: 'grab', color: C.secondary, padding: 0, touchAction: 'none' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="6" x2="8" y2="6" strokeWidth="3"/><line x1="16" y1="6" x2="16" y2="6" strokeWidth="3"/>
        <line x1="8" y1="12" x2="8" y2="12" strokeWidth="3"/><line x1="16" y1="12" x2="16" y2="12" strokeWidth="3"/>
        <line x1="8" y1="18" x2="8" y2="18" strokeWidth="3"/><line x1="16" y1="18" x2="16" y2="18" strokeWidth="3"/>
      </svg>
    </button>
  );
}

// A single plain-text sortable row (for trust items, feature bullets, etc.)
function TextRow({ id, value, onChange, onRemove, canRemove, placeholder = 'Enter text…' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', opacity: isDragging ? 0.7 : 1, transform: CSS.Transform.toString(transform), transition }}>
      <DragHandle listeners={listeners} attributes={attributes} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#2C2C2A', outline: 'none', minWidth: 0 }} />
      <button onClick={onRemove} disabled={!canRemove} aria-label="Remove item"
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: canRemove ? 'pointer' : 'not-allowed', color: canRemove ? C.secondary : C.border, padding: 0, flexShrink: 0, transition: 'color 150ms' }}
        onMouseEnter={e => { if (canRemove) e.currentTarget.style.color = C.error; }}
        onMouseLeave={e => { e.currentTarget.style.color = canRemove ? C.secondary : C.border; }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/**
 * RepeatableList — drag-and-drop sortable list of plain text strings.
 *
 * Props:
 *   items      : string[]
 *   onChange   : (items: string[]) => void
 *   min        : number  (default 1)
 *   max        : number  (default 10)
 *   addLabel   : string  (default "+ Add item")
 *   placeholder: string
 */
export function RepeatableTextList({ items = [], onChange, min = 1, max = 10, addLabel = '+ Add item', placeholder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Ensure each item has a stable id for dnd
  const [ids] = useState(() => items.map((_, i) => `item-${i}-${Math.random()}`));
  const [localIds, setLocalIds] = useState(ids);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = localIds.indexOf(active.id);
    const newIdx = localIds.indexOf(over.id);
    const newIds   = arrayMove(localIds, oldIdx, newIdx);
    const newItems = arrayMove(items, oldIdx, newIdx);
    setLocalIds(newIds);
    onChange(newItems);
  };

  const add = () => {
    if (items.length >= max) return;
    const newId = `item-${Date.now()}-${Math.random()}`;
    setLocalIds(prev => [...prev, newId]);
    onChange([...items, '']);
  };

  const remove = (idx) => {
    const newIds = localIds.filter((_, i) => i !== idx);
    setLocalIds(newIds);
    onChange(items.filter((_, i) => i !== idx));
  };

  const update = (idx, val) => {
    const updated = [...items]; updated[idx] = val; onChange(updated);
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localIds} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {localIds.map((id, i) => (
              <TextRow key={id} id={id} value={items[i] ?? ''} placeholder={placeholder}
                onChange={v => update(i, v)}
                onRemove={() => remove(i)}
                canRemove={items.length > min} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length < max && (
        <button onClick={add} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {addLabel}
        </button>
      )}
      {items.length >= max && (
        <p style={{ marginTop: 6, fontSize: 12, color: C.secondary }}>Maximum {max} items reached.</p>
      )}
    </div>
  );
}

// ── Sortable card wrapper for complex item lists (features, steps, etc.) ──────
function SortableCard({ id, children, onRemove, canRemove, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, boxShadow: isDragging ? '0 4px 16px rgba(12,68,124,0.12)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DragHandle listeners={listeners} attributes={attributes} />
          {label && <span style={{ fontSize: 12, fontWeight: 600, color: C.secondary }}>{label}</span>}
        </div>
        <button onClick={onRemove} disabled={!canRemove} aria-label={`Remove ${label || 'item'}`}
          style={{ background: 'none', border: 'none', cursor: canRemove ? 'pointer' : 'not-allowed', color: canRemove ? C.secondary : C.border, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, transition: 'color 150ms, background 150ms' }}
          onMouseEnter={e => { if (canRemove) { e.currentTarget.style.color = C.error; e.currentTarget.style.background = '#FEE2E2'; }}}
          onMouseLeave={e => { e.currentTarget.style.color = canRemove ? C.secondary : C.border; e.currentTarget.style.background = 'transparent'; }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * RepeatableCardList — sortable list of complex items rendered via renderItem.
 *
 * Props:
 *   items       : object[]  (each must have a stable .id)
 *   onChange    : (items) => void
 *   renderItem  : (item, idx, onChange) => ReactNode  — render fields for one item
 *   onAdd       : () => object  — returns a new blank item with a .id
 *   min         : number
 *   max         : number
 *   addLabel    : string
 *   itemLabel   : (item, idx) => string
 */
export function RepeatableCardList({ items = [], onChange, renderItem, onAdd, min = 1, max = 9, addLabel = '+ Add item', itemLabel }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    onChange(arrayMove(items, oldIdx, newIdx));
  };

  const add = () => {
    if (items.length >= max) return;
    onChange([...items, onAdd()]);
  };

  const remove = (id) => onChange(items.filter(i => i.id !== id));

  const update = (id, patch) => onChange(items.map(i => i.id === id ? { ...i, ...patch } : i));

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <SortableCard key={item.id} id={item.id}
                label={itemLabel ? itemLabel(item, idx) : `Item ${idx + 1}`}
                onRemove={() => remove(item.id)}
                canRemove={items.length > min}>
                {renderItem(item, idx, (patch) => update(item.id, patch))}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length < max ? (
        <button onClick={add} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {addLabel}
        </button>
      ) : (
        <p style={{ marginTop: 8, fontSize: 12, color: C.secondary }}>Maximum {max} items reached.</p>
      )}
    </div>
  );
}
