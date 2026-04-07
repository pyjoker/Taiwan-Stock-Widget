import { useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { StockList } from './components/StockList'
import { AddStockModal } from './components/AddStockModal'
import { useStockData } from './hooks/useStockData'

/** 格式化時間為 HH:mm:ss */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-TW', { hour12: false })
}

export default function App(): JSX.Element {
  const { stocks, priceHistory, isLoading, isError, lastUpdated, addStock, removeStock } = useStockData()
  const [showModal, setShowModal] = useState(false)
  const [titleBarVisible, setTitleBarVisible] = useState(true)
  const [grayMode, setGrayMode] = useState(false)

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
          onAddClick={() => setShowModal(true)}
          onToggleGrayMode={() => setGrayMode((v) => !v)}
          onHide={() => setTitleBarVisible(false)}
        />
      </div>

      {/* 分隔線（僅標題列顯示時） */}
      {titleBarVisible && <div className="mx-3 border-t border-white/5" />}

      {/* 股票清單 */}
      <StockList stocks={stocks} priceHistory={priceHistory} grayMode={grayMode} isLoading={isLoading} onRemove={removeStock} />

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
            <span className="text-[10px] text-yellow-400/60">更新失敗，保留舊資料</span>
          ) : lastUpdated ? (
            <span className="text-[10px] text-white/25">
              更新於 {formatTime(lastUpdated)}
            </span>
          ) : (
            <span className="text-[10px] text-white/20">載入中...</span>
          )}
        </div>

        {/* 市場標示 */}
        <span className="text-[10px] text-white/15">TWSE · 每 10 秒更新</span>

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
