import { useState, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { StockList } from './components/StockList'
import { AddStockModal } from './components/AddStockModal'
import { CompactStockRow } from './components/StockItem'
import { useStockData } from './hooks/useStockData'

/** 格式化時間為 HH:mm:ss */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-TW', { hour12: false })
}

export default function App(): JSX.Element {
  const [activeGroup, setActiveGroup] = useState(1)
  const { stocks, priceHistory, isLoading, isError, errorMessage, lastUpdated, addStock, removeStock, reorderStocks } = useStockData(activeGroup)
  const [showModal, setShowModal] = useState(false)
  const [titleBarVisible, setTitleBarVisible] = useState(true)
  const [grayMode, setGrayMode] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [isPinned, setIsPinned] = useState(true)

  // 極簡模式：依股票代碼長度與數量動態調整視窗大小
  const symbolsKey = stocks.map((s) => s.code).join(',')
  useEffect(() => {
    if (compactMode) {
      // font-mono text-xs ≈ 7.5px/char；px-3×2=24px；gap-3=12px；8px buffer
      const CHAR_W = 7.5
      const maxCodeChars = stocks.length > 0 ? Math.max(...stocks.map((s) => s.code.length)) : 4
      const maxPriceChars = 8 // "1,234.56" 最多 8 字元
      const w = Math.ceil(maxCodeChars * CHAR_W + 12 + maxPriceChars * CHAR_W + 24 + 8)
      const h = Math.max(72, stocks.length * 26 + 22)
      window.api.setWindowSize(w, h)
    } else {
      window.api.setWindowSize(380, 520)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compactMode, symbolsKey])

  const toggleCompact = (): void => setCompactMode((v) => !v)

  const togglePin = (): void => {
    const next = !isPinned
    setIsPinned(next)
    window.api.setAlwaysOnTop(next)
  }

  // ── 極簡模式 layout ──────────────────────────────────────────────────────────
  if (compactMode) {
    return (
      <div className="glass flex h-screen flex-col rounded-2xl overflow-hidden select-none">
        {/* 極簡股票列 */}
        <div className="drag-region flex flex-1 flex-col overflow-hidden pt-1">
          {stocks.map((stock) => (
            <CompactStockRow key={stock.code} stock={stock} grayMode={grayMode} />
          ))}
        </div>

        {/* 極簡底列：可拖曳 + 圖釘 + 展開按鈕 */}
        <div className="drag-region flex items-center justify-end gap-1 border-t border-white/5 px-2 h-[22px]">
          {/* 圖釘按鈕：切換 alwaysOnTop */}
          <button
            className={`no-drag flex h-5 w-5 items-center justify-center rounded transition-all duration-150 hover:bg-white/10 ${
              isPinned ? 'text-white/70' : 'text-white/25 hover:text-white/70'
            }`}
            onClick={togglePin}
            title={isPinned ? '取消置頂' : '置頂視窗'}
            aria-label={isPinned ? '取消置頂' : '置頂視窗'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l5 5a.5.5 0 0 1-.707.707l-.46-.46-3.182 3.181.886 1.771a.5.5 0 0 1-.097.577l-.977.976a.5.5 0 0 1-.707 0L8 10.207l-2.938 2.938a.5.5 0 0 1-.707-.707L7.293 9.5 5.062 7.27a.5.5 0 0 1 0-.707l.976-.977a.5.5 0 0 1 .578-.097l1.77.886L11.568 3.19l-.46-.46a.5.5 0 0 1 .72-.008Z"/>
            </svg>
          </button>
          <button
            className="no-drag flex h-5 w-5 items-center justify-center rounded text-white/25 transition-all duration-150 hover:bg-white/10 hover:text-white/70"
            onClick={toggleCompact}
            title="退出極簡模式"
            aria-label="退出極簡模式"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M1.5 7A.75.75 0 0 1 2.25 6.25h2.19L2.22 4.03a.75.75 0 0 1 1.06-1.06l2.22 2.22V2.25a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-.75.75h-4A.75.75 0 0 1 1.5 7ZM9.25 2.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V4.31l-2.22 2.22a.75.75 0 1 1-1.06-1.06l2.22-2.22H10a.75.75 0 0 1-.75-.75ZM2.22 11.97l2.22-2.22H2.25a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-2.19l-2.22 2.22a.75.75 0 0 1-1.06-1.06ZM13.75 9.25a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-.75.75h-4a.75.75 0 0 1 0-1.5h2.19l-2.22-2.22a.75.75 0 1 1 1.06-1.06l2.22 2.22V10a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── 一般模式 layout ──────────────────────────────────────────────────────────
  return (
    // 外層容器：毛玻璃效果 + 透明背景
    <div className="glass flex h-screen flex-col rounded-2xl overflow-hidden select-none">
      {/* 標題列：可收合，隱藏後留 3px 細條，hover 展開 */}
      <div
        className={`overflow-hidden transition-[max-height] duration-200 ${
          titleBarVisible ? 'max-h-14' : 'max-h-[3px]'
        }`}
      >
        <TitleBar
          isLoading={isLoading}
          grayMode={grayMode}
          compactMode={compactMode}
          onAddClick={() => setShowModal(true)}
          onToggleGrayMode={() => setGrayMode((v) => !v)}
          onToggleCompact={toggleCompact}
          onHide={() => setTitleBarVisible(false)}
        />
      </div>

      {/* 分隔線（僅標題列顯示時） */}
      {titleBarVisible && <div className="mx-3 border-t border-white/5" />}

      {/* 股票清單 */}
      <StockList stocks={stocks} priceHistory={priceHistory} grayMode={grayMode} isLoading={isLoading} onRemove={removeStock} onReorder={reorderStocks} />

      {/* 群組切換列 */}
      <div className="drag-region flex items-center justify-center gap-0.5 border-t border-white/5 px-3 py-1">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((g) => (
          <button
            key={g}
            className={`no-drag h-5 w-9 rounded text-[10px] font-mono font-semibold transition-all duration-150 ${
              activeGroup === g
                ? 'bg-white/20 text-white/90'
                : 'text-white/25 hover:bg-white/10 hover:text-white/60'
            }`}
            onClick={() => setActiveGroup(g)}
            title={`群組 ${g}`}
            aria-label={`切換到群組 ${g}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* 底部狀態列 */}
      <div className="drag-region flex items-center justify-between border-t border-white/5 px-3 py-1.5 gap-2">
        <div className="flex items-center gap-1.5">
          {/* 狀態圓點 */}
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              isError ? 'bg-yellow-400' : isLoading ? 'animate-pulse bg-white/40' : 'bg-green-400/60'
            }`}
          />
          {/* 狀態文字 */}
          {isError ? (
            <span
              className="text-[10px] text-yellow-400/60 truncate max-w-[200px]"
              title={errorMessage ?? '未知錯誤'}
            >
              {errorMessage
                ? errorMessage.replace(/^\[stockBridge\]\s*/i, '').slice(0, 60)
                : '更新失敗，保留舊資料'}
            </span>
          ) : lastUpdated ? (
            <span className="text-[10px] text-white/25">
              更新於 {formatTime(lastUpdated)}
            </span>
          ) : (
            <span className="text-[10px] text-white/20">載入中...</span>
          )}
        </div>

        {/* 市場標示 */}
        <span className="text-[10px] text-white/15">TWSE／美股 · 每 10 秒更新</span>

        {/* 展開標題列按鈕（僅標題列隱藏時顯示） */}
        {!titleBarVisible && (
          <button
            className="no-drag ml-auto flex h-5 w-5 items-center justify-center rounded text-white/30 transition-all duration-150 hover:bg-white/10 hover:text-white/70"
            onClick={() => setTitleBarVisible(true)}
            title="展開標題列"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* 新增股票 Modal */}
      {showModal && (
        <AddStockModal onAdd={addStock} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
