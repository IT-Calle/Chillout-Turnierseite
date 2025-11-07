import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Match, TournamentSettings } from '../types'

interface SvgKnockoutRendererProps {
  rounds: Match[][]
  currentRound: number
  settings: TournamentSettings
  onScoreUpdate: (matchId: string, playerId: string, increment: boolean) => void
  getRoundName: (roundIndex: number) => string
}

interface Selection {
  roundIdx: number
  matchIdx: number
}

const CARD_WIDTH = 220
const CARD_HEIGHT = 96
const HORIZONTAL_SPACING = 260
const VERTICAL_SPACING = 48
const START_X = 80
const START_Y = 100
const CONTROL_SIZE = 16
const CONTROL_GAP = 6
const SCORE_HEIGHT = 22
const SCORE_BOX_WIDTH = 44
const SCORE_STACK_WIDTH = CONTROL_SIZE * 2 + SCORE_BOX_WIDTH + CONTROL_GAP * 2

const SvgKnockoutRenderer: React.FC<SvgKnockoutRendererProps> = ({
  rounds,
  currentRound,
  onScoreUpdate,
  getRoundName
}) => {
  const [selection, setSelection] = useState<Selection>({ roundIdx: 0, matchIdx: 0 })

  const ensureSelection = useCallback(
    (candidate: Selection): Selection => {
      const safeRoundIdx =
        rounds.length === 0 ? 0 : Math.max(0, Math.min(candidate.roundIdx, rounds.length - 1))
      const matchesInRound = rounds[safeRoundIdx]?.length ?? 0
      const safeMatchIdx =
        matchesInRound === 0 ? 0 : Math.max(0, Math.min(candidate.matchIdx, matchesInRound - 1))
      if (safeRoundIdx !== candidate.roundIdx || safeMatchIdx !== candidate.matchIdx) {
        return { roundIdx: safeRoundIdx, matchIdx: safeMatchIdx }
      }
      return candidate
    },
    [rounds]
  )

  useEffect(() => {
    setSelection(prev => ensureSelection(prev))
  }, [ensureSelection, rounds])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!rounds.length) {
        return
      }

      setSelection(prevSelection => {
        let nextSelection: Selection = prevSelection
        const matchesInRound = rounds[prevSelection.roundIdx]?.length ?? 0

        switch (event.key) {
          case 'w':
          case 'W':
          case 'ArrowUp':
            nextSelection = {
              ...prevSelection,
              matchIdx: Math.max(0, prevSelection.matchIdx - 1)
            }
            break
          case 's':
          case 'S':
          case 'ArrowDown':
            nextSelection = {
              ...prevSelection,
              matchIdx: Math.min(matchesInRound - 1, prevSelection.matchIdx + 1)
            }
            break
          case 'a':
          case 'A':
            nextSelection = {
              roundIdx: Math.max(0, prevSelection.roundIdx - 1),
              matchIdx: prevSelection.matchIdx
            }
            break
          case 'd':
          case 'D':
            nextSelection = {
              roundIdx: Math.min(rounds.length - 1, prevSelection.roundIdx + 1),
              matchIdx: prevSelection.matchIdx
            }
            break
          case 'ArrowLeft': {
            const match = rounds[prevSelection.roundIdx]?.[prevSelection.matchIdx]
            if (match && match.player1 && match.player1.name !== 'TBD') {
              onScoreUpdate(match.id, match.player1.id, true)
            }
            break
          }
          case 'ArrowRight': {
            const match = rounds[prevSelection.roundIdx]?.[prevSelection.matchIdx]
            if (match && match.player2 && match.player2.name !== 'TBD') {
              onScoreUpdate(match.id, match.player2.id, true)
            }
            break
          }
          default:
            break
        }

        return ensureSelection(nextSelection)
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ensureSelection, onScoreUpdate, rounds])

  const layout = useMemo(() => {
    if (!rounds.length) {
      return {
        roundPositions: [] as number[][],
        width: START_X * 2 + CARD_WIDTH,
        height: START_Y * 2 + CARD_HEIGHT
      }
    }

    const roundPositions: number[][] = []
    rounds.forEach((round, roundIdx) => {
      if (roundIdx === 0) {
        roundPositions.push(
          round.map((_, matchIdx) => START_Y + matchIdx * (CARD_HEIGHT + VERTICAL_SPACING))
        )
        return
      }

      const previousPositions = roundPositions[roundIdx - 1] ?? []
      const fallback = previousPositions.length
        ? previousPositions[previousPositions.length - 1]
        : START_Y

      const positions = round.map((_, matchIdx) => {
        const parentA = previousPositions[matchIdx * 2]
        const parentB = previousPositions[matchIdx * 2 + 1]

        if (parentA !== undefined && parentB !== undefined) {
          return (parentA + parentB) / 2
        }
        if (parentA !== undefined) {
          return parentA
        }
        if (parentB !== undefined) {
          return parentB
        }
        return fallback + matchIdx * (CARD_HEIGHT + VERTICAL_SPACING)
      })

      roundPositions.push(positions)
    })

    const widestRound = Math.max(...rounds.map(round => round.length))
    const width = START_X * 2 + (rounds.length - 1) * HORIZONTAL_SPACING + CARD_WIDTH
    const height =
      START_Y * 2 + Math.max(1, widestRound) * (CARD_HEIGHT + VERTICAL_SPACING) + CARD_HEIGHT

    return { roundPositions, width, height }
  }, [rounds])

  const handleSelect = (roundIdx: number, matchIdx: number) => {
    setSelection(ensureSelection({ roundIdx, matchIdx }))
  }

  const renderScoreStack = (
    matchId: string,
    player: Match['player1'],
    scoreValue: number,
    stackX: number,
    stackY: number,
    key: string
  ) => {
    const playerReady = Boolean(player && player.name !== 'TBD')
    const canDecrement = playerReady && scoreValue > 0
    const scoreBoxWidth = SCORE_BOX_WIDTH
    const minusX = stackX
    const scoreBoxX = stackX + CONTROL_SIZE + CONTROL_GAP
    const plusX = scoreBoxX + SCORE_BOX_WIDTH + CONTROL_GAP
    const rowHeight = Math.max(SCORE_HEIGHT, CONTROL_SIZE)
    const controlOffset = (rowHeight - CONTROL_SIZE) / 2
    const scoreOffsetY = (rowHeight - SCORE_HEIGHT) / 2
    const minusY = stackY + controlOffset
    const scoreBoxY = stackY + scoreOffsetY
    const plusY = stackY + controlOffset

    const handleIncrement = () => {
      if (playerReady && player) {
        onScoreUpdate(matchId, player.id, true)
      }
    }

    const handleDecrement = () => {
      if (canDecrement && player) {
        onScoreUpdate(matchId, player.id, false)
      }
    }

    const buttonStyle = (enabled: boolean): React.CSSProperties => ({
      cursor: enabled ? 'pointer' : 'not-allowed'
    })
    const scoreFill = playerReady ? '#e0f2fe' : '#1f2937'
    const scoreStroke = playerReady ? '#0ea5e9' : '#334155'
    const iconColor = (enabled: boolean) => (enabled ? '#0f172a' : '#94a3b8')
    const upCenterX = plusX + CONTROL_SIZE / 2
    const upCenterY = plusY + CONTROL_SIZE / 2
    const downCenterX = minusX + CONTROL_SIZE / 2
    const downCenterY = minusY + CONTROL_SIZE / 2
    const arrowHalfWidth = CONTROL_SIZE * 0.25
    const arrowHeight = CONTROL_SIZE * 0.35
    const upArrow = `
      M ${upCenterX - arrowHalfWidth} ${upCenterY + arrowHeight / 2}
      L ${upCenterX} ${upCenterY - arrowHeight / 2}
      L ${upCenterX + arrowHalfWidth} ${upCenterY + arrowHeight / 2}
      Z
    `
    const downArrow = `
      M ${downCenterX - arrowHalfWidth} ${downCenterY - arrowHeight / 2}
      L ${downCenterX} ${downCenterY + arrowHeight / 2}
      L ${downCenterX + arrowHalfWidth} ${downCenterY - arrowHeight / 2}
      Z
    `

    return (
      <g key={key}>
        <rect
          x={plusX}
          y={plusY}
          width={CONTROL_SIZE}
          height={CONTROL_SIZE}
          rx={4}
          fill={playerReady ? '#22c55e' : '#475569'}
          onClick={playerReady ? handleIncrement : undefined}
          style={buttonStyle(playerReady)}
        />
        <path d={upArrow} fill={iconColor(playerReady)} />

        <rect
          x={scoreBoxX}
          y={scoreBoxY}
          width={scoreBoxWidth}
          height={SCORE_HEIGHT}
          rx={6}
          fill={scoreFill}
          stroke={scoreStroke}
          strokeWidth={1}
        />
        <text
          x={scoreBoxX + scoreBoxWidth / 2}
          y={scoreBoxY + SCORE_HEIGHT / 2 + 5}
          fill="#0f172a"
          fontSize={16}
          fontWeight={700}
          textAnchor="middle"
        >
          {scoreValue}
        </text>

        <rect
          x={minusX}
          y={minusY}
          width={CONTROL_SIZE}
          height={CONTROL_SIZE}
          rx={4}
          fill={canDecrement ? '#f87171' : '#475569'}
          onClick={canDecrement ? handleDecrement : undefined}
          style={buttonStyle(canDecrement)}
        />
        <path d={downArrow} fill={iconColor(canDecrement)} />
      </g>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMinYMin meet"
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0f172a" strokeWidth="1" opacity="0.3" />
        </pattern>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {rounds.map((round, roundIdx) => {
        const x = START_X + roundIdx * HORIZONTAL_SPACING
        const previousX = x - HORIZONTAL_SPACING

        return (
          <g key={`round-${roundIdx}`}>
            <text
              x={x + CARD_WIDTH / 2}
              y={START_Y - 40}
              fill="#e2e8f0"
              fontSize={16}
              fontWeight={roundIdx === currentRound ? 700 : 500}
              textAnchor="middle"
            >
              {getRoundName(roundIdx)}
            </text>

            {round.map((match, matchIdx) => {
              const y = layout.roundPositions[roundIdx]?.[matchIdx] ?? START_Y
              const matchCenterY = y + CARD_HEIGHT / 2
              const isSelected =
                selection.roundIdx === roundIdx && selection.matchIdx === matchIdx
              const identifier = `${match.id}-${roundIdx}-${matchIdx}`

              const connectors: React.ReactNode[] = []
              if (roundIdx > 0) {
                const parentIndices = [matchIdx * 2, matchIdx * 2 + 1]
                parentIndices.forEach(parentIdx => {
                  const parentY = layout.roundPositions[roundIdx - 1]?.[parentIdx]
                  if (parentY === undefined) {
                    return
                  }
                  const parentCenterY = parentY + CARD_HEIGHT / 2
                  const controlX = previousX + CARD_WIDTH + HORIZONTAL_SPACING / 2
                  connectors.push(
                    <path
                      key={`connector-${identifier}-${parentIdx}`}
                      d={`M ${previousX + CARD_WIDTH} ${parentCenterY} C ${controlX} ${parentCenterY}, ${controlX} ${matchCenterY}, ${x} ${matchCenterY}`}
                      stroke="#6fe36e"
                      strokeWidth={2.2}
                      fill="none"
                      opacity={0.8}
                    />
                  )
                })
              }

              const stackBaseX = x + CARD_WIDTH - SCORE_STACK_WIDTH - 12
              const topStackY = y + 6
              const bottomStackY = y + CARD_HEIGHT / 2 + 6

              return (
                <g key={identifier}>
                  {connectors}

                  <rect
                    x={x}
                    y={y}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    rx={16}
                    fill="url(#cardBg)"
                    stroke={isSelected ? '#5eead4' : match.isFinished ? '#22c55e' : '#94a3b8'}
                    strokeWidth={isSelected ? 4 : match.isFinished ? 3 : 2}
                    opacity={match.player1?.name === 'TBD' && match.player2?.name === 'TBD' ? 0.4 : 1}
                    onClick={() => handleSelect(roundIdx, matchIdx)}
                    style={{ cursor: 'pointer' }}
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
                    y={y + CARD_HEIGHT / 2 + 16}
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

                  {renderScoreStack(
                    match.id,
                    match.player1,
                    match.player1Score ?? 0,
                    stackBaseX,
                    topStackY,
                    `${identifier}-stack1`
                  )}
                  {renderScoreStack(
                    match.id,
                    match.player2,
                    match.player2Score ?? 0,
                    stackBaseX,
                    bottomStackY,
                    `${identifier}-stack2`
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

export default SvgKnockoutRenderer
