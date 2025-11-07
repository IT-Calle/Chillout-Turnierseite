import React from 'react'
import type { Match } from '../../types'
import SvgScoreStack from './ScoreStack'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SCORE_STACK_WIDTH,
} from './constants'
import type { ScoreUpdateHandler } from './types'

interface SvgMatchCardProps {
  match: Match
  x: number
  y: number
  width?: number
  height?: number
  connectors?: React.ReactNode[]
  isSelected?: boolean
  dimmed?: boolean
  interactive?: boolean
  onSelect?: () => void
  onScoreUpdate: ScoreUpdateHandler
}

const getPlayerState = (match: Match, playerId?: string | null) => {
  if (!playerId) {
    return 'pending' as const
  }
  if (match.winner?.id === playerId) {
    return 'winner' as const
  }
  if (match.isFinished) {
    return 'loser' as const
  }
  return 'pending' as const
}

const SvgMatchCard: React.FC<SvgMatchCardProps> = ({
  match,
  x,
  y,
  width = CARD_WIDTH,
  height = CARD_HEIGHT,
  connectors,
  isSelected = false,
  dimmed = false,
  interactive = true,
  onSelect,
  onScoreUpdate,
}) => {
  const stackBaseX = x + width - SCORE_STACK_WIDTH - 12
  const topStackY = y + 6
  const bottomStackY = y + height / 2 + 6

  const cardOpacity = dimmed ? 0.4 : 1
  const strokeColor = isSelected ? '#5eead4' : match.isFinished ? '#22c55e' : '#94a3b8'
  const strokeWidth = isSelected ? 4 : match.isFinished ? 3 : 2

  const player1State = getPlayerState(match, match.player1?.id)
  const player2State = getPlayerState(match, match.player2?.id)

  return (
    <g>
      {connectors}

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={16}
        fill="url(#cardBg)"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={cardOpacity}
        onClick={onSelect}
        style={{ cursor: onSelect ? 'pointer' : 'default' }}
      />

      <text
        x={x + 16}
        y={y + 22}
        fill={
          match.winner?.id === match.player1?.id
            ? '#22c55e'
            : match.isFinished && match.player1?.name !== 'TBD'
              ? '#f87171'
              : '#0f172a'
        }
        fontSize={13}
        fontWeight={match.winner?.id === match.player1?.id ? 700 : 500}
      >
        {match.player1?.name ?? 'TBD'}
      </text>

      <text
        x={x + 16}
        y={y + height / 2 + 16}
        fill={
          match.winner?.id === match.player2?.id
            ? '#22c55e'
            : match.isFinished && match.player2?.name !== 'TBD'
              ? '#f87171'
              : '#0f172a'
        }
        fontSize={13}
        fontWeight={match.winner?.id === match.player2?.id ? 700 : 500}
      >
        {match.player2?.name ?? 'TBD'}
      </text>

      <SvgScoreStack
        matchId={match.id}
        player={match.player1}
        score={match.player1Score ?? 0}
        x={stackBaseX}
        y={topStackY}
        stackKey={`${match.id}-top`}
        playerState={player1State}
        interactive={interactive && !match.isFinished}
        onScoreUpdate={onScoreUpdate}
      />

      <SvgScoreStack
        matchId={match.id}
        player={match.player2}
        score={match.player2Score ?? 0}
        x={stackBaseX}
        y={bottomStackY}
        stackKey={`${match.id}-bottom`}
        playerState={player2State}
        interactive={interactive && !match.isFinished}
        onScoreUpdate={onScoreUpdate}
      />
    </g>
  )
}

export default SvgMatchCard
