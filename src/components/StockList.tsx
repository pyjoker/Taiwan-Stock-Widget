import type { StockInfo } from '../types/stock'
import { StockItem } from './StockItem'

interface StockListProps {
  stocks: StockInfo[]
  priceHistory: Map<string, number[]>
  grayMode: boolean
  isLoading: boolean
  onRemove: (code: string) => void
}

export function StockList({ stocks, priceHistory, grayMode, isLoading, onRemove }: StockListProps): JSX.Element {
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
          {stocks.map((stock) => (
            <StockItem
              key={stock.code}
              stock={stock}
              sparkData={priceHistory.get(stock.code) ?? []}
              grayMode={grayMode}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
