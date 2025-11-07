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
  IconButton,

} from '@chakra-ui/react'
import { ArrowBackIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import type { Player, Match, TournamentSettings, RoundRobinResult } from '../types'

interface RoundRobinTableProps {
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  onMatchesUpdate: (matches: Match[]) => void
  onBack: () => void
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

  const renderMatchCard = (match: Match) => {
    const eliminatedPlayers = getEliminatedPlayers();
    const isPlayer1Eliminated = eliminatedPlayers.includes(match.player1.id);
    const isPlayer2Eliminated = eliminatedPlayers.includes(match.player2.id);
    
    return (
      <Card key={match.id} mb={4} borderRadius="lg" shadow="md" bg="white">
        <CardBody p={4}>
          <VStack spacing={4}>
            {/* Match Header */}
            <HStack justify="space-between" w="100%" alignItems="center">
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                Aktuelles Match
              </Badge>
              {match.isFinished && (
                <Badge colorScheme="green" fontSize="sm">✓ Beendet</Badge>
              )}
            </HStack>

            {/* Players Section with Arrow Controls */}
            <HStack spacing={8} w="100%" justify="center" alignItems="center">
              {/* Player 1 */}
              <VStack spacing={3} flex={1}>
                <VStack spacing={1}>
                  <Text 
                    fontSize="xl" 
                    fontWeight="bold" 
                    color={match.winner?.id === match.player1.id ? "green.600" : "blue.800"}
                    textAlign="center"
                  >
                    {match.player1.name}
                  </Text>
                  {isPlayer1Eliminated && (
                    <Badge colorScheme="red" fontSize="xs">
                      ❌ Ausgeschieden
                    </Badge>
                  )}
                </VStack>
                
                {/* Score Display with Arrow Controls */}
                <VStack spacing={2}>
                  <IconButton
                    aria-label="Erhöhe Score"
                    icon={<ChevronUpIcon />}
                    size="sm"
                    colorScheme="green"
                    isDisabled={match.isFinished || match.player1Score >= (settings.format === 'best-of-3' ? 2 : 3)}
                    onClick={() => incrementScore(match.id, match.player1.id)}
                  />
                  
                  <Box 
                    bg={match.winner?.id === match.player1.id ? "green.100" : "blue.50"}
                    p={3} 
                    borderRadius="lg" 
                    minW="60px" 
                    textAlign="center"
                    borderWidth={2}
                    borderColor={match.winner?.id === match.player1.id ? "green.400" : "blue.200"}
                  >
                    <Text fontSize="2xl" fontWeight="bold" 
                      color={match.winner?.id === match.player1.id ? "green.700" : "blue.700"}>
                      {match.player1Score}
                    </Text>
                  </Box>
                  
                  <IconButton
                    aria-label="Verringere Score"
                    icon={<ChevronDownIcon />}
                    size="sm"
                    colorScheme="red"
                    isDisabled={match.isFinished || match.player1Score <= 0}
                    onClick={() => decrementScore(match.id, match.player1.id)}
                  />
                </VStack>
              </VStack>

              {/* VS Separator */}
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.500">
                  VS
                </Text>
                <Badge colorScheme="purple" px={2} py={1}>
                  {settings.format === 'best-of-3' ? 'BO3' : 'BO5'}
                </Badge>
              </VStack>

              {/* Player 2 */}
              <VStack spacing={3} flex={1}>
                <VStack spacing={1}>
                  <Text 
                    fontSize="xl" 
                    fontWeight="bold" 
                    color={match.winner?.id === match.player2.id ? "green.600" : "blue.800"}
                    textAlign="center"
                  >
                    {match.player2.name}
                  </Text>
                  {isPlayer2Eliminated && (
                    <Badge colorScheme="red" fontSize="xs">
                      ❌ Eliminiert
                    </Badge>
                  )}
                </VStack>
                
                {/* Score Display with Arrow Controls */}
                <VStack spacing={2}>
                  <IconButton
                    aria-label="Erhöhe Score"
                    icon={<ChevronUpIcon />}
                    size="sm"
                    colorScheme="green"
                    isDisabled={match.isFinished || match.player2Score >= (settings.format === 'best-of-3' ? 2 : 3)}
                    onClick={() => incrementScore(match.id, match.player2.id)}
                  />
                  
                  <Box 
                    bg={match.winner?.id === match.player2.id ? "green.100" : "blue.50"}
                    p={3} 
                    borderRadius="lg" 
                    minW="60px" 
                    textAlign="center"
                    borderWidth={2}
                    borderColor={match.winner?.id === match.player2.id ? "green.400" : "blue.200"}
                  >
                    <Text fontSize="2xl" fontWeight="bold" 
                      color={match.winner?.id === match.player2.id ? "green.700" : "blue.700"}>
                      {match.player2Score}
                    </Text>
                  </Box>
                  
                  <IconButton
                    aria-label="Verringere Score"
                    icon={<ChevronDownIcon />}
                    size="sm"
                    colorScheme="red"
                    isDisabled={match.isFinished || match.player2Score <= 0}
                    onClick={() => decrementScore(match.id, match.player2.id)}
                  />
                </VStack>
              </VStack>
            </HStack>

            {/* Winner Display */}
            {match.isFinished && match.winner && (
              <Box textAlign="center" p={4} bg="green.50" borderRadius="lg" w="100%" borderWidth={2} borderColor="green.300">
                <HStack justify="center" spacing={2}>
                  <Text fontSize="lg" color="green.700">🏆</Text>
                  <Text color="green.700" fontWeight="bold" fontSize="lg">
                    Sieger: {match.winner.name}
                  </Text>
                  <Text fontSize="lg" color="green.700">🏆</Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    )
  }

  const renderCompletedMatch = (match: Match, index: number) => (
    <HStack key={match.id} justify="space-between" p={3} bg="gray.50" borderRadius="md" mb={2}>
      <HStack spacing={4}>
        <Text fontSize="sm" color="gray.600">#{index + 1}</Text>
        <HStack spacing={3}>
          <Text fontWeight="semibold" color={match.winner?.id === match.player1.id ? "green.600" : "gray.600"}>
            {match.player1.name}
          </Text>
          <Badge size="sm" colorScheme={match.winner?.id === match.player1.id ? "green" : "gray"}>
            {match.player1Score}
          </Badge>
        </HStack>
        <Text color="gray.500">vs</Text>
        <HStack spacing={3}>
          <Badge size="sm" colorScheme={match.winner?.id === match.player2.id ? "green" : "gray"}>
            {match.player2Score}
          </Badge>
          <Text fontWeight="semibold" color={match.winner?.id === match.player2.id ? "green.600" : "gray.600"}>
            {match.player2.name}
          </Text>
        </HStack>
      </HStack>
      <Badge colorScheme="green" fontSize="xs">
        🏆 {match.winner?.name}
      </Badge>
    </HStack>
  )

  return (
    <Card maxW="6xl" mx="auto" shadow="2xl">
      <CardHeader bg="blue.500" color="white" borderTopRadius="xl">
        <VStack spacing={4}>
          <Heading size="lg" textAlign="center">
            🏆 Gruppensystem - Jeder gegen Jeden
          </Heading>
          <HStack spacing={4} alignItems="center">
            <Text>Fortschritt: {finishedMatches}/{totalMatches} Spiele</Text>
            <Progress 
              value={(finishedMatches / totalMatches) * 100} 
              w="200px" 
              colorScheme="orange"
              bg="whiteAlpha.300"
              borderRadius="full"
            />
          </HStack>
        </VStack>
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
                  <Heading size="md" mb={4} color="blue.700">
                    🎯 Aktuelle Matches
                  </Heading>
                  {getCurrentMatches().length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {getCurrentMatches().map((match) => renderMatchCard(match))}
                    </VStack>
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
                {getCompletedMatches().length > 0 && (
                  <Box>
                    <Heading size="md" mb={4} color="gray.600">
                      ✅ Abgeschlossene Matches ({getCompletedMatches().length})
                    </Heading>
                    <Card bg="gray.50">
                      <CardBody p={4}>
                        <VStack spacing={2} align="stretch">
                          {getCompletedMatches().map((match, index) => renderCompletedMatch(match, index))}
                        </VStack>
                      </CardBody>
                    </Card>
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
                            ❌ Eliminiert
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