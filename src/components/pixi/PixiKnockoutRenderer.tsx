import React, { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text as PixiText } from 'pixi.js'
import type { Match, TournamentSettings } from '../../types'

interface PixiKnockoutRendererProps {
  rounds: Match[][]
  currentRound: number
  settings: TournamentSettings
  onScoreUpdate: (matchId: string, playerId: string, increment: boolean) => void
  onReady: () => void
  getRoundName: (roundIndex: number) => string
}

export const PixiKnockoutRenderer: React.FC<PixiKnockoutRendererProps> = ({
  rounds,
  currentRound,
  //settings,
  onScoreUpdate,
  onReady,
  getRoundName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const containerRef = useRef<Container | null>(null)

  // Auswahl für Keyboard-Steuerung
  const selectedRef = useRef<{ roundIdx: number; matchIdx: number }>({
    roundIdx: 0,
    matchIdx: 0,
  })

  // Pixi App einmalig initialisieren
  useEffect(() => {
    if (!canvasRef.current) return
    if (appRef.current) return

    let destroyed = false

    const init = async () => {
      try {
        const app = new Application()

        await app.init({
          canvas: canvasRef.current!,
          backgroundColor: 0x111827, // dunkel
          resizeTo: window,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })

        if (destroyed) {
          app.destroy(true)
          return
        }

        const container = new Container()
        app.stage.addChild(container)

        appRef.current = app
        containerRef.current = container

        onReady()
      } catch (err) {
        console.error('PixiKnockoutRenderer init failed:', err)
      }
    }

    void init()

    return () => {
      destroyed = true
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
        containerRef.current = null
      }
    }
  }, [onReady])

  // Helper: sichere Auswahl innerhalb bounds halten
  const ensureValidSelection = () => {
    if (!rounds.length) {
      selectedRef.current = { roundIdx: 0, matchIdx: 0 }
      return
    }
    let { roundIdx, matchIdx } = selectedRef.current
    if (roundIdx < 0 || roundIdx >= rounds.length) {
      roundIdx = 0
    }
    const roundMatches = rounds[roundIdx] || []
    if (matchIdx < 0 || matchIdx >= roundMatches.length) {
      matchIdx = 0
    }
    selectedRef.current = { roundIdx, matchIdx }
  }

  // Rendering des Brackets bei Änderungen
  useEffect(() => {
    const app = appRef.current
    const container = containerRef.current
    if (!app || !container) return

    ensureValidSelection()
    const { roundIdx: selRound, matchIdx: selMatch } = selectedRef.current

    container.removeChildren()

    if (!rounds.length) {
      app.render()
      return
    }

    const g = new Graphics()

    const width = app.renderer.width
    const height = app.renderer.height

    // Subtiles Grid im Hintergrund
    g.lineStyle(1, 0x111827, 1)
    for (let x = 0; x < width; x += 40) {
      g.moveTo(x, 0)
      g.lineTo(x, height)
    }
    for (let y = 0; y < height; y += 40) {
      g.moveTo(0, y)
      g.lineTo(width, y)
    }

    container.addChild(g)

    const cardWidth = 260
    const cardHeight = 52
    const roundSpacing = Math.max(260, (width - 200) / Math.max(rounds.length, 1))
    const matchSpacing = 80
    const startX = 80
    const startY = 140

    rounds.forEach((round, rIndex) => {
      const baseX = startX + rIndex * roundSpacing

      // Rundenüberschrift
      const roundLabel = new PixiText({
        text: getRoundName(rIndex),
        style: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 16,
          fill: 0xe5e7eb,
          fontWeight: 'bold',
        },
      })
      roundLabel.x = baseX + cardWidth / 2 - roundLabel.width / 2
      roundLabel.y = startY - 50
      container.addChild(roundLabel)

      round.forEach((match, mIndex) => {
        const x = baseX
        const y = startY + mIndex * matchSpacing

        const isSelected = rIndex === selRound && mIndex === selMatch
        const isTbd1 = !match.player1 || match.player1.name === 'TBD'
        const isTbd2 = !match.player2 || match.player2.name === 'TBD'
        const winnerId = match.winner?.id

        // Match-Hintergrund
        g.lineStyle(
          isSelected ? 3 : 2,
          match.isFinished ? 0x22c55e : isSelected ? 0xf97316 : 0x38bdf8,
          1
        )
        g.beginFill(0x020817)
        g.drawRoundedRect(x, y, cardWidth, cardHeight, 10)
        g.endFill()

        // Player 1 Area
        g.lineStyle(0)
        g.beginFill(
          winnerId && winnerId === match.player1?.id ? 0x064e3b : 0x111827
        )
        g.drawRoundedRect(
          x + 6,
          y + 6,
          cardWidth / 2 - 24,
          cardHeight - 12,
          6
        )
        g.endFill()

        // Player 2 Area
        g.beginFill(
          winnerId && winnerId === match.player2?.id ? 0x064e3b : 0x111827
        )
        g.drawRoundedRect(
          x + cardWidth / 2 + 18,
          y + 6,
          cardWidth / 2 - 24,
          cardHeight - 12,
          6
        )
        g.endFill()

        // Player 1 Text
        const p1 = new PixiText({
          text: isTbd1 ? 'TBD' : match.player1?.name ?? '—',
          style: {
            fontSize: 11,
            fill: isTbd1 ? 0x6b7280 : 0xe5e7eb,
            fontWeight:
              winnerId && winnerId === match.player1?.id ? 'bold' : 'normal',
          },
        })
        p1.x = x + 10
        p1.y = y + 10
        container.addChild(p1)

        // Player 2 Text
        const p2 = new PixiText({
          text: isTbd2 ? 'TBD' : match.player2?.name ?? '—',
          style: {
            fontSize: 11,
            fill: isTbd2 ? 0x6b7280 : 0xe5e7eb,
            fontWeight:
              winnerId && winnerId === match.player2?.id ? 'bold' : 'normal',
          },
        })
        p2.x = x + cardWidth / 2 + 22
        p2.y = y + 10
        container.addChild(p2)

        // Scores
        if (!isTbd1) {
          const s1 = new PixiText({
            text: String(match.player1Score ?? 0),
            style: {
              fontSize: 14,
              fill:
                winnerId && winnerId === match.player1?.id
                  ? 0x22c55e
                  : 0x38bdf8,
              fontWeight: 'bold',
            },
          })
          s1.x = x + cardWidth / 2 - 34
          s1.y = y + cardHeight / 2 - 11
          container.addChild(s1)
        }

        if (!isTbd2) {
          const s2 = new PixiText({
            text: String(match.player2Score ?? 0),
            style: {
              fontSize: 14,
              fill:
                winnerId && winnerId === match.player2?.id
                  ? 0x22c55e
                  : 0x38bdf8,
              fontWeight: 'bold',
            },
          })
          s2.x = x + cardWidth - 30
          s2.y = y + cardHeight / 2 - 11
          container.addChild(s2)
        }

        // VS
        const vs = new PixiText({
          text: 'VS',
          style: {
            fontSize: 10,
            fill: 0x6b7280,
            fontWeight: 'bold',
          },
        })
        vs.x = x + cardWidth / 2 - vs.width / 2
        vs.y = y + cardHeight / 2 - 7
        container.addChild(vs)

        // Verbindung zur nächsten Runde
        if (rIndex < rounds.length - 1) {
          const midY = y + cardHeight / 2
          g.lineStyle(1.5, 0x38bdf8, 0.8)
          g.moveTo(x + cardWidth, midY)
          g.lineTo(x + roundSpacing - 40, midY)
        }
      })
    })

    container.addChild(g)
    app.render()
  }, [rounds, currentRound, getRoundName])

  // Keyboard Controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const app = appRef.current
      if (!app || !rounds.length) return

      ensureValidSelection()
      let { roundIdx, matchIdx } = selectedRef.current

      const currentMatches = rounds[roundIdx] || []
      const currentMatch = currentMatches[matchIdx]
      if (!currentMatch) return

      const maxRoundIdx = rounds.length - 1

      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp': {
          matchIdx = Math.max(0, matchIdx - 1)
          break
        }
        case 's':
        case 'S':
        case 'ArrowDown': {
          matchIdx = Math.min(
            (rounds[roundIdx]?.length || 1) - 1,
            matchIdx + 1
          )
          break
        }
        case 'a':
        case 'A': {
          roundIdx = Math.max(0, roundIdx - 1)
          matchIdx = Math.min(
            matchIdx,
            (rounds[roundIdx]?.length || 1) - 1
          )
          break
        }
        case 'd':
        case 'D': {
          roundIdx = Math.min(maxRoundIdx, roundIdx + 1)
          matchIdx = Math.min(
            matchIdx,
            (rounds[roundIdx]?.length || 1) - 1
          )
          break
        }
        case 'ArrowLeft': {
          // +1 für Player1
          if (currentMatch.player1) {
            onScoreUpdate(currentMatch.id, currentMatch.player1.id, true)
          }
          break
        }
        case 'ArrowRight': {
          // +1 für Player2
          if (currentMatch.player2) {
            onScoreUpdate(currentMatch.id, currentMatch.player2.id, true)
          }
          break
        }
        default:
          return
      }

      selectedRef.current = { roundIdx, matchIdx }

      // Nach Navigation/Score neu rendern
      const container = containerRef.current
      if (app && container) {
        container.removeChildren()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [rounds, onScoreUpdate])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        outline: 'none',
      }}
    />
  )
}
