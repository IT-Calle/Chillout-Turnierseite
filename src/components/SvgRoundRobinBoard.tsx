import React, { useMemo } from 'react'
import type { Match } from '../types'
import SvgMatchCard from './svg/MatchCard'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  START_X,
  START_Y,
  VERTICAL_SPACING,
  HORIZONTAL_SPACING,
} from './svg/constants'
import type { ScoreUpdateHandler } from './svg/types'

interface SvgRoundRobinBoardProps {
  matches: Match[]
  columns?: number
  allowEditing?: boolean
  onScoreUpdate: ScoreUpdateHandler
}

const SvgRoundRobinBoard: React.FC<SvgRoundRobinBoardProps> = ({
  matches,
  columns = 2,
  allowEditing = true,
  onScoreUpdate,
}) => {
  const columnWidth = CARD_WIDTH + (HORIZONTAL_SPACING - CARD_WIDTH)
  const rowHeight = CARD_HEIGHT + VERTICAL_SPACING + 16

  const { width, height, positions } = useMemo(() => {
    const rows = Math.max(1, Math.ceil(matches.length / columns))
    const widthValue = START_X * 2 + columns * columnWidth
    const heightValue = START_Y * 2 + rows * rowHeight

    const computedPositions = matches.map((_, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = START_X + col * columnWidth
      const y = START_Y + row * rowHeight
      return { x, y }
    })

    return { width: widthValue, height: heightValue, positions: computedPositions }
  }, [matches, columns, columnWidth, rowHeight])

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMin meet"
    >
      <defs>
        <pattern id="rr-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0f172a" strokeWidth="1" opacity="0.25" />
        </pattern>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rr-grid)" />

      {matches.map((match, index) => {
        const position = positions[index]
        if (!position) {
          return null
        }
        return (
          <SvgMatchCard
            key={match.id}
            match={match}
            x={position.x}
            y={position.y}
            interactive={allowEditing && !match.isFinished}
            onScoreUpdate={onScoreUpdate}
          />
        )
      })}
    </svg>
  )
}

export default SvgRoundRobinBoard
