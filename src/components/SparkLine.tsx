interface SparkLineProps {
  data: number[]
  colorClass: string
  width?: number
  height?: number
}

export function SparkLine({ data, colorClass, width = 52, height = 28 }: SparkLineProps): JSX.Element | null {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2 // 上下留一點空間，避免截邊

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 opacity-70 ${colorClass}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
