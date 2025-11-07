import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { Match, Player, TournamentPhase, TournamentSettings } from '../types'
import {
  clearTournamentCache,
  hasCachedTournament,
  loadTournamentFromCache,
  saveTournamentToCache
} from '../utils/cache'
import { assignAutomaticSeeding } from '../utils/tournamentSeeding'
import type { TournamentSnapshotPayload } from '../utils/shareLink'

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  format: 'best-of-3',
  hasPointsRound: false,
  seedingType: 'automatic'
}

const createDefaultSettings = (): TournamentSettings => ({
  ...DEFAULT_TOURNAMENT_SETTINGS
})

interface UseTournamentStateOptions {
  randomFn?: () => number
}

interface UseTournamentStateResult {
  currentPhase: TournamentPhase
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  showCacheAlert: boolean
  setPlayers: Dispatch<SetStateAction<Player[]>>
  setSettings: Dispatch<SetStateAction<TournamentSettings>>
  setMatches: Dispatch<SetStateAction<Match[]>>
  handlePlayersConfirm: (newPlayers: Player[]) => void
  handleSettingsConfirm: (settings: TournamentSettings) => void
  handleSeedingConfirm: (seededPlayers: Player[]) => void
  handleBackToPlayerManagement: () => void
  handleBackToSettings: () => void
  loadCachedTournament: () => void
  startNewTournament: () => void
  dismissCacheAlert: () => void
  loadSnapshot: (snapshot: TournamentSnapshotPayload) => void
}

export const useTournamentState = (
  options: UseTournamentStateOptions = {}
): UseTournamentStateResult => {
  const { randomFn = Math.random } = options
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>('player-management')
  const [players, setPlayers] = useState<Player[]>([])
  const [settings, setSettings] = useState<TournamentSettings>(createDefaultSettings)
  const [matches, setMatches] = useState<Match[]>([])
  const [showCacheAlert, setShowCacheAlert] = useState(false)

  useEffect(() => {
    if (!hasCachedTournament()) {
      return
    }

    const cache = loadTournamentFromCache()
    if (cache) {
      setShowCacheAlert(true)
    }
  }, [])

  useEffect(() => {
    if (currentPhase === 'player-management' || players.length === 0) {
      return
    }

    saveTournamentToCache(currentPhase, players, settings, matches)
  }, [currentPhase, players, settings, matches])

  const loadCachedTournament = useCallback(() => {
    const cache = loadTournamentFromCache()
    if (!cache) {
      return
    }

    setCurrentPhase(cache.phase)
    setPlayers(cache.players)
    setSettings(cache.settings)
    setMatches(cache.matches)
    setShowCacheAlert(false)
  }, [])

  const startNewTournament = useCallback(() => {
    clearTournamentCache()
    setCurrentPhase('player-management')
    setPlayers([])
    setSettings(createDefaultSettings())
    setMatches([])
    setShowCacheAlert(false)
  }, [])

  const handlePlayersConfirm = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers)
    setCurrentPhase('settings')
  }, [])

  const handleSettingsConfirm = useCallback(
    (newSettings: TournamentSettings) => {
      setSettings(newSettings)

      if (newSettings.seedingType === 'manual') {
        setCurrentPhase('seeding')
        return
      }

      setPlayers(prevPlayers => assignAutomaticSeeding(prevPlayers, randomFn))
      setCurrentPhase('tournament')
    },
    [randomFn]
  )

  const handleSeedingConfirm = useCallback((seededPlayers: Player[]) => {
    setPlayers(seededPlayers)
    setCurrentPhase('tournament')
  }, [])

  const handleBackToPlayerManagement = useCallback(() => {
    setCurrentPhase('player-management')
    setPlayers([])
    setMatches([])
  }, [])

  const handleBackToSettings = useCallback(() => {
    setCurrentPhase('settings')
    setMatches([])
  }, [])

  const dismissCacheAlert = useCallback(() => {
    setShowCacheAlert(false)
  }, [])

  const loadSnapshot = useCallback((snapshot: TournamentSnapshotPayload) => {
    setCurrentPhase(snapshot.phase ?? 'tournament')
    setPlayers(snapshot.players ?? [])
    setSettings(snapshot.settings ?? createDefaultSettings())
    setMatches(snapshot.matches ?? [])
    setShowCacheAlert(false)
  }, [])

  return useMemo(
    () => ({
      currentPhase,
      players,
      settings,
      matches,
      showCacheAlert,
      setPlayers,
      setSettings,
      setMatches,
      handlePlayersConfirm,
      handleSettingsConfirm,
      handleSeedingConfirm,
      handleBackToPlayerManagement,
      handleBackToSettings,
      loadCachedTournament,
      startNewTournament,
      dismissCacheAlert,
      loadSnapshot
    }), [
      currentPhase,
      players,
      settings,
      matches,
      showCacheAlert,
      handlePlayersConfirm,
      handleSettingsConfirm,
      handleSeedingConfirm,
      handleBackToPlayerManagement,
      handleBackToSettings,
      loadCachedTournament,
      startNewTournament,
      dismissCacheAlert,
      loadSnapshot
    ]
  )
}
