import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Center,
  Icon,
} from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { FaListUl } from 'react-icons/fa'
import type { Player, Match, TournamentSettings, RoundRobinResult } from '../types'
import SvgRoundRobinBoard from './SvgRoundRobinBoard'
import type { ScoreUpdateHandler } from './svg/types'

interface RoundRobinTableProps {
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  onMatchesUpdate: (matches: Match[]) => void
  onBack: () => void
}

const NEON_COLORS = {
  cardBg: 'rgba(15,23,42,0.9)',
  panelBg: 'rgba(2,6,23,0.65)',
  border: 'rgba(14,165,233,0.5)',
  accent: '#0ea5e9',
  accentSoft: 'rgba(14,165,233,0.2)',
  success: '#22c55e',
  danger: '#f87171',
  muted: '#94a3b8',
}

const RoundRobinTable = ({ 
  players, 
  settings, 
  matches, 
  onMatchesUpdate, 
  onBack 
}: RoundRobinTableProps) => {
  const [results, setResults] = useState<RoundRobinResult[]>([])

  // Hilfsfunktion um eliminierte Spieler zu ermitteln
  const getEliminatedPlayers = useCallback((): string[] => {
    const playerLosses: { [playerId: string]: number } = {};
    
    // Verluste zählen
    matches.forEach(match => {
      if (match.isFinished && match.winner) {
        const loser = match.winner.id === match.player1.id ? match.player2 : match.player1;
        playerLosses[loser.id] = (playerLosses[loser.id] || 0) + 1;
      }
    });
    
    // Spieler mit 2 Verlusten sind eliminiert
    return Object.keys(playerLosses).filter(playerId => playerLosses[playerId] >= 2);
  }, [matches])

  // Intelligente Match-Generierung: Erstelle nur aktuelle Matches
  useEffect(() => {
    if (players.length < 2) return
    
    // Alle möglichen Paarungen erstellen (aber nicht alle gleichzeitig)
    const allPossibleMatches: { p1: Player; p2: Player }[] = []
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        allPossibleMatches.push({ p1: players[i], p2: players[j] })
      }
    }
    
    // Prüfe welche Matches bereits existieren
    const existingMatchups = new Set(
      matches.map(m => `${m.player1.id}-${m.player2.id}`)
    )
    
    // Finde verfügbare Spieler (nicht in aktuellen Matches)
    const playersInCurrentMatches = new Set<string>()
    matches.filter(m => !m.isFinished).forEach(m => {
      playersInCurrentMatches.add(m.player1.id)
      playersInCurrentMatches.add(m.player2.id)
    })
    
    const eliminatedPlayers = new Set(getEliminatedPlayers())
    const availablePlayers = players.filter(p => 
      !playersInCurrentMatches.has(p.id) && !eliminatedPlayers.has(p.id)
    )
    
    // Erstelle neue Matches für verfügbare Spieler
    const newMatches: Match[] = [...matches]
    const usedInNewMatches = new Set<string>()
    
    for (const pairing of allPossibleMatches) {
      const matchupKey = `${pairing.p1.id}-${pairing.p2.id}`
      const reverseKey = `${pairing.p2.id}-${pairing.p1.id}`
      
      // Prüfe ob dieses Match bereits existiert oder beide Spieler verfügbar sind
      if (!existingMatchups.has(matchupKey) && 
          !existingMatchups.has(reverseKey) &&
          availablePlayers.some(p => p.id === pairing.p1.id) &&
          availablePlayers.some(p => p.id === pairing.p2.id) &&
          !usedInNewMatches.has(pairing.p1.id) &&
          !usedInNewMatches.has(pairing.p2.id)) {
        
        const newMatch: Match = {
          id: crypto.randomUUID(),
          player1: pairing.p1,
          player2: pairing.p2,
          player1Score: 0,
          player2Score: 0,
          isFinished: false
        }
        
        newMatches.push(newMatch)
        existingMatchups.add(matchupKey)
        usedInNewMatches.add(pairing.p1.id)
        usedInNewMatches.add(pairing.p2.id)
        
        // Nur ein Match pro verfügbarem Spielerpaar erstellen
        break
      }
    }
    
    // Update nur wenn sich etwas geändert hat
    if (newMatches.length !== matches.length) {
      onMatchesUpdate(newMatches)
    }
  }, [players, matches, getEliminatedPlayers, onMatchesUpdate])

  // Berechne Tabelle basierend auf Matches
  useEffect(() => {
    const eliminatedPlayerIds = getEliminatedPlayers();
    
    const newResults: RoundRobinResult[] = players.map(player => ({
      player,
      matches: 0,
      wins: 0,
      losses: 0,
      points: 0,
      position: 0,
      isEliminated: eliminatedPlayerIds.includes(player.id)
    }))

    matches.forEach(match => {
      if (match.isFinished) {
        const player1Result = newResults.find(r => r.player.id === match.player1.id)!
        const player2Result = newResults.find(r => r.player.id === match.player2.id)!

        player1Result.matches++
        player2Result.matches++

        if (match.winner?.id === match.player1.id) {
          player1Result.wins++
          player1Result.points += 1 // 1 Punkt pro BO3-Sieg
          player2Result.losses++
        } else if (match.winner?.id === match.player2.id) {
          player2Result.wins++
          player2Result.points += 1
          player1Result.losses++
        }
      }
    })

    // Sortiere: Aktive Spieler zuerst (nach Punkten), dann eliminierte Spieler
    newResults.sort((a, b) => {
      if (a.isEliminated !== b.isEliminated) {
        return a.isEliminated ? 1 : -1; // Nicht-eliminierte zuerst
      }
      if (b.points !== a.points) return b.points - a.points
      return b.wins - a.wins
    })

    // Setze Positionen
    newResults.forEach((result, index) => {
      result.position = index + 1
    })

    setResults(newResults)
  }, [matches, players, getEliminatedPlayers])

  const updateMatchScore = (matchId: string, player1Score: number, player2Score: number) => {
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        const maxScore = settings.format === 'best-of-3' ? 2 : 3
        const isFinished = player1Score >= maxScore || player2Score >= maxScore
        
        return {
          ...match,
          player1Score,
          player2Score,
          isFinished,
          winner: isFinished 
            ? (player1Score > player2Score ? match.player1 : match.player2)
            : undefined
        }
      }
      return match
    })
    
    onMatchesUpdate(updatedMatches)
  }

  const finishedMatches = matches.filter(m => m.isFinished).length
  const totalMatches = matches.length

  // Hilfsfunktionen für intelligente Match-Verwaltung
//  const getActivePlayers = (): string[] => {
//    const eliminatedPlayers = getEliminatedPlayers()
//    return players.filter(p => !eliminatedPlayers.includes(p.id)).map(p => p.id)
//  }
//
//  const getPlayersInCurrentMatches = (): string[] => {
//    const currentMatches = matches.filter(m => !m.isFinished)
//    const playersInMatches: string[] = []
//    
//    currentMatches.forEach(match => {
//      playersInMatches.push(match.player1.id, match.player2.id)
//    })
//    
//    return playersInMatches
//  }

  const getCurrentMatches = (): Match[] => {
    return matches.filter(m => !m.isFinished)
  }

  const getCompletedMatches = (): Match[] => {
    return matches.filter(m => m.isFinished)
  }

  const incrementScore = (matchId: string, playerId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match || match.isFinished) return

    const maxScore = settings.format === 'best-of-3' ? 2 : 3
    const isPlayer1 = match.player1.id === playerId
    const currentScore = isPlayer1 ? match.player1Score : match.player2Score
    
    if (currentScore < maxScore) {
      const newPlayer1Score = isPlayer1 ? currentScore + 1 : match.player1Score
      const newPlayer2Score = !isPlayer1 ? currentScore + 1 : match.player2Score
      updateMatchScore(matchId, newPlayer1Score, newPlayer2Score)
    }
  }

  const decrementScore = (matchId: string, playerId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match || match.isFinished) return

    const isPlayer1 = match.player1.id === playerId
    const currentScore = isPlayer1 ? match.player1Score : match.player2Score
    
    if (currentScore > 0) {
      const newPlayer1Score = isPlayer1 ? currentScore - 1 : match.player1Score
      const newPlayer2Score = !isPlayer1 ? currentScore - 1 : match.player2Score
      updateMatchScore(matchId, newPlayer1Score, newPlayer2Score)
    }
  }
  const handleSvgScoreUpdate: ScoreUpdateHandler = (matchId, playerId, increment) => {
    if (increment) {
      incrementScore(matchId, playerId)
    } else {
      decrementScore(matchId, playerId)
    }
  }

  const currentMatchesList = getCurrentMatches()
  const completedMatchesList = getCompletedMatches()

  return (
    <Card maxW="7xl" mx="auto" shadow="2xl" bg="rgba(15,23,42,0.95)" color="white" borderWidth={1} borderColor="cyan.500" borderRadius="3xl">
      <CardHeader bg="blackAlpha.600" borderTopRadius="3xl" borderBottomWidth={1} borderColor="cyan.500">
  <HStack justify="space-between" align="center">
    <HStack spacing={3}>
      <Icon as={FaListUl} boxSize={6} color="cyan.300" />
      <VStack align="flex-start" spacing={0}>
        <Heading size="md">Round Robin Matrix</Heading>
        <Text fontSize="sm" color="whiteAlpha.700">
          Jeder-gegen-Jeden Übersicht
        </Text>
      </VStack>
    </HStack>
    <HStack spacing={4}>
      <Badge colorScheme="cyan" borderRadius="full" px={4} py={1}>
        Fortschritt {finishedMatches}/{totalMatches}
      </Badge>
      <Progress
        value={totalMatches === 0 ? 0 : (finishedMatches / totalMatches) * 100}
        w="200px"
        colorScheme="cyan"
        bg="whiteAlpha.200"
        borderRadius="full"
      />
    </HStack>
  </HStack>
</CardHeader>

      <CardBody p={0}>
        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            <Tab fontWeight="semibold">🎯 Spiele</Tab>
            <Tab fontWeight="semibold">📊 Tabelle</Tab>
          </TabList>

          <TabPanels>
            {/* Spiele Tab */}
            <TabPanel p={6}>
              <VStack spacing={6} align="stretch">
                {/* Aktuelle Matches */}
                <Box>
                  <Heading size="md" mb={4} color="cyan.200">
                    🎯 Aktuelle Matches
                  </Heading>
                  {currentMatchesList.length > 0 ? (
                    <Box
                      bg={NEON_COLORS.panelBg}
                      borderWidth={1}
                      borderColor={NEON_COLORS.border}
                      borderRadius="2xl"
                      p={4}
                      boxShadow="lg"
                      overflowX="auto"
                    >
                      <Box minH="380px">
                        <SvgRoundRobinBoard
                          matches={currentMatchesList}
                          columns={Math.min(3, currentMatchesList.length)}
                          allowEditing
                          onScoreUpdate={handleSvgScoreUpdate}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Card bg="green.50" borderColor="green.200" borderWidth={2}>
                      <CardBody p={6} textAlign="center">
                        <VStack spacing={3}>
                          <Text fontSize="2xl">🎉</Text>
                          <Text fontWeight="bold" color="green.700">
                            Alle Matches beendet!
                          </Text>
                          <Text color="green.600">
                            Das Round-Robin Turnier ist abgeschlossen.
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </Box>

                {/* Abgeschlossene Matches */}
                {completedMatchesList.length > 0 && (
                  <Box>
                    <Heading size="md" mb={4} color="purple.200">
                      ? Abgeschlossene Matches ({completedMatchesList.length})
                    </Heading>
                    <Box
                      bg={NEON_COLORS.panelBg}
                      borderWidth={1}
                      borderColor={NEON_COLORS.border}
                      borderRadius="2xl"
                      p={4}
                      boxShadow="lg"
                      overflowX="auto"
                    >
                      <Box minH="320px">
                        <SvgRoundRobinBoard
                          matches={completedMatchesList}
                          columns={Math.min(4, Math.max(1, completedMatchesList.length))}
                          allowEditing={false}
                          onScoreUpdate={handleSvgScoreUpdate}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}

                {matches.length === 0 && (
                  <Center py={12}>
                    <Text color="gray.500" fontSize="lg">
                      Keine Spiele verfügbar
                    </Text>
                  </Center>
                )}
              </VStack>
            </TabPanel>

            {/* Tabelle Tab */}
            <TabPanel p={6}>
              <Table variant="simple" size="lg">
                <Thead>
                  <Tr bg="gray.50">
                    <Th color="blue.800" fontWeight="bold">Pos.</Th>
                    <Th color="blue.800" fontWeight="bold">Spieler</Th>
                    <Th color="blue.800" fontWeight="bold" isNumeric>Spiele</Th>
                    <Th color="blue.800" fontWeight="bold" isNumeric>Siege</Th>
                    <Th color="blue.800" fontWeight="bold" isNumeric>Niederlagen</Th>
                    <Th color="blue.800" fontWeight="bold" isNumeric>Punkte</Th>
                    <Th color="blue.800" fontWeight="bold">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {results.map((result) => (
                    <Tr key={result.player.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <HStack>
                          <Text fontSize="lg">
                            {result.position === 1 ? '🥇' : 
                             result.position === 2 ? '🥈' : 
                             result.position === 3 ? '🥉' : 
                             result.position}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontWeight="semibold" color="blue.800">
                          {result.player.name}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text color="blue.700">{result.matches}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text color="green.600" fontWeight="semibold">
                          {result.wins}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text color="red.500" fontWeight="semibold">
                          {result.losses}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                          {result.points}
                        </Badge>
                      </Td>
                      <Td>
                        {result.isEliminated ? (
                          <Badge colorScheme="red" fontSize="sm" px={2} py={1} borderRadius="md">
                            ❌ Ausgeschieden
                          </Badge>
                        ) : (
                          <Badge colorScheme="green" fontSize="sm" px={2} py={1} borderRadius="md">
                            ✅ Aktiv
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {results.length === 0 && (
                <Center py={12}>
                  <Text color="gray.500" fontSize="lg">
                    Keine Ergebnisse verfügbar
                  </Text>
                </Center>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Action Buttons */}
        <Center p={6} bg="gray.50">
          <Button
            leftIcon={<ArrowBackIcon />}
            colorScheme="blue"
            variant="outline"
            size="lg"
            onClick={onBack}
          >
            Neue Einstellungen
          </Button>
        </Center>
      </CardBody>
    </Card>
  )
}

export default RoundRobinTable


