interface TitleBarProps {
  isLoading: boolean
  grayMode: boolean
  compactMode: boolean
  onAddClick: () => void
  onToggleGrayMode: () => void
  onToggleCompact: () => void
}

export function TitleBar({ isLoading, grayMode, compactMode, onAddClick, onToggleGrayMode, onToggleCompact }: TitleBarProps): JSX.Element {
  const handleMinimize = (): void => {
    window.api.minimizeWindow()
  }

  const handleClose = (): void => {
    window.api.closeWindow()
  }

  return (
    // drag-region：整個標題列可拖曳移動視窗
    <div className="drag-region flex h-10 items-center justify-between px-3 py-2">
      {/* 左側：App 名稱 + loading 指示 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">
          股票小工具
        </span>
        {/* Fetch 進行中動畫指示器 */}
        {isLoading && (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 animate-bounce rounded-full bg-white/40"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 右側：操作按鈕（no-drag，避免被拖曳區攔截點擊） */}
      <div className="no-drag flex items-center gap-1">
        {/* 極簡模式按鈕 */}
        <button
          onClick={onToggleCompact}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 ${compactMode ? 'text-white/70' : 'text-white/40 hover:text-white/80'}`}
          title={compactMode ? '退出極簡模式' : '極簡模式'}
          aria-label="切換極簡模式"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M2.75 5.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 9a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75Z" />
          </svg>
        </button>

        {/* 灰色模式按鈕 */}
        <button
          onClick={onToggleGrayMode}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 ${grayMode ? 'text-white/60 hover:text-white/80' : 'text-white/40 hover:text-white/80'}`}
          title={grayMode ? '關閉灰色模式' : '灰色模式'}
          aria-label="切換灰色模式"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM2 8a6 6 0 0 1 6-6v12A6 6 0 0 1 2 8Z" />
          </svg>
        </button>

        {/* 新增股票按鈕 */}
        <button
          onClick={onAddClick}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-all duration-150 hover:bg-white/10 hover:text-white/80"
          title="新增股票"
          aria-label="新增股票"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
        </button>

        {/* 最小化按鈕 */}
        <button
          onClick={handleMinimize}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-all duration-150 hover:bg-white/10 hover:text-white/80"
          title="最小化"
          aria-label="最小化視窗"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
          </svg>
        </button>

        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400"
          title="關閉"
          aria-label="關閉應用程式"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
