import { useState, useMemo } from 'react'
import type { StockInfo } from '../types/stock'
import { StockItem } from './StockItem'

interface StockListProps {
  stocks: StockInfo[]
  priceHistory: Map<string, number[]>
  grayMode: boolean
  isLoading: boolean
  onRemove: (code: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function StockList({ stocks, priceHistory, grayMode, isLoading, onRemove, onReorder }: StockListProps): JSX.Element {
  const [dragCode, setDragCode] = useState<string | null>(null)
  const [overCode, setOverCode] = useState<string | null>(null)

  // 拖曳中即時顯示重排後的順序
  const displayedStocks = useMemo(() => {
    if (!dragCode || !overCode || dragCode === overCode) return stocks
    const from = stocks.findIndex((s) => s.code === dragCode)
    const to = stocks.findIndex((s) => s.code === overCode)
    if (from === -1 || to === -1) return stocks
    const arr = [...stocks]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    return arr
  }, [stocks, dragCode, overCode])

  const handleDrop = (): void => {
    if (dragCode && overCode && dragCode !== overCode) {
      const from = stocks.findIndex((s) => s.code === dragCode)
      const to = stocks.findIndex((s) => s.code === overCode)
      if (from !== -1 && to !== -1) onReorder(from, to)
    }
    setDragCode(null)
    setOverCode(null)
  }

  // 空清單提示
  if (stocks.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          className="h-12 w-12 text-white/20"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
        <p className="text-sm text-white/30">尚無股票</p>
        <p className="text-xs text-white/20">點擊右上角 + 新增股票</p>
      </div>
    )
  }

  return (
    <div className="no-drag flex flex-1 flex-col overflow-y-auto">
      {/* 載入中骨架屏 */}
      {isLoading && stocks.length === 0 && (
        <div className="space-y-2 p-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}

      {/* 股票列表 */}
      {stocks.length > 0 && (
        <div className="space-y-1 p-2">
          {displayedStocks.map((stock) => (
            <div
              key={stock.code}
              draggable
              onDragStart={(e) => {
                setDragCode(stock.code)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (stock.code !== dragCode) setOverCode(stock.code)
              }}
              onDrop={handleDrop}
              onDragEnd={() => { setDragCode(null); setOverCode(null) }}
              className={`transition-opacity duration-100 ${dragCode === stock.code ? 'opacity-40' : 'opacity-100'} ${dragCode ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
              <StockItem
                stock={stock}
                sparkData={priceHistory.get(stock.code) ?? []}
                grayMode={grayMode}
                onRemove={onRemove}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
