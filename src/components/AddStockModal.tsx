import { useState, useRef, useEffect } from 'react'

interface AddStockModalProps {
  onAdd: (codes: string) => Promise<string[]>
  onClose: () => void
}

export function AddStockModal({ onAdd, onClose }: AddStockModalProps): JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [notFoundCodes, setNotFoundCodes] = useState<string[]>([])
  const [autoStartEnabled, setAutoStartEnabled] = useState(false) // TODO: 開機自動啟動 placeholder
  const inputRef = useRef<HTMLInputElement>(null)

  // Modal 開啟時自動 focus 輸入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ESC 關閉 Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAdd = async (): Promise<void> => {
    const trimmed = inputValue.trim()
    if (!trimmed || isAdding) return

    setIsAdding(true)
    setNotFoundCodes([])
    try {
      const notFound = await onAdd(trimmed)
      if (notFound.length > 0) {
        setNotFoundCodes(notFound)
        // Remove not-found codes from input; keep any that were valid
        const remaining = trimmed
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter((c) => notFound.includes(c))
          .join(', ')
        setInputValue(remaining)
      } else {
        setInputValue('')
        onClose()
      }
    } catch (err) {
      console.error('[AddStockModal] 新增失敗:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    // 背景遮罩：點擊外部關閉
    <div
      className="no-drag fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass w-72 rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/80">新增股票</h3>

        {/* 股票代碼輸入 */}
        <div className="mb-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setNotFoundCodes([]) }}
            onKeyDown={handleKeyDown}
            placeholder="台股或美股代碼，逗號分隔（如 2330, AAPL）"
            className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition-all duration-150 focus:bg-white/8 ${
              notFoundCodes.length > 0
                ? 'border-red-400/40 focus:border-red-400/60'
                : 'border-white/10 focus:border-white/20'
            }`}
            disabled={isAdding}
          />
          {notFoundCodes.length > 0 ? (
            <p className="mt-1 text-xs text-red-400/80">
              找不到代碼：{notFoundCodes.join('、')}
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/30">
              自動判斷台股上市／上櫃或美股
            </p>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-1.5 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white/70"
            disabled={isAdding}
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={!inputValue.trim() || isAdding}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-sm text-white/80 transition-all hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAdding ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white/80" />
                查詢中...
              </>
            ) : (
              '確認新增'
            )}
          </button>
        </div>

        {/* 分隔線 */}
        <div className="mb-3 border-t border-white/5" />

        {/* 開機自動啟動 Toggle（Placeholder） */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">開機自動啟動</p>
            <p className="text-[10px] text-white/25">功能開發中</p>
          </div>
          <button
            onClick={() => setAutoStartEnabled((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              autoStartEnabled ? 'bg-white/30' : 'bg-white/10'
            }`}
            title="開機自動啟動（TODO）"
            aria-label="開機自動啟動開關"
          >
            <span
              className={`absolute top-0.5 h-4 w-4 transform rounded-full bg-white/60 shadow transition-transform duration-200 ${
                autoStartEnabled ? 'left-4.5 translate-x-0' : 'left-0.5 translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
