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
  NumberInput,
  NumberInputField,
  Divider,
  Center,
} from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
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

  // Generiere alle Matches für Round-Robin
  useEffect(() => {
    if (matches.length === 0) {
      const newMatches: Match[] = []
      
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const match: Match = {
            id: crypto.randomUUID(),
            player1: players[i],
            player2: players[j],
            player1Score: 0,
            player2Score: 0,
            isFinished: false
          }
          newMatches.push(match)
        }
      }
      
      onMatchesUpdate(newMatches)
    }
  }, [players, matches.length, onMatchesUpdate])

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
  const isComplete = finishedMatches === totalMatches

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
              Round of 16
            </Badge>
            {match.isFinished && (
              <Badge colorScheme="green" fontSize="sm">✓ Finished</Badge>
            )}
          </HStack>

          {/* Players Section */}
          <HStack spacing={8} w="100%" justify="center" alignItems="center">
            {/* Player 1 */}
            <VStack spacing={2} flex={1}>
              <VStack spacing={1}>
                <Text 
                  fontSize="lg" 
                  fontWeight="semibold" 
                  color={match.winner?.id === match.player1.id ? "green.600" : "blue.800"}
                  textAlign="center"
                >
                  {match.player1.name}
                </Text>
                {isPlayer1Eliminated && (
                  <Badge colorScheme="red" fontSize="xs">
                    ❌ Eliminiert
                  </Badge>
                )}
              </VStack>
              <NumberInput
                value={match.player1Score}
                min={0}
                max={settings.format === 'best-of-3' ? 2 : 3}
                isDisabled={match.isFinished}
                size="lg"
                w="80px"
              >
                <NumberInputField
                  textAlign="center"
                  fontSize="2xl"
                  fontWeight="bold"
                  color={match.winner?.id === match.player1.id ? "green.600" : "blue.800"}
                  onChange={(e) => updateMatchScore(match.id, parseInt(e.target.value) || 0, match.player2Score)}
                />
              </NumberInput>
            </VStack>

            {/* VS Separator */}
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color="gray.500">VS</Text>
              <Text fontSize="sm" color="gray.400">-</Text>
            </VStack>

            {/* Player 2 */}
            <VStack spacing={2} flex={1}>
              <VStack spacing={1}>
                <Text 
                  fontSize="lg" 
                  fontWeight="semibold" 
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
              <NumberInput
                value={match.player2Score}
                min={0}
                max={settings.format === 'best-of-3' ? 2 : 3}
                isDisabled={match.isFinished}
                size="lg"
                w="80px"
              >
                <NumberInputField
                  textAlign="center"
                  fontSize="2xl"
                  fontWeight="bold"
                  color={match.winner?.id === match.player2.id ? "green.600" : "blue.800"}
                  onChange={(e) => updateMatchScore(match.id, match.player1Score, parseInt(e.target.value) || 0)}
                />
              </NumberInput>
            </VStack>
          </HStack>

          {/* Match Result */}
          {match.isFinished && match.winner && (
            <Box textAlign="center" p={2} bg="green.50" borderRadius="md" w="100%">
              <Text fontSize="sm" color="green.600" fontWeight="semibold">
                🏆 Sieger: {match.winner.name}
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
  }

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
              colorScheme="green"
              bg="whiteAlpha.300"
              borderRadius="full"
            />
          </HStack>
        </VStack>
      </CardHeader>
      
      <CardBody>
        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            <Tab fontWeight="semibold">🎯 Spiele</Tab>
            <Tab fontWeight="semibold">📊 Tabelle</Tab>
          </TabList>

          <TabPanels>
            {/* Spiele Tab */}
            <TabPanel p={6}>
              <VStack spacing={4} align="stretch">
                {matches
                  .filter(match => {
                    const eliminatedPlayers = getEliminatedPlayers();
                    const isPlayer1Eliminated = eliminatedPlayers.includes(match.player1.id);
                    const isPlayer2Eliminated = eliminatedPlayers.includes(match.player2.id);
                    // Zeige Match nur wenn mindestens ein Spieler noch aktiv ist
                    return !(isPlayer1Eliminated && isPlayer2Eliminated);
                  })
                  .map((match) => renderMatchCard(match))}
                
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

        {/* Tournament Complete */}
        {isComplete && (
          <Box mt={8} p={6} bg="green.50" borderRadius="lg" border="2px solid" borderColor="green.200">
            <VStack spacing={4}>
              <Heading size="md" color="green.700">🏆 Turnier beendet!</Heading>
              <HStack spacing={4} alignItems="center">
                <Text fontSize="3xl">🥇</Text>
                <VStack spacing={1}>
                  <Text fontSize="xl" fontWeight="bold" color="green.700">
                    {results[0]?.player.name}
                  </Text>
                  <Text color="green.600">
                    {results[0]?.points} Punkte
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        )}

        <Divider my={6} />

        {/* Back Button */}
        <Center>
          <Button
            onClick={onBack}
            variant="outline"
            colorScheme="gray"
            leftIcon={<ArrowBackIcon />}
            size="lg"
          >
            Neue Einstellungen
          </Button>
        </Center>
      </CardBody>
    </Card>
  )
}

export default RoundRobinTable