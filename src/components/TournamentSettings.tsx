import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Radio,
  RadioGroup,
  Stack,
  Button,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import type { TournamentSettings } from '../types'

interface TournamentSettingsProps {
  settings: TournamentSettings
  onSettingsChange: (settings: TournamentSettings) => void
  onConfirm: (settings: TournamentSettings) => void
  onBack: () => void
}

const TournamentSettingsComponent = ({ 
  settings, 
  onSettingsChange, 
  onConfirm, 
  onBack 
}: TournamentSettingsProps) => {

  const handleFormatChange = (format: 'best-of-3' | 'best-of-5') => {
    const newSettings = { ...settings, format }
    onSettingsChange(newSettings)
  }

  const handlePointsRoundChange = (hasPointsRound: boolean) => {
    const newSettings = { ...settings, hasPointsRound }
    onSettingsChange(newSettings)
  }

  const handleSeedingChange = (seedingType: 'manual' | 'automatic') => {
    const newSettings = { ...settings, seedingType }
    onSettingsChange(newSettings)
  }

  const handleConfirm = () => {
    onConfirm(settings)
  }

  return (
    <Card maxW="6xl" mx="auto" shadow="2xl">
      <CardHeader>
        <Heading size="lg" textAlign="center" color="gray.700">
          Turnier-Einstellungen
        </Heading>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={8}>
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} w="100%">
            
            {/* Spielformat */}
            <Box>
              <Heading size="md" mb={4} color="gray.700">
                Spielformat
              </Heading>
              <RadioGroup
                value={settings.format}
                onChange={(value) => handleFormatChange(value as 'best-of-3' | 'best-of-5')}
              >
                <Stack spacing={4}>
                  <Box
                    p={4}
                    bg={settings.format === 'best-of-3' ? 'blue.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={settings.format === 'best-of-3' ? 'blue.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: settings.format === 'best-of-3' ? 'blue.100' : 'gray.100' }}
                    onClick={() => handleFormatChange('best-of-3')}
                  >
                    <Radio value="best-of-3" size="lg" colorScheme="blue">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">Best of 3</Text>
                        <Text fontSize="sm" color="gray.600">
                          Erster auf 2 Siege gewinnt
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                  
                  <Box
                    p={4}
                    bg={settings.format === 'best-of-5' ? 'blue.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={settings.format === 'best-of-5' ? 'blue.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: settings.format === 'best-of-5' ? 'blue.100' : 'gray.100' }}
                    onClick={() => handleFormatChange('best-of-5')}
                  >
                    <Radio value="best-of-5" size="lg" colorScheme="blue">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">Best of 5</Text>
                        <Text fontSize="sm" color="gray.600">
                          Erster auf 3 Siege gewinnt
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Turnier-Modus */}
            <Box>
              <Heading size="md" mb={4} color="gray.700">
                Turnier-Modus
              </Heading>
              <RadioGroup
                value={settings.hasPointsRound ? 'round-robin' : 'knockout'}
                onChange={(value) => handlePointsRoundChange(value === 'round-robin')}
              >
                <Stack spacing={4}>
                  <Box
                    p={4}
                    bg={!settings.hasPointsRound ? 'green.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={!settings.hasPointsRound ? 'green.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: !settings.hasPointsRound ? 'green.100' : 'gray.100' }}
                    onClick={() => handlePointsRoundChange(false)}
                  >
                    <Radio value="knockout" size="lg" colorScheme="green">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">KO-System</Text>
                        <Text fontSize="sm" color="gray.600">
                          Klassisches Eliminationsturnier
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                  
                  <Box
                    p={4}
                    bg={settings.hasPointsRound ? 'green.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={settings.hasPointsRound ? 'green.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: settings.hasPointsRound ? 'green.100' : 'gray.100' }}
                    onClick={() => handlePointsRoundChange(true)}
                  >
                    <Radio value="round-robin" size="lg" colorScheme="green">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">Gruppensystem</Text>
                        <Text fontSize="sm" color="gray.600">
                          Jeder gegen Jeden
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Spieler-Auslosung */}
            <Box>
              <Heading size="md" mb={4} color="gray.700">
                Spieler-Auslosung
              </Heading>
              <RadioGroup
                value={settings.seedingType}
                onChange={(value) => handleSeedingChange(value as 'manual' | 'automatic')}
              >
                <Stack spacing={4}>
                  <Box
                    p={4}
                    bg={settings.seedingType === 'automatic' ? 'orange.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={settings.seedingType === 'automatic' ? 'orange.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: settings.seedingType === 'automatic' ? 'orange.100' : 'gray.100' }}
                    onClick={() => handleSeedingChange('automatic')}
                  >
                    <Radio value="automatic" size="lg" colorScheme="orange">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">Automatisch</Text>
                        <Text fontSize="sm" color="gray.600">
                          Zufällige Reihenfolge
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                  
                  <Box
                    p={4}
                    bg={settings.seedingType === 'manual' ? 'orange.50' : 'gray.50'}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={settings.seedingType === 'manual' ? 'orange.200' : 'gray.200'}
                    cursor="pointer"
                    _hover={{ bg: settings.seedingType === 'manual' ? 'orange.100' : 'gray.100' }}
                    onClick={() => handleSeedingChange('manual')}
                  >
                    <Radio value="manual" size="lg" colorScheme="orange">
                      <VStack align="start" spacing={1} ml={2}>
                        <Text fontWeight="bold" fontSize="lg">Manuell</Text>
                        <Text fontSize="sm" color="gray.600">
                          Du bestimmst die Reihenfolge
                        </Text>
                      </VStack>
                    </Radio>
                  </Box>
                </Stack>
              </RadioGroup>
            </Box>
          </SimpleGrid>

          <Divider />

          {/* Settings Preview */}
          <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200">
            <AlertIcon />
            <Box w="100%">
              <Text fontWeight="bold" mb={3} fontSize="lg">
                🔍 Vorschau der Einstellungen:
              </Text>
              <List spacing={2}>
                <ListItem>
                  <Text>
                    <strong>Format:</strong> {settings.format === 'best-of-3' ? 'Best of 3' : 'Best of 5'}
                  </Text>
                </ListItem>
                <ListItem>
                  <Text>
                    <strong>Modus:</strong> {settings.hasPointsRound ? 'Gruppensystem' : 'KO-System'}
                  </Text>
                </ListItem>
                <ListItem>
                  <Text>
                    <strong>Auslosung:</strong> {settings.seedingType === 'automatic' ? 'Automatisch' : 'Manuell'}
                  </Text>
                </ListItem>
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
              Zurück zu Spielern
            </Button>
            <Button
              onClick={handleConfirm}
              colorScheme="green"
              size="lg"
              rightIcon={<ArrowForwardIcon />}
              px={8}
              fontWeight="bold"
            >
              {settings.seedingType === 'manual' ? 'Weiter zu Setzung' : 'Turnier starten'}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default TournamentSettingsComponent