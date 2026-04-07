import type { StockInfo } from '../types/stock'
import { SparkLine } from './SparkLine'

interface StockItemProps {
  stock: StockInfo
  sparkData: number[]
  grayMode: boolean
  onRemove: (code: string) => void
}

/** 格式化數字為台灣慣用的千分位字串 */
function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/** 格式化成交量（萬張以上顯示 xx.x萬） */
function formatVolume(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}萬`
  return v.toLocaleString('zh-TW')
}

export function StockItem({ stock, sparkData, grayMode, onRemove }: StockItemProps): JSX.Element {
  const { code, name, price, change, changePercent, high, low, volume, isAfterHours } = stock

  // 決定漲跌顏色（台灣慣例：漲紅跌綠）；灰色模式時一律用股票名稱色
  const colorClass = grayMode
    ? 'text-white/50'
    : isAfterHours || change === 0
      ? 'text-gray-400'
      : change > 0
        ? 'text-red-400'
        : 'text-green-400'

  const changeSign = change > 0 ? '+' : ''

  return (
    <div className="group relative flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:bg-white/5">
      {/* 左側：代碼 + 名稱 + 漲跌資訊，右接高低價 */}
      <div className="min-w-0 flex flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-sm font-semibold ${grayMode ? 'text-white/50' : 'text-white/90'}`}>{code}</span>
            <span className="truncate text-xs text-white/50">{name}</span>
            {isAfterHours && (
              <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/40">
                昨收
              </span>
            )}
          </div>

          <div className={`mt-0.5 flex items-center gap-1.5 text-xs ${colorClass}`}>
            {isAfterHours ? (
              <span className="text-white/40">--</span>
            ) : (
              <>
                <span>{changeSign}{formatNumber(change)}</span>
                <span className="text-white/20">·</span>
                <span>{changeSign}{formatNumber(changePercent)}%</span>
              </>
            )}
            <span className="text-white/20">·</span>
            <span className="text-white/40">{formatVolume(volume)}張</span>
          </div>
        </div>

        {/* 當日高低價：緊貼左側內容 */}
        <div className="flex flex-col text-xs">
          <span className={grayMode ? 'text-white/50' : 'text-red-400/70'}>{isAfterHours ? '--' : formatNumber(high)}</span>
          <span className={grayMode ? 'text-white/50' : 'text-green-400/70'}>{isAfterHours ? '--' : formatNumber(low)}</span>
        </div>
      </div>

      {/* 右側：走勢圖 + 現價 + 刪除按鈕 */}
      <div className="no-drag flex items-center gap-2 text-right">
        <SparkLine data={sparkData} colorClass={colorClass} />
        <span className={`font-mono text-base font-bold ${colorClass}`}>
          {formatNumber(price)}
        </span>
        {/* 刪除按鈕：只在 hover 時顯示 */}
        <button
          onClick={() => onRemove(code)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-white/0 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400 group-hover:text-white/30"
          title={`移除 ${name}`}
          aria-label={`移除 ${name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3 w-3"
          >
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
