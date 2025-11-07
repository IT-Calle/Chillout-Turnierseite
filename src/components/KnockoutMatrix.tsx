import React, { useCallback } from 'react'
import { Box, Heading, Button, HStack, VStack, Text, Badge, Icon } from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'
import { FaTrophy, FaFire } from 'react-icons/fa'
import type { Player, Match, TournamentSettings } from '../types'
import { useTournamentLogic } from '../hooks/useTournamentLogic'
import SvgKnockoutRenderer from './SvgKnockoutRenderer'

interface KnockoutMatrixProps {
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  onMatchesUpdate: (matches: Match[]) => void
  onBack: () => void
  isReadOnly?: boolean
  onShareScoreboard?: () => void
}

const KnockoutMatrix: React.FC<KnockoutMatrixProps> = ({
  players,
  settings,
  matches,
  onMatchesUpdate,
  onBack,
  isReadOnly = false,
  onShareScoreboard
}) => {
  const { rounds, currentRound, champion, updateMatchScore, getRoundName } = useTournamentLogic({
    players,
    settings,
    matches,
    onMatchesUpdate
  })

  const handleScoreUpdate = useCallback(
    (matchId: string, playerId: string, increment: boolean) => {
      if (isReadOnly) {
        return
      }
      updateMatchScore(matchId, playerId, increment)
    },
    [isReadOnly, updateMatchScore]
  )

  return (
    <Box w="full" h="100vh" bg="gray.900" position="relative" overflow="hidden">
      <HStack
        position="absolute"
        top={4}
        left={4}
        right={4}
        justify="space-between"
        zIndex={20}
        bg="blackAlpha.700"
        backdropFilter="blur(10px)"
        borderRadius="lg"
        p={4}
      >
        <HStack spacing={3}>
          <Icon as={FaTrophy} boxSize={6} color="white" />
          <Heading size="md" color="white">
            KO-Turnier Matrix
          </Heading>
        </HStack>

        {champion ? (
          <Badge colorScheme="green" fontSize="lg" px={4} py={2}>
            🏆 Champion: {champion.name}
          </Badge>
        ) : (
          <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
            Runde: {getRoundName(currentRound)}
          </Badge>
        )}

        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.300">
            {isReadOnly ? 'Geteilte Ansicht · Änderungen deaktiviert' : 'Pfeiltasten: Score · WASD: Match wählen'}
          </Text>
          {onShareScoreboard && (
            <Button
              leftIcon={<LinkIcon />}
              variant="outline"
              size="sm"
              colorScheme="cyan"
              onClick={onShareScoreboard}
            >
              Scoreboard teilen
            </Button>
          )}
          {!isReadOnly && (
            <Button onClick={onBack} colorScheme="orange" size="sm">
              Zurück
            </Button>
          )}
        </HStack>
      </HStack>

      <Box w="full" h="full">
        <SvgKnockoutRenderer
          rounds={rounds}
          currentRound={currentRound}
          onScoreUpdate={handleScoreUpdate}
          getRoundName={getRoundName}
          interactive={!isReadOnly}
        />

        {rounds.length === 0 && (
          <VStack
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            spacing={4}
            textAlign="center"
            zIndex={30}
          >
            <Icon as={FaFire} boxSize={16} color="orange.500" />
            <Text fontSize="xl" color="white" fontWeight="bold">
              Turnier wird geladen...
            </Text>
            <Text fontSize="sm" color="gray.400">
              Spieler: {players.length} | Runden: {rounds.length}
            </Text>
          </VStack>
        )}

        <Text
          position="absolute"
          top="96px"
          left="20px"
          color="whiteAlpha.700"
          fontSize="xs"
          zIndex={25}
        >
          rounds={rounds.length} • players={players.length}
        </Text>
      </Box>
    </Box>
  )
}

export default KnockoutMatrix
