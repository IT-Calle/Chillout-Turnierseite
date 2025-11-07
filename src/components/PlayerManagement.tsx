import { useState } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  List,
  ListItem,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton,
  Flex,
  Badge,

  Divider,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons'
import type { Player } from '../types'

interface PlayerManagementProps {
  players: Player[]
  onPlayersChange: (players: Player[]) => void
  onConfirm: (players: Player[]) => void
}

const PlayerManagement = ({ players, onPlayersChange, onConfirm }: PlayerManagementProps) => {
  const [newPlayerName, setNewPlayerName] = useState('')
  const [error, setError] = useState('')

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      setError('Bitte einen Spielernamen eingeben')
      return
    }

    if (players.some(player => player.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      setError('Dieser Spielername existiert bereits')
      return
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim()
    }

    const updatedPlayers = [...players, newPlayer]
    onPlayersChange(updatedPlayers)
    setNewPlayerName('')
    setError('')
  }

  const removePlayer = (playerId: string) => {
    const updatedPlayers = players.filter(player => player.id !== playerId)
    onPlayersChange(updatedPlayers)
  }

  const handleConfirm = () => {
    if (players.length < 2) {
      setError('Mindestens 2 Spieler sind erforderlich')
      return
    }
    
    if (players.length > 32) {
      setError('Maximal 32 Spieler sind erlaubt')
      return
    }

    onConfirm(players)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer()
    }
  }

  return (
    <Card maxW="4xl" mx="auto" shadow="2xl">
      <CardHeader>
        <Heading size="lg" textAlign="center" color="gray.700">
          Spieler hinzufügen
        </Heading>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6}>
          {/* Add Player Section */}
          <Box w="100%">
            <VStack spacing={4}>
              <HStack w="100%" spacing={3}>
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Spielername eingeben..."
                  size="lg"
                  variant="filled"
                />
                <Button
                  onClick={addPlayer}
                  colorScheme="green"
                  size="lg"
                  leftIcon={<AddIcon />}
                  px={8}
                >
                  Hinzufügen
                </Button>
              </HStack>
              
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </VStack>
          </Box>

          <Divider />

          {/* Players List */}
          <Box w="100%">
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                Spielerliste
              </Heading>
              <Badge colorScheme="blue" fontSize="lg" px={3} py={1} borderRadius="full">
                {players.length} Spieler
              </Badge>
            </HStack>
            
            {players.length === 0 ? (
              <Box
                textAlign="center"
                py={12}
                bg="gray.50"
                borderRadius="lg"
                border="2px dashed"
                borderColor="gray.200"
              >
                <Text color="gray.500" fontSize="lg">
                  Noch keine Spieler hinzugefügt
                </Text>
              </Box>
            ) : (
              <List spacing={3}>
                {players.map((player, index) => (
                  <ListItem key={player.id}>
                    <Flex
                      align="center"
                      p={4}
                      bg="gray.50"
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderLeftColor="green.400"
                      _hover={{ bg: 'gray.100' }}
                      transition="background-color 0.2s"
                    >
                      <Badge 
                        colorScheme="gray" 
                        mr={4} 
                        fontSize="sm" 
                        px={2} 
                        py={1}
                        borderRadius="md"
                      >
                        {index + 1}
                      </Badge>
                      <Text flex={1} fontSize="lg" fontWeight="medium" color="gray.700">
                        {player.name}
                      </Text>
                      <IconButton
                        onClick={() => removePlayer(player.id)}
                        aria-label="Spieler entfernen"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                      />
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider />

          {/* Action Button */}
          <Button
            onClick={handleConfirm}
            isDisabled={players.length < 2}
            colorScheme="green"
            size="lg"
            px={12}
            py={6}
            fontSize="lg"
            fontWeight="bold"
          >
            Weiter zu Einstellungen
          </Button>

          {/* Info Box */}
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" mb={2}>
                <InfoIcon mr={2} />
                Hinweise:
              </Text>
              <List spacing={1} fontSize="sm">
                <ListItem>• Mindestens 2 Spieler erforderlich</ListItem>
                <ListItem>• Maximal 32 Spieler möglich</ListItem>
                <ListItem>• Spielernamen müssen eindeutig sein</ListItem>
              </List>
            </Box>
          </Alert>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default PlayerManagement