import {
  Box,
  Container,
  VStack,
  Heading,
  HStack,
  Badge,
  useColorModeValue,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import PlayerManagement from './components/PlayerManagement'
import TournamentSettingsComponent from './components/TournamentSettings'
import SeedingSelection from './components/SeedingSelection'
import RoundRobinTable from './components/RoundRobinTable'
import KnockoutMatrix from './components/KnockoutMatrix'
import { useTournamentState } from './hooks/useTournamentState'

function App() {
  const { isOpen: isRestartModalOpen, onOpen: onRestartModalOpen, onClose: onRestartModalClose } = useDisclosure()
  const {
    currentPhase,
    players,
    settings: tournamentSettings,
    matches,
    showCacheAlert,
    setPlayers,
    setSettings: setTournamentSettings,
    setMatches,
    handlePlayersConfirm,
    handleSettingsConfirm,
    handleSeedingConfirm,
    handleBackToPlayerManagement,
    handleBackToSettings,
    loadCachedTournament,
    startNewTournament,
    dismissCacheAlert
  } = useTournamentState()
  const tournamentName = 'Dart Turnier'

  const handleRestartConfirmation = () => {
    startNewTournament()
    onRestartModalClose()
  }

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'player-management':
        return (
          <PlayerManagement 
            players={players}
            onPlayersChange={setPlayers}
            onConfirm={handlePlayersConfirm}
          />
        )
      
      case 'settings':
        return (
          <TournamentSettingsComponent
            settings={tournamentSettings}
            onSettingsChange={setTournamentSettings}
            onConfirm={handleSettingsConfirm}
            onBack={handleBackToPlayerManagement}
          />
        )
      
      case 'seeding':
        return (
          <SeedingSelection
            players={players}
            onConfirm={handleSeedingConfirm}
            onBack={handleBackToSettings}
          />
        )
      
      case 'tournament':
        if (tournamentSettings.hasPointsRound) {
          return (
            <RoundRobinTable
              players={players}
              settings={tournamentSettings}
              matches={matches}
              onMatchesUpdate={setMatches}
              onBack={handleBackToSettings}
            />
          )
        } else {
          return (
            <KnockoutMatrix
              players={players}
              settings={tournamentSettings}
              matches={matches}
              onMatchesUpdate={setMatches}
              onBack={handleBackToSettings}
            />
          )
        }
      
      default:
        return <div>Unbekannte Phase</div>
    }
  }

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.600, purple.600)', 
    'linear(to-br, blue.800, purple.800)'
  )

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <VStack spacing={0} minH="100vh">
        {/* Header */}
        <Box
          w="100%"
          bg="rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          py={4}
          px={8}
        >
          <VStack spacing={4}>
            <Heading
              size="2xl"
              color="white"
              textAlign="center"
              textShadow="2px 2px 4px rgba(0, 0, 0, 0.3)"
            >
              🎯 {tournamentName}
            </Heading>
            
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Badge
                colorScheme={currentPhase === 'player-management' ? 'green' : 'gray'}
                variant={currentPhase === 'player-management' ? 'solid' : 'outline'}
                px={4}
                py={2}
                borderRadius="full"
                color={currentPhase === 'player-management' ? 'white' : 'whiteAlpha.700'}
              >
                Spieler
              </Badge>
              
              <Badge
                colorScheme={currentPhase === 'settings' ? 'green' : 'gray'}
                variant={currentPhase === 'settings' ? 'solid' : 'outline'}
                px={4}
                py={2}
                borderRadius="full"
                color={currentPhase === 'settings' ? 'white' : 'whiteAlpha.700'}
              >
                Einstellungen
              </Badge>
              
              {tournamentSettings.seedingType === 'manual' && (
                <Badge
                  colorScheme={currentPhase === 'seeding' ? 'green' : 'gray'}
                  variant={currentPhase === 'seeding' ? 'solid' : 'outline'}
                  px={4}
                  py={2}
                  borderRadius="full"
                  color={currentPhase === 'seeding' ? 'white' : 'whiteAlpha.700'}
                >
                  Setzung
                </Badge>
              )}
              
              <Badge
                colorScheme={currentPhase === 'tournament' ? 'green' : 'gray'}
                variant={currentPhase === 'tournament' ? 'solid' : 'outline'}
                px={4}
                py={2}
                borderRadius="full"
                color={currentPhase === 'tournament' ? 'white' : 'whiteAlpha.700'}
              >
                Turnier
              </Badge>
            </HStack>
            
            {/* Neustart Button */}
            {currentPhase !== 'player-management' && (
              <Button
                colorScheme="red"
                variant="outline"
                size="sm"
                onClick={onRestartModalOpen}
                color="white"
                borderColor="red.300"
                _hover={{ bg: 'red.500', borderColor: 'red.500' }}
              >
                🔄 Neues Turnier starten
              </Button>
            )}
          </VStack>
        </Box>
        
        {/* Cache Alert */}
        {showCacheAlert && (
          <Box w="100%" px={8} py={4}>
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="lg" mr={2}>
                  Gespeichertes Turnier gefunden!
                </AlertTitle>
                <AlertDescription display="block">
                  Möchten Sie das letzte Turnier fortsetzen oder ein neues starten?
                </AlertDescription>
              </Box>
              <HStack spacing={2}>
                <Button size="sm" colorScheme="blue" onClick={loadCachedTournament}>
                  Fortsetzen
                </Button>
                <Button size="sm" variant="outline" onClick={dismissCacheAlert}>
                  Neu starten
                </Button>
              </HStack>
              <CloseButton
                position="absolute"
                right="8px"
                top="8px"
                onClick={dismissCacheAlert}
              />
            </Alert>
          </Box>
        )}
        
        {/* Main Content */}
        <Container maxW="8xl" flex={1} py={8}>
          {renderCurrentPhase()}
        </Container>
      </VStack>
      
      {/* Neustart Bestätigung Modal */}
      <Modal isOpen={isRestartModalOpen} onClose={onRestartModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Neues Turnier starten</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box textAlign="center">
                <Heading size="md" mb={2}>⚠️ Achtung</Heading>
                <p>
                  Sind Sie sicher, dass Sie ein neues Turnier starten möchten?
                </p>
                <p>
                  <strong>Alle aktuellen Daten gehen verloren!</strong>
                </p>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRestartModalClose}>
              Abbrechen
            </Button>
            <Button colorScheme="red" onClick={handleRestartConfirmation}>
              Ja, neu starten
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default App
