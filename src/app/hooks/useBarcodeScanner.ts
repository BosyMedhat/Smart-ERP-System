import { useEffect, useRef, useCallback, useState } from 'react'

interface UseBarcodeOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
}

export function useBarcodeScanner({ onScan, enabled = true, minLength = 3 }: UseBarcodeOptions) {
  const buffer = useRef('')
  const lastKeyTime = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    
    // Ignore if user is typing in an input field (except barcode input)
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' && !target.dataset.barcodeInput) return
    if (target.tagName === 'TEXTAREA') return

    const now = Date.now()
    const timeDiff = now - lastKeyTime.current
    lastKeyTime.current = now

    // Clear timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (e.key === 'Enter') {
      if (buffer.current.length >= minLength) {
        setIsScanning(true)
        onScan(buffer.current)
        // Reset scanning state after a short delay
        setTimeout(() => setIsScanning(false), 500)
      }
      buffer.current = ''
      return
    }

    // If too slow between keys → human typing, reset
    if (timeDiff > 100 && buffer.current.length > 0) {
      buffer.current = ''
    }

    // Accumulate barcode characters
    if (e.key.length === 1) {
      buffer.current += e.key
    }

    // Auto-clear after 500ms
    timeoutRef.current = setTimeout(() => {
      buffer.current = ''
    }, 500)
  }, [onScan, enabled, minLength])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [handleKeyDown])

  return { isScanning }
}
