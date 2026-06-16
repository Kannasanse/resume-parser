'use client'

import { useState } from 'react'

const ANNOTATE_TYPES = ['Highlight', 'Rectangle', 'Circle', 'Arrow']
const DRAW_TOOLS = ['Pen', 'Highlighter', 'Line', 'Arrow', 'Rect', 'Circle', 'Eraser']
const ALIGN_OPTIONS = ['left', 'center', 'right']

function IconBtn({ active, onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function Label({ children }) {
  return <span className="text-xs text-gray-400 whitespace-nowrap">{children}</span>
}

function Divider() {
  return <div className="w-px h-5 bg-gray-600 mx-1 self-center flex-shrink-0" />
}

function ColorInput({ value, onChange, title }) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      className="w-7 h-7 rounded cursor-pointer border border-gray-600 bg-gray-700 p-0.5 flex-shrink-0"
    />
  )
}

function OpacitySlider({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <Label>Opacity</Label>
      <input
        type="range"
        min={0.1}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 accent-blue-500"
      />
      <span className="text-xs text-gray-300 w-7">{Math.round(value * 100)}%</span>
    </div>
  )
}

// ── Text Mode ─────────────────────────────────────────────────────────────────
function TextControls({ textProps, setTextProps, selectedObject, onDeleteSelected }) {
  const set = (key, val) => setTextProps((p) => ({ ...p, [key]: val }))

  return (
    <>
      <Label>Size</Label>
      <input
        type="number"
        min={6}
        max={144}
        value={textProps.fontSize}
        onChange={(e) => set('fontSize', parseInt(e.target.value, 10) || 12)}
        className="w-14 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-sm text-white text-center"
      />

      <Divider />

      <IconBtn active={textProps.bold} onClick={() => set('bold', !textProps.bold)} title="Bold">
        <span className="font-bold">B</span>
      </IconBtn>
      <IconBtn active={textProps.italic} onClick={() => set('italic', !textProps.italic)} title="Italic">
        <span className="italic">I</span>
      </IconBtn>
      <IconBtn active={textProps.underline} onClick={() => set('underline', !textProps.underline)} title="Underline">
        <span className="underline">U</span>
      </IconBtn>

      <Divider />

      {ALIGN_OPTIONS.map((a) => (
        <IconBtn
          key={a}
          active={textProps.align === a}
          onClick={() => set('align', a)}
          title={`Align ${a}`}
        >
          {a === 'left' ? '≡' : a === 'center' ? '≡' : '≡'}
          <span className="sr-only">{a}</span>
          {a === 'left' && <span aria-hidden>&#8676;</span>}
          {a === 'center' && <span aria-hidden>&#8596;</span>}
          {a === 'right' && <span aria-hidden>&#8677;</span>}
        </IconBtn>
      ))}

      <Divider />

      <ColorInput value={textProps.color} onChange={(v) => set('color', v)} title="Text color" />

      <Divider />

      <OpacitySlider value={textProps.opacity} onChange={(v) => set('opacity', v)} />

      {selectedObject && (
        <>
          <Divider />
          <button
            onClick={onDeleteSelected}
            title="Delete selected"
            className="px-2 py-1 rounded text-sm bg-red-700 hover:bg-red-600 text-white transition-colors"
          >
            Delete
          </button>
        </>
      )}
    </>
  )
}

// ── Annotate Mode ─────────────────────────────────────────────────────────────
function AnnotateControls({ annotateProps, setAnnotateProps }) {
  const set = (key, val) => setAnnotateProps((p) => ({ ...p, [key]: val }))

  return (
    <>
      <Label>Type</Label>
      <div className="flex gap-1">
        {ANNOTATE_TYPES.map((t) => (
          <IconBtn
            key={t}
            active={annotateProps.type === t}
            onClick={() => set('type', t)}
            title={t}
          >
            {t}
          </IconBtn>
        ))}
      </div>

      <Divider />

      <ColorInput value={annotateProps.color} onChange={(v) => set('color', v)} title="Annotation color" />

      <Divider />

      <OpacitySlider value={annotateProps.opacity} onChange={(v) => set('opacity', v)} />
    </>
  )
}

// ── Draw Mode ─────────────────────────────────────────────────────────────────
function DrawControls({ drawProps, setDrawProps }) {
  const set = (key, val) => setDrawProps((p) => ({ ...p, [key]: val }))

  return (
    <>
      <Label>Tool</Label>
      <div className="flex gap-1 flex-wrap">
        {DRAW_TOOLS.map((t) => (
          <IconBtn
            key={t}
            active={drawProps.tool === t}
            onClick={() => set('tool', t)}
            title={t}
          >
            {t}
          </IconBtn>
        ))}
      </div>

      <Divider />

      <ColorInput value={drawProps.strokeColor} onChange={(v) => set('strokeColor', v)} title="Stroke color" />

      {drawProps.tool !== 'Eraser' && (
        <>
          <Divider />
          <Label>Fill</Label>
          <ColorInput value={drawProps.fillColor} onChange={(v) => set('fillColor', v)} title="Fill color" />
        </>
      )}

      <Divider />

      <Label>Width</Label>
      <input
        type="range"
        min={1}
        max={40}
        value={drawProps.strokeWidth}
        onChange={(e) => set('strokeWidth', parseInt(e.target.value, 10))}
        className="w-20 accent-blue-500"
      />
      <span className="text-xs text-gray-300 w-5">{drawProps.strokeWidth}</span>
    </>
  )
}

// ── Forms Mode ────────────────────────────────────────────────────────────────
function FormsControls({ formInfo }) {
  const count = formInfo?.fieldCount ?? 0

  return (
    <div className="flex items-center gap-2">
      {count > 0 ? (
        <>
          <span className="text-xs text-gray-400">Fields detected:</span>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
            {count}
          </span>
        </>
      ) : (
        <span className="text-xs text-gray-400 italic">No form fields detected on this page.</span>
      )}
    </div>
  )
}

// ── Signature Mode ────────────────────────────────────────────────────────────
function SignatureControls({ onNewSignature }) {
  return (
    <button
      onClick={onNewSignature}
      className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
    >
      + New Signature
    </button>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function ContextToolbar({
  mode,
  textProps,
  setTextProps,
  annotateProps,
  setAnnotateProps,
  drawProps,
  setDrawProps,
  formInfo,
  onNewSignature,
  selectedObject,
  onDeleteSelected,
}) {
  if (!mode) return null

  return (
    <div className="w-full bg-gray-800 border-t border-gray-700 px-3 py-1.5 flex items-center gap-2 flex-wrap min-h-[2.75rem] overflow-x-auto">
      {mode === 'text' && (
        <TextControls
          textProps={textProps}
          setTextProps={setTextProps}
          selectedObject={selectedObject}
          onDeleteSelected={onDeleteSelected}
        />
      )}
      {mode === 'annotate' && (
        <AnnotateControls
          annotateProps={annotateProps}
          setAnnotateProps={setAnnotateProps}
        />
      )}
      {mode === 'draw' && (
        <DrawControls
          drawProps={drawProps}
          setDrawProps={setDrawProps}
        />
      )}
      {mode === 'forms' && (
        <FormsControls formInfo={formInfo} />
      )}
      {mode === 'signature' && (
        <SignatureControls onNewSignature={onNewSignature} />
      )}
    </div>
  )
}
