import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon, UpDownIcon, RepeatIcon } from '@chakra-ui/icons'
import type { Player } from '../types'

interface SeedingSelectionProps {
  players: Player[]
  onConfirm: (seededPlayers: Player[]) => void
  onBack: () => void
}

const SeedingSelection = ({ players, onConfirm, onBack }: SeedingSelectionProps) => {
  const [seededPlayers, setSeededPlayers] = useState<Player[]>([])

  useEffect(() => {
    // Initiale Setzung basierend auf der aktuellen Reihenfolge
    const initialSeeding = players.map((player, index) => ({
      ...player,
      seed: index + 1
    }))
    setSeededPlayers(initialSeeding)
  }, [players])

  const movePlayerUp = (index: number) => {
    if (index === 0) return
    
    const newSeededPlayers = [...seededPlayers]
    const temp = newSeededPlayers[index]
    newSeededPlayers[index] = newSeededPlayers[index - 1]
    newSeededPlayers[index - 1] = temp
    
    // Seeds aktualisieren
    newSeededPlayers.forEach((player, i) => {
      player.seed = i + 1
    })
    
    setSeededPlayers(newSeededPlayers)
  }

  const movePlayerDown = (index: number) => {
    if (index === seededPlayers.length - 1) return
    
    const newSeededPlayers = [...seededPlayers]
    const temp = newSeededPlayers[index]
    newSeededPlayers[index] = newSeededPlayers[index + 1]
    newSeededPlayers[index + 1] = temp
    
    // Seeds aktualisieren
    newSeededPlayers.forEach((player, i) => {
      player.seed = i + 1
    })
    
    setSeededPlayers(newSeededPlayers)
  }

  const randomizePlayers = () => {
    const shuffled = [...seededPlayers].sort(() => Math.random() - 0.5)
    shuffled.forEach((player, i) => {
      player.seed = i + 1
    })
    setSeededPlayers(shuffled)
  }

  const handleConfirm = () => {
    onConfirm(seededPlayers)
  }

  return (
    <Card maxW="4xl" mx="auto" shadow="2xl">
      <CardHeader>
        <VStack spacing={4}>
          <Heading size="lg" textAlign="center" color="gray.700">
            Spieler-Setzung
          </Heading>
          <Text textAlign="center" color="gray.600" fontSize="lg">
            Bestimme die Reihenfolge der Spieler. Spieler #1 ist der beste gesetzt.
          </Text>
        </VStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6}>
          
          {/* Randomize Button */}
          <Button
            onClick={randomizePlayers}
            colorScheme="orange"
            variant="outline"
            leftIcon={<RepeatIcon />}
            size="lg"
          >
            🎲 Zufällig mischen
          </Button>

          <Divider />

          {/* Seeded Players List */}
          <Box w="100%">
            <VStack spacing={3}>
              {seededPlayers.map((player, index) => (
                <Flex
                  key={player.id}
                  align="center"
                  w="100%"
                  p={4}
                  bg={index < 3 ? (index === 0 ? 'yellow.50' : index === 1 ? 'gray.50' : 'orange.50') : 'gray.50'}
                  borderRadius="lg"
                  borderLeft="4px solid"
                  borderLeftColor={index < 3 ? (index === 0 ? 'yellow.400' : index === 1 ? 'gray.400' : 'orange.400') : 'blue.400'}
                  _hover={{ bg: index < 3 ? (index === 0 ? 'yellow.100' : index === 1 ? 'gray.100' : 'orange.100') : 'gray.100' }}
                  transition="background-color 0.2s"
                >
                  <Badge
                    colorScheme={index < 3 ? (index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange') : 'blue'}
                    fontSize="lg"
                    px={4}
                    py={2}
                    borderRadius="full"
                    mr={4}
                  >
                    #{player.seed}
                    {index === 0 && ' 🥇'}
                    {index === 1 && ' 🥈'}
                    {index === 2 && ' 🥉'}
                  </Badge>
                  
                  <Text flex={1} fontSize="lg" fontWeight="semibold" color="gray.700">
                    {player.name}
                  </Text>

                  <VStack spacing={1}>
                    <IconButton
                      onClick={() => movePlayerUp(index)}
                      isDisabled={index === 0}
                      aria-label="Nach oben bewegen"
                      icon={<UpDownIcon transform="rotate(180deg)" />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                    <IconButton
                      onClick={() => movePlayerDown(index)}
                      isDisabled={index === seededPlayers.length - 1}
                      aria-label="Nach unten bewegen"
                      icon={<UpDownIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </VStack>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Divider />

          {/* Info Box */}
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" mb={3} fontSize="lg">
                ℹ️ Setzung-Hinweise:
              </Text>
              <List spacing={2} fontSize="sm">
                <ListItem>• Spieler #1 ist der beste/stärkste Spieler</ListItem>
                <ListItem>• Die Setzung beeinflusst die Paarungen im Turnier</ListItem>
                <ListItem>• Bei KO-Turnieren treffen sich die besten Spieler erst später</ListItem>
                <ListItem>• Verwende die Pfeile um die Reihenfolge zu ändern</ListItem>
              </List>
            </Box>
          </Alert>

          {/* Action Buttons */}
          <HStack spacing={4} pt={4}>
            <Button
              onClick={onBack}
              variant="outline"
              colorScheme="gray"
              size="lg"
              leftIcon={<ArrowBackIcon />}
              px={8}
            >
              Zurück zu Einstellungen
            </Button>
            <Button
              onClick={handleConfirm}
              colorScheme="green"
              size="lg"
              rightIcon={<ArrowForwardIcon />}
              px={8}
              fontWeight="bold"
            >
              Turnier starten
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default SeedingSelection