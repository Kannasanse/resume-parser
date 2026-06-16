'use client'

import { useState, useRef, useEffect } from 'react'

export default function PageNavigation({ currentPage, pageCount, onPrev, onNext, onGoTo }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  const displayPage = currentPage + 1

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function handlePageClick() {
    setInputValue(String(displayPage))
    setEditing(true)
  }

  function commitInput() {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      onGoTo(parsed - 1)
    }
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      commitInput()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  if (!pageCount || pageCount <= 0) return null

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-zinc-900 border-t border-zinc-700 select-none">
      <button
        onClick={onPrev}
        disabled={currentPage <= 0}
        className="flex items-center justify-center w-8 h-8 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-1.5 text-sm text-zinc-300">
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={pageCount}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleKeyDown}
            className="w-12 text-center bg-zinc-700 text-zinc-100 border border-zinc-500 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            onClick={handlePageClick}
            className="w-12 text-center bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded px-1 py-0.5 transition-colors cursor-text"
            title="Click to jump to a page"
          >
            {displayPage}
          </button>
        )}
        <span className="text-zinc-400">of</span>
        <span className="text-zinc-200 font-medium">{pageCount}</span>
      </div>

      <button
        onClick={onNext}
        disabled={currentPage >= pageCount - 1}
        className="flex items-center justify-center w-8 h-8 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
