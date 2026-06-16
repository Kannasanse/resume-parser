'use client'

import { useEffect, useRef } from 'react'

export default function PDFRenderer({ pdfBytes, currentPage, zoom, onDimensionsChange, canvasRef }) {
  const renderTaskRef = useRef(null)
  const pdfDocRef = useRef(null)

  useEffect(() => {
    if (!pdfBytes) return

    let cancelled = false

    async function renderPage() {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      // Cancel any in-progress render
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel()
        } catch (_) {}
        renderTaskRef.current = null
      }

      // Load or reuse the PDF document
      // Always reload when pdfBytes changes
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
        const pdfDoc = await loadingTask.promise
        if (cancelled) {
          pdfDoc.destroy()
          return
        }
        pdfDocRef.current = pdfDoc
      } catch (err) {
        if (!cancelled) console.error('PDFRenderer: failed to load document', err)
        return
      }

      const pdfDoc = pdfDocRef.current
      if (!pdfDoc) return

      const pageNumber = (currentPage ?? 0) + 1 // pdfjs is 1-indexed
      const clampedPage = Math.max(1, Math.min(pageNumber, pdfDoc.numPages))

      let page
      try {
        page = await pdfDoc.getPage(clampedPage)
      } catch (err) {
        if (!cancelled) console.error('PDFRenderer: failed to get page', err)
        return
      }

      if (cancelled) return

      const scale = zoom ?? 1.0
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef?.current
      if (!canvas) return

      const context = canvas.getContext('2d')

      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)

      if (onDimensionsChange) {
        onDimensionsChange({ width: canvas.width, height: canvas.height })
      }

      const renderContext = {
        canvasContext: context,
        viewport,
      }

      try {
        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask
        await renderTask.promise
        renderTaskRef.current = null
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('PDFRenderer: render error', err)
        }
      }
    }

    renderPage()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [pdfBytes, currentPage, zoom])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
    />
  )
}
