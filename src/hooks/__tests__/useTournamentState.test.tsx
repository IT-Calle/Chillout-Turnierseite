import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTournamentState, DEFAULT_TOURNAMENT_SETTINGS } from '../useTournamentState'
import type { Match, Player, TournamentSettings } from '../../types'

const cacheMocks = vi.hoisted(() => ({
  saveTournamentToCache: vi.fn(),
  loadTournamentFromCache: vi.fn(),
  clearTournamentCache: vi.fn(),
  hasCachedTournament: vi.fn()
}))

vi.mock('../../utils/cache', () => cacheMocks)

const {
  saveTournamentToCache: mockedSaveTournamentToCache,
  loadTournamentFromCache: mockedLoadTournamentFromCache,
  clearTournamentCache: mockedClearTournamentCache,
  hasCachedTournament: mockedHasCachedTournament
} = cacheMocks

describe('useTournamentState', () => {
  const playersFixture: Player[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
  ]

  const cachedMatches: Match[] = [
    {
      id: 'match-1',
      player1: playersFixture[0],
      player2: playersFixture[1],
      player1Score: 0,
      player2Score: 0,
      isFinished: false
    }
  ]

  beforeEach(() => {
    mockedSaveTournamentToCache.mockReset()
    mockedLoadTournamentFromCache.mockReset()
    mockedClearTournamentCache.mockReset()
    mockedHasCachedTournament.mockReset()
    mockedHasCachedTournament.mockReturnValue(false)
    mockedLoadTournamentFromCache.mockReturnValue(null)
  })

  it('initialises with default values and no cache alert', () => {
    const { result } = renderHook(() => useTournamentState())

    expect(result.current.currentPhase).toBe('player-management')
    expect(result.current.players).toEqual([])
    expect(result.current.settings).toEqual(DEFAULT_TOURNAMENT_SETTINGS)
    expect(result.current.showCacheAlert).toBe(false)
  })

  it('shows cache alert when cached data exists', async () => {
    const cachedSettings: TournamentSettings = {
      format: 'best-of-3',
      hasPointsRound: false,
      seedingType: 'automatic'
    }

    mockedHasCachedTournament.mockReturnValue(true)
    mockedLoadTournamentFromCache.mockReturnValue({
      phase: 'settings',
      players: playersFixture,
      settings: cachedSettings,
      matches: cachedMatches,
      timestamp: Date.now()
    })

    const { result } = renderHook(() => useTournamentState())

    await waitFor(() => {
      expect(result.current.showCacheAlert).toBe(true)
    })
  })

  it('loads cached tournament data on demand', () => {
    const cachedSettings: TournamentSettings = {
      format: 'best-of-5',
      hasPointsRound: true,
      seedingType: 'manual'
    }

    mockedLoadTournamentFromCache.mockReturnValue({
      phase: 'tournament',
      players: playersFixture,
      settings: cachedSettings,
      matches: cachedMatches,
      timestamp: Date.now()
    })

    const { result } = renderHook(() => useTournamentState())

    act(() => {
      result.current.loadCachedTournament()
    })

    expect(result.current.currentPhase).toBe('tournament')
    expect(result.current.players).toEqual(playersFixture)
    expect(result.current.settings).toEqual(cachedSettings)
    expect(result.current.matches).toEqual(cachedMatches)
    expect(result.current.showCacheAlert).toBe(false)
  })

  it('handles automatic seeding and persists state changes', async () => {
    const automaticSettings: TournamentSettings = {
      format: 'best-of-3',
      hasPointsRound: false,
      seedingType: 'automatic'
    }

    const { result } = renderHook(() => useTournamentState({ randomFn: () => 0 }))

    act(() => {
      result.current.setPlayers(playersFixture)
    })

    act(() => {
      result.current.handleSettingsConfirm(automaticSettings)
    })

    expect(result.current.currentPhase).toBe('tournament')
    expect(result.current.players.map(player => player.seed)).toEqual([1, 2])

    await waitFor(() => {
      expect(mockedSaveTournamentToCache).toHaveBeenCalledWith(
        'tournament',
        result.current.players,
        automaticSettings,
        result.current.matches
      )
    })
  })

  it('resets the tournament state', () => {
    const { result } = renderHook(() => useTournamentState())

    act(() => {
      result.current.setPlayers(playersFixture)
      result.current.setMatches(cachedMatches)
      result.current.handlePlayersConfirm(playersFixture)
    })

    act(() => {
      result.current.startNewTournament()
    })

    expect(mockedClearTournamentCache).toHaveBeenCalled()
    expect(result.current.currentPhase).toBe('player-management')
    expect(result.current.players).toEqual([])
    expect(result.current.matches).toEqual([])
    expect(result.current.settings).toEqual(DEFAULT_TOURNAMENT_SETTINGS)
  })
})
