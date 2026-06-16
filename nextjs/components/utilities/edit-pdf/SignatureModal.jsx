'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Pacifico', family: "'Pacifico', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
]

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap'

function injectGoogleFonts() {
  if (document.getElementById('signature-modal-fonts')) return
  const link = document.createElement('link')
  link.id = 'signature-modal-fonts'
  link.rel = 'stylesheet'
  link.href = GOOGLE_FONTS_URL
  document.head.appendChild(link)
}

// ─── Draw Tab ────────────────────────────────────────────────────────────────

function DrawTab({ canvasRef }) {
  const isDrawing = useRef(false)
  const lastPos = useRef(null)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      const t = e.touches[0]
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const initCanvas = useCallback((canvas) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, canvas.height - 30)
    ctx.lineTo(canvas.width - 20, canvas.height - 30)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Sign here', canvas.width / 2, canvas.height - 10)
  }, [])

  useEffect(() => {
    if (canvasRef.current) initCanvas(canvasRef.current)
  }, [canvasRef, initCanvas])

  const startDraw = (e) => {
    e.preventDefault()
    isDrawing.current = true
    const canvas = canvasRef.current
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = (e) => {
    e.preventDefault()
    isDrawing.current = false
    lastPos.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    initCanvas(canvas)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="border border-gray-300 rounded cursor-crosshair w-full max-w-[400px] touch-none"
        style={{ background: '#fff' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        type="button"
        onClick={clear}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
      >
        Clear
      </button>
    </div>
  )
}

// ─── Type Tab ────────────────────────────────────────────────────────────────

function TypeTab({ canvasRef }) {
  const [name, setName] = useState('')
  const [font, setFont] = useState(SIGNATURE_FONTS[0])
  const [color, setColor] = useState('#000000')

  useEffect(() => {
    injectGoogleFonts()
  }, [])

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (!name.trim()) {
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(20, canvas.height - 30)
      ctx.lineTo(canvas.width - 20, canvas.height - 30)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#9ca3af'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Type your name above', canvas.width / 2, canvas.height / 2)
      return
    }
    const fontSize = Math.min(64, Math.max(28, (canvas.width * 0.7) / (name.length * 0.5)))
    ctx.font = `${fontSize}px ${font.family}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, canvas.width / 2, canvas.height / 2)
  }, [name, font, color, canvasRef])

  useEffect(() => {
    // Wait a tick so Google Fonts can load before rendering
    const id = setTimeout(renderPreview, 100)
    return () => clearTimeout(id)
  }, [renderPreview])

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <div className="flex flex-wrap gap-2">
        {SIGNATURE_FONTS.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setFont(f)}
            style={{ fontFamily: f.family }}
            className={`px-3 py-1 border rounded text-sm transition-colors ${
              font.name === f.name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        />
        <span className="text-sm text-gray-500">{color}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="border border-gray-300 rounded w-full max-w-[400px]"
        style={{ background: '#fff' }}
      />
    </div>
  )
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab({ canvasRef, uploadedUrl, setUploadedUrl }) {
  const [error, setError] = useState('')

  const handleFile = (e) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Only PNG or JPG files are supported.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setUploadedUrl(dataUrl)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (canvas.width - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(img, x, y, w, h)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload PNG or JPG (max 2 MB)</span>
        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFile} />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {uploadedUrl && (
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="border border-gray-300 rounded w-full max-w-[400px]"
          style={{ background: '#fff' }}
        />
      )}
      {!uploadedUrl && (
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="hidden"
        />
      )}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TABS = ['Draw', 'Type', 'Upload']

export default function SignatureModal({ open, onClose, onConfirm }) {
  const [activeTab, setActiveTab] = useState('Draw')
  const drawCanvasRef = useRef(null)
  const typeCanvasRef = useRef(null)
  const uploadCanvasRef = useRef(null)
  const [uploadedUrl, setUploadedUrl] = useState(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab('Draw')
      setUploadedUrl(null)
    }
  }, [open])

  const getActiveCanvas = () => {
    if (activeTab === 'Draw') return drawCanvasRef.current
    if (activeTab === 'Type') return typeCanvasRef.current
    if (activeTab === 'Upload') return uploadCanvasRef.current
    return null
  }

  const handleConfirm = () => {
    const canvas = getActiveCanvas()
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onConfirm(dataUrl)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Add Signature</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          <div className={activeTab === 'Draw' ? 'block' : 'hidden'}>
            <DrawTab canvasRef={drawCanvasRef} />
          </div>
          <div className={activeTab === 'Type' ? 'block' : 'hidden'}>
            <TypeTab canvasRef={typeCanvasRef} />
          </div>
          <div className={activeTab === 'Upload' ? 'block' : 'hidden'}>
            <UploadTab
              canvasRef={uploadCanvasRef}
              uploadedUrl={uploadedUrl}
              setUploadedUrl={setUploadedUrl}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
