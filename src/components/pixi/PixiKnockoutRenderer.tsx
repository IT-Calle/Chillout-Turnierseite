import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Application, Container, Graphics, Text as PixiText } from 'pixi.js'
import type { DisplayObject } from 'pixi.js'
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
  const [appReady, setAppReady] = useState(false)

  // Auswahl für Keyboard-Steuerung
  const selectedRef = useRef<{ roundIdx: number; matchIdx: number }>({
    roundIdx: 0,
    matchIdx: 0,
  })

  const destroyContainerChildren = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const children = container.removeChildren() as DisplayObject[]
    children.forEach(child => {
      child.destroy({
        children: true
      })
    })
  }, [])

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
        setAppReady(true)
        onReady()
      } catch (err) {
        console.error('PixiKnockoutRenderer init failed:', err)
      }
    }

    void init()

    return () => {
      destroyed = true
      destroyContainerChildren()
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
        containerRef.current = null
      }
      setAppReady(false)
    }
  }, [destroyContainerChildren, onReady])

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
    if (!appReady || !app || !container) {
      return
    }

    ensureValidSelection()
    const { roundIdx: selRound, matchIdx: selMatch } = selectedRef.current

    destroyContainerChildren()

    const g = new Graphics()
    const width = app.renderer.width
    const height = app.renderer.height

    // Hintergrund-Grid
    g.lineStyle(1, 0x0f172a, 0.35)
    for (let x = 0; x < width; x += 32) {
      g.moveTo(x, 0)
      g.lineTo(x, height)
    }
    for (let y = 0; y < height; y += 32) {
      g.moveTo(0, y)
      g.lineTo(width, y)
    }

    const cardWidth = 220
    const cardHeight = 58
    const horizontalSpacing = 240
    const verticalSpacing = 36
    const startX = 90
    const startY = 120
    const connectorColor = 0x6fe36e

    const roundPositions: number[][] = []
    rounds.forEach((round, roundIndex) => {
      if (roundIndex === 0) {
        roundPositions.push(
          round.map((_, idx) => startY + idx * (cardHeight + verticalSpacing))
        )
      } else {
        const prevPositions = roundPositions[roundIndex - 1] ?? []
        const positions = round.map((_, idx) => {
          const lastPrev = prevPositions.length
            ? prevPositions[prevPositions.length - 1]
            : undefined
          const parentA = prevPositions[idx * 2] ?? lastPrev ?? startY
          const parentB = prevPositions[idx * 2 + 1] ?? parentA
          return (parentA + parentB) / 2
        })
        roundPositions.push(positions)
      }
    })

    rounds.forEach((round, rIndex) => {
      const roundX = startX + rIndex * horizontalSpacing
      const yPositions = roundPositions[rIndex] ?? []

      const roundLabel = new PixiText({
        text: getRoundName(rIndex),
        style: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 16,
          letterSpacing: 1,
          fill: 0xe2e8f0,
          fontWeight: 'bold',
        },
      })
      roundLabel.x = roundX + cardWidth / 2 - roundLabel.width / 2
      roundLabel.y = startY - 70
      container.addChild(roundLabel)

      round.forEach((match, mIndex) => {
        const matchY = yPositions[mIndex] ?? startY
        const matchCenterY = matchY + cardHeight / 2
        const isSelected = rIndex === selRound && mIndex === selMatch

        if (rIndex > 0) {
          const prevRoundX = startX + (rIndex - 1) * horizontalSpacing + cardWidth
          const parentPositions = roundPositions[rIndex - 1] ?? []
          const parentIndices = [mIndex * 2, mIndex * 2 + 1]
          const controlX = prevRoundX + horizontalSpacing / 2

          parentIndices.forEach((idx) => {
            const parentY = parentPositions[idx]
            if (parentY === undefined) return
            const parentCenterY = parentY + cardHeight / 2
            g.lineStyle(2.2, connectorColor, 0.85)
            g.moveTo(prevRoundX, parentCenterY)
            g.quadraticCurveTo(controlX, parentCenterY, roundX, matchCenterY)
          })
        }

        g.lineStyle(0)
        g.beginFill(0x0284c7)
        g.drawRoundedRect(roundX, matchY, cardWidth, cardHeight, 16)
        g.endFill()

        if (isSelected) {
          g.lineStyle(4, 0x5eead4, 0.9)
          g.drawRoundedRect(roundX, matchY, cardWidth, cardHeight, 16)
        } else if (match.isFinished) {
          g.lineStyle(2, 0x22c55e, 0.85)
          g.drawRoundedRect(roundX, matchY, cardWidth, cardHeight, 16)
        }

        const playerTextStyle: ConstructorParameters<typeof PixiText>[0]['style'] = {
          fontSize: 14,
          fill: 0xf8fafc,
          fontWeight: match.winner ? 'bold' : 'normal',
        }

        const player1 = new PixiText({
          text: match.player1?.name ?? 'TBD',
          style: playerTextStyle,
        })
        player1.x = roundX + 18
        player1.y = matchY + 12
        container.addChild(player1)

        const player2 = new PixiText({
          text: match.player2?.name ?? 'TBD',
          style: playerTextStyle,
        })
        player2.x = roundX + 18
        player2.y = matchY + cardHeight / 2 + 4
        container.addChild(player2)

        const scoreStyle: ConstructorParameters<typeof PixiText>[0]['style'] = {
          fontSize: 16,
          fill: 0xfef3c7,
          fontWeight: 'bold',
        }

        const score1 = new PixiText({
          text: String(match.player1Score ?? 0),
          style: scoreStyle,
        })
        score1.x = roundX + cardWidth - 32
        score1.y = matchY + 8
        container.addChild(score1)

        const score2 = new PixiText({
          text: String(match.player2Score ?? 0),
          style: scoreStyle,
        })
        score2.x = roundX + cardWidth - 32
        score2.y = matchY + cardHeight / 2 + 8
        container.addChild(score2)
      })
    })

    container.addChild(g)
  }, [appReady, destroyContainerChildren, getRoundName, rounds, currentRound])
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
      if (appRef.current) {
        destroyContainerChildren()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [destroyContainerChildren, onScoreUpdate, rounds])

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

