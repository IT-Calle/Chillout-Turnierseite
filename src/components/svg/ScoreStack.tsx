import React from 'react'
import type { Match } from '../../types'
import { CONTROL_GAP, CONTROL_SIZE, SCORE_BOX_WIDTH, SCORE_HEIGHT } from './constants'
import type { ScoreUpdateHandler } from './types'

type PlayerSlotState = 'winner' | 'loser' | 'pending'

interface SvgScoreStackProps {
  matchId: string
  player: Match['player1'] | Match['player2'] | null
  score: number
  x: number
  y: number
  stackKey: string
  playerState: PlayerSlotState
  interactive?: boolean
  onScoreUpdate: ScoreUpdateHandler
}

const stackButtonStyle = (enabled: boolean): React.CSSProperties => ({
  cursor: enabled ? 'pointer' : 'not-allowed',
})

const iconColor = (enabled: boolean) => (enabled ? '#0f172a' : '#1e293b')

const getScoreFill = (state: PlayerSlotState) => {
  switch (state) {
    case 'winner':
      return '#dcfce7'
    case 'loser':
      return '#fee2e2'
    default:
      return '#e0f2fe'
  }
}

const getScoreStroke = (state: PlayerSlotState) => {
  switch (state) {
    case 'winner':
      return '#22c55e'
    case 'loser':
      return '#f87171'
    default:
      return '#38bdf8'
  }
}

const SvgScoreStack: React.FC<SvgScoreStackProps> = ({
  matchId,
  player,
  score,
  x,
  y,
  stackKey,
  playerState,
  interactive = true,
  onScoreUpdate,
}) => {
  const playerReady = Boolean(player && player.name !== 'TBD')
  const canIncrement = interactive && playerReady
  const canDecrement = interactive && playerReady && score > 0

  const rowHeight = Math.max(SCORE_HEIGHT, CONTROL_SIZE)
  const controlOffset = (rowHeight - CONTROL_SIZE) / 2
  const scoreOffsetY = (rowHeight - SCORE_HEIGHT) / 2

  const minusX = x
  const scoreBoxX = x + CONTROL_SIZE + CONTROL_GAP
  const plusX = scoreBoxX + SCORE_BOX_WIDTH + CONTROL_GAP

  const minusY = y + controlOffset
  const scoreBoxY = y + scoreOffsetY
  const plusY = y + controlOffset

  const arrowWidth = 8
  const arrowHeight = 10
  const arrowHalfWidth = arrowWidth / 2

  const upCenterX = plusX + CONTROL_SIZE / 2
  const upCenterY = plusY + CONTROL_SIZE / 2
  const downCenterX = minusX + CONTROL_SIZE / 2
  const downCenterY = minusY + CONTROL_SIZE / 2

  const upArrow = `
    M ${upCenterX} ${upCenterY - arrowHeight / 2}
    L ${upCenterX - arrowHalfWidth} ${upCenterY + arrowHeight / 2}
    L ${upCenterX + arrowHalfWidth} ${upCenterY + arrowHeight / 2}
    Z
  `

  const downArrow = `
    M ${downCenterX - arrowHalfWidth} ${downCenterY - arrowHeight / 2}
    L ${downCenterX + arrowHalfWidth} ${downCenterY - arrowHeight / 2}
    L ${downCenterX} ${downCenterY + arrowHeight / 2}
    Z
  `

  const scoreFill = getScoreFill(playerState)
  const scoreStroke = getScoreStroke(playerState)

  const handleIncrement = () => {
    if (canIncrement && player) {
      onScoreUpdate(matchId, player.id, true)
    }
  }

  const handleDecrement = () => {
    if (canDecrement && player) {
      onScoreUpdate(matchId, player.id, false)
    }
  }

  return (
    <g key={stackKey}>
      <rect
        x={plusX}
        y={plusY}
        width={CONTROL_SIZE}
        height={CONTROL_SIZE}
        rx={4}
        fill={playerReady ? '#22c55e' : '#475569'}
        onClick={canIncrement ? handleIncrement : undefined}
        style={stackButtonStyle(canIncrement)}
      />
      <path d={upArrow} fill={iconColor(canIncrement)} />

      <rect
        x={scoreBoxX}
        y={scoreBoxY}
        width={SCORE_BOX_WIDTH}
        height={SCORE_HEIGHT}
        rx={6}
        fill={scoreFill}
        stroke={scoreStroke}
        strokeWidth={1}
      />
      <text
        x={scoreBoxX + SCORE_BOX_WIDTH / 2}
        y={scoreBoxY + SCORE_HEIGHT / 2 + 5}
        fill="#0f172a"
        fontSize={16}
        fontWeight={700}
        textAnchor="middle"
      >
        {score}
      </text>

      <rect
        x={minusX}
        y={minusY}
        width={CONTROL_SIZE}
        height={CONTROL_SIZE}
        rx={4}
        fill={canDecrement ? '#f87171' : '#475569'}
        onClick={canDecrement ? handleDecrement : undefined}
        style={stackButtonStyle(canDecrement)}
      />
      <path d={downArrow} fill={iconColor(canDecrement)} />
    </g>
  )
}

export default SvgScoreStack
