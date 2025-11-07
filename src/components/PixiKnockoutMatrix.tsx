import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { Application as PixiApplication, extend } from '@pixi/react'
import { Graphics, Text as PixiText, Container } from 'pixi.js'
import type { Player, Match, TournamentSettings } from '../types'

// @pixi/react v8: explizit sagen, welche Pixi-Klassen als JSX nutzbar sind
extend({ Graphics, Text: PixiText, Container })

interface PixiKnockoutMatrixProps {
  players: Player[]
  matches: Match[]
  settings: TournamentSettings
  onMatchesUpdate: (matches: Match[]) => void
}

const PixiKnockoutMatrix: React.FC<PixiKnockoutMatrixProps> = ({
  players,
  matches,
  settings,
  onMatchesUpdate,
}) => {
  const [rounds, setRounds] = useState<Match[][]>([])
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, gray.700, gray.800)'
  )

  const cardWidth = 280
  const cardHeight = 50
  const roundSpacing = 350
  const matchSpacing = 80
  const startX = 50
  const startY = 50

  const getRoundName = useCallback(
    (roundIndex: number) => {
      const totalRounds = rounds.length
      const roundNumber = roundIndex + 1

      if (roundNumber === totalRounds && rounds[roundIndex].length === 1) {
        return 'Finale'
      } else if (roundNumber === totalRounds - 1 && rounds[roundIndex].length === 2) {
        return 'Halbfinale'
      } else if (roundNumber === totalRounds - 2 && rounds[roundIndex].length === 4) {
        return 'Viertelfinale'
      } else {
        return `Runde ${roundNumber}`
      }
    },
    [rounds]
  )

  // Initiale Bracket-Generierung (nur wenn keine Matches vorgegeben sind)
  useEffect(() => {
    if (matches.length === 0 && players.length > 0) {
      const sortedPlayers = [...players].sort(
        (a, b) => (a.seed || 0) - (b.seed || 0)
      )
      const totalRounds = Math.ceil(Math.log2(players.length))
      const allRounds: Match[][] = []

      let playersInRound = players.length

      for (let round = 1; round <= totalRounds; round++) {
        const roundMatches: Match[] = []
        const matchesInThisRound = Math.floor(playersInRound / 2)

        for (let matchIndex = 0; matchIndex < matchesInThisRound; matchIndex++) {
          const match: Match = {
            id: crypto.randomUUID(),
            player1:
              round === 1 && matchIndex * 2 < sortedPlayers.length
                ? sortedPlayers[matchIndex * 2]
                : {
                    id: `tbd-${round}-${matchIndex}-1`,
                    name: 'TBD',
                    seed: 0,
                  },
            player2:
              round === 1 && matchIndex * 2 + 1 < sortedPlayers.length
                ? sortedPlayers[matchIndex * 2 + 1]
                : {
                    id: `tbd-${round}-${matchIndex}-2`,
                    name: 'TBD',
                    seed: 0,
                  },
            player1Score: 0,
            player2Score: 0,
            isFinished: false,
            round,
          }
          roundMatches.push(match)
        }

        if (matchesInThisRound > 0) {
          allRounds.push(roundMatches)
        }

        playersInRound = matchesInThisRound
        if (playersInRound <= 1) break
      }

      setRounds(allRounds)

      const firstRoundMatches =
        allRounds[0]?.filter(
          (m) => m.player1.name !== 'TBD' && m.player2.name !== 'TBD'
        ) || []
      onMatchesUpdate(firstRoundMatches)
    }
  }, [players, matches.length, onMatchesUpdate])

  const incrementScore = (matchId: string, playerId: string) => {
    setRounds((prevRounds) =>
      prevRounds.map((round) =>
        round.map((match) => {
          if (match.id === matchId && !match.isFinished) {
            const maxScore = settings.format === 'best-of-3' ? 2 : 3
            const isPlayer1 = match.player1.id === playerId
            const currentScore = isPlayer1
              ? match.player1Score
              : match.player2Score

            if (currentScore < maxScore) {
              const newPlayer1Score = isPlayer1
                ? currentScore + 1
                : match.player1Score
              const newPlayer2Score = !isPlayer1
                ? currentScore + 1
                : match.player2Score

              const isFinished =
                newPlayer1Score >= maxScore || newPlayer2Score >= maxScore
              const winner = isFinished
                ? newPlayer1Score > newPlayer2Score
                  ? match.player1
                  : match.player2
                : undefined

              return {
                ...match,
                player1Score: newPlayer1Score,
                player2Score: newPlayer2Score,
                isFinished,
                winner,
              }
            }
          }
          return match
        })
      )
    )
  }

  // Deklaratives PIXI Rendering mit @pixi/react
  const renderPixi = () => {
    if (rounds.length === 0) return null

    return (
      <>
        {/* Alle Boxen & Linien via Graphics */}
        <pixiGraphics
          draw={(g) => {
            g.clear()

            rounds.forEach((round, roundIndex) => {
              const x = startX + roundIndex * roundSpacing

              round.forEach((match, matchIndex) => {
                const y = startY + matchIndex * matchSpacing

                // Match-Card
                g.roundRect(x, y, cardWidth, cardHeight, 8)
                  .stroke({
                    width: 2,
                    color: match.isFinished ? 0x68d391 : 0x63b3ed,
                  })
                  .fill(match.isFinished ? 0xf0fff4 : 0xffffff)

                // Player 1 Area
                g.roundRect(
                  x + 5,
                  y + 5,
                  cardWidth / 2 - 25,
                  cardHeight - 10,
                  4
                ).fill(
                  match.winner?.id === match.player1.id
                    ? 0xe6fffa
                    : 0xebf8ff
                )

                // Player 2 Area
                g.roundRect(
                  x + cardWidth / 2 + 15,
                  y + 5,
                  cardWidth / 2 - 25,
                  cardHeight - 10,
                  4
                ).fill(
                  match.winner?.id === match.player2.id
                    ? 0xe6fffa
                    : 0xebf8ff
                )

                // Verbindungslinien zur nächsten Runde
                if (roundIndex < rounds.length - 1) {
                  g.moveTo(x + cardWidth, y + cardHeight / 2)
                  g.lineTo(
                    x + roundSpacing - 50,
                    y + cardHeight / 2
                  ).stroke({ width: 2, color: 0x63b3ed })
                }
              })
            })
          }}
        />

        {/* Runde-Header + Texte + Scores + VS */}
        {rounds.map((round, roundIndex) => {
          const roundX = startX + roundIndex * roundSpacing

          return (
            <React.Fragment key={`round-${roundIndex}`}>
              {/* Round Header */}
              <pixiText
                text={getRoundName(roundIndex)}
                x={roundX + cardWidth / 2}
                y={startY - 30}
                anchor={{ x: 0.5, y: 0 }}
                style={{
                  fontSize: 16,
                  fill: 0x2d3748,
                  fontWeight: 'bold',
                }}
              />

              {round.map((match, matchIndex) => {
                const y = startY + matchIndex * matchSpacing

                const isTbd1 = match.player1.name === 'TBD'
                const isTbd2 = match.player2.name === 'TBD'

                return (
                  <React.Fragment key={match.id}>
                    {/* Player 1 Name */}
                    <pixiText
                      text={match.player1.name}
                      x={roundX + 10}
                      y={y + 10}
                      style={{
                        fontSize: 12,
                        fill: isTbd1 ? 0x9ca3af : 0x2d3748,
                        fontWeight:
                          match.winner?.id === match.player1.id
                            ? 'bold'
                            : 'normal',
                      }}
                    />

                    {/* Player 2 Name */}
                    <pixiText
                      text={match.player2.name}
                      x={roundX + cardWidth / 2 + 20}
                      y={y + 10}
                      style={{
                        fontSize: 12,
                        fill: isTbd2 ? 0x9ca3af : 0x2d3748,
                        fontWeight:
                          match.winner?.id === match.player2.id
                            ? 'bold'
                            : 'normal',
                      }}
                    />

                    {/* Scores */}
                    {!isTbd1 && (
                      <pixiText
                        text={match.player1Score.toString()}
                        x={roundX + cardWidth / 2 - 40}
                        y={y + cardHeight / 2 - 10}
                        style={{
                          fontSize: 16,
                          fill:
                            match.winner?.id === match.player1.id
                              ? 0x22c55e
                              : 0x3b82f6,
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    {!isTbd2 && (
                      <pixiText
                        text={match.player2Score.toString()}
                        x={roundX + cardWidth - 30}
                        y={y + cardHeight / 2 - 10}
                        style={{
                          fontSize: 16,
                          fill:
                            match.winner?.id === match.player2.id
                              ? 0x22c55e
                              : 0x3b82f6,
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    {/* VS */}
                    <pixiText
                      text="VS"
                      x={roundX + cardWidth / 2}
                      y={y + cardHeight / 2 - 8}
                      anchor={{ x: 0.5, y: 0 }}
                      style={{
                        fontSize: 10,
                        fill: 0x6b7280,
                        fontWeight: 'bold',
                      }}
                    />
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}
      </>
    )
  }

  return (
    <Card bg={bgGradient} shadow="xl" borderRadius="2xl" overflow="hidden">
      <CardHeader bg="blue.800" color="white" py={6}>
        <Heading size="lg" textAlign="center" fontWeight="bold">
          🏆 Knockout Matrix (PIXI React v8)
        </Heading>
      </CardHeader>

      <CardBody p={4}>
        <VStack spacing={4}>
          {/* PIXI Canvas via @pixi/react */}
          <Box
            border="2px"
            borderColor="blue.200"
            borderRadius="lg"
            overflow="hidden"
            w="100%"
          >
            <PixiApplication
              width={1200}
              height={600}
              background={0xf7fafc}
              // optional: autoDensity, antialias, resizeTo etc.
              antialias
            >
              <pixiContainer>{renderPixi()}</pixiContainer>
            </PixiApplication>
          </Box>

          {/* Interactive Controls */}
          <HStack spacing={4} flexWrap="wrap" justify="center">
            {rounds
              .flat()
              .filter(
                (m) =>
                  m.player1.name !== 'TBD' &&
                  m.player2.name !== 'TBD' &&
                  !m.isFinished
              )
              .map((match) => (
                <HStack
                  key={match.id}
                  spacing={2}
                  p={2}
                  bg="white"
                  borderRadius="md"
                  shadow="sm"
                >
                  <Text fontSize="sm" fontWeight="bold">
                    {match.player1.name} vs {match.player2.name}
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={() =>
                      incrementScore(match.id, match.player1.id)
                    }
                  >
                    +1 {match.player1.name}
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={() =>
                      incrementScore(match.id, match.player2.id)
                    }
                  >
                    +1 {match.player2.name}
                  </Button>
                </HStack>
              ))}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default PixiKnockoutMatrix
