'use client'

import { useState, useRef, useEffect } from 'react'

const MIN_ZOOM = 25
const MAX_ZOOM = 300

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onFitWidth, onFitPage, onSetZoom }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleDisplayClick = () => {
    setInputValue(String(Math.round(zoom)))
    setEditing(true)
  }

  const commitInput = () => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsed))
      onSetZoom?.(clamped)
    }
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitInput()
    else if (e.key === 'Escape') setEditing(false)
  }

  const canZoomIn = zoom < MAX_ZOOM
  const canZoomOut = zoom > MIN_ZOOM

  return (
    <div className="flex items-center gap-1">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
        className="flex items-center justify-center w-7 h-7 rounded text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base font-medium select-none"
      >
        −
      </button>

      {/* Zoom % display / input */}
      <div className="relative">
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleKeyDown}
            className="w-16 h-7 px-1 text-center text-xs font-medium bg-gray-800 border border-blue-500 rounded text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            onClick={handleDisplayClick}
            title="Click to set zoom level"
            className="w-16 h-7 px-1 text-center text-xs font-medium bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 rounded text-gray-200 hover:text-white transition-colors cursor-text"
          >
            {Math.round(zoom)}%
          </button>
        )}
      </div>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
        className="flex items-center justify-center w-7 h-7 rounded text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base font-medium select-none"
      >
        +
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-600 mx-0.5" />

      {/* Fit Width */}
      <button
        onClick={onFitWidth}
        title="Fit to width"
        className="px-2 h-7 text-xs font-medium rounded text-gray-300 hover:bg-gray-600 hover:text-white transition-colors whitespace-nowrap"
      >
        Fit Width
      </button>

      {/* Fit Page */}
      <button
        onClick={onFitPage}
        title="Fit whole page"
        className="px-2 h-7 text-xs font-medium rounded text-gray-300 hover:bg-gray-600 hover:text-white transition-colors whitespace-nowrap"
      >
        Fit Page
      </button>
    </div>
  )
}
