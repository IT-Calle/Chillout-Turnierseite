import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Match } from '../types'
import SvgMatchCard from './svg/MatchCard'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  HORIZONTAL_SPACING,
  START_X,
  START_Y,
  VERTICAL_SPACING,
} from './svg/constants'
import type { ScoreUpdateHandler } from './svg/types'

interface SvgKnockoutRendererProps {
  rounds: Match[][]
  currentRound: number
  onScoreUpdate: ScoreUpdateHandler
  getRoundName: (roundIndex: number) => string
}

interface Selection {
  roundIdx: number
  matchIdx: number
}

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

              return (
                <SvgMatchCard
                  key={identifier}
                  match={match}
                  x={x}
                  y={y}
                  connectors={connectors}
                  isSelected={isSelected}
                  dimmed={match.player1?.name === 'TBD' && match.player2?.name === 'TBD'}
                  onSelect={() => handleSelect(roundIdx, matchIdx)}
                  onScoreUpdate={onScoreUpdate}
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

export default SvgKnockoutRenderer
