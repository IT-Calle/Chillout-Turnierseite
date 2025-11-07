import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTournamentLogic } from '../useTournamentLogic'
import type { Match, Player, TournamentSettings } from '../../types'

const createPlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    seed: index + 1
  }))

const defaultSettings: TournamentSettings = {
  format: 'best-of-3',
  hasPointsRound: false,
  seedingType: 'automatic'
}

describe('useTournamentLogic', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates seeded knockout rounds and reports the playable matches', async () => {
    const players = createPlayers(4)
    const onMatchesUpdate = vi.fn()

    const { result } = renderHook(props => useTournamentLogic(props), {
      initialProps: {
        players,
        settings: defaultSettings,
        matches: [],
        onMatchesUpdate
      }
    })

    await waitFor(() => {
      expect(result.current.rounds.length).toBe(2)
    })

    expect(result.current.currentRound).toBe(0)
    expect(result.current.isComplete).toBe(false)

    const firstRound = result.current.rounds[0]
    expect(firstRound).toHaveLength(2)
    expect(firstRound[0].player1.id).toBe(players[0].id)
    expect(firstRound[0].player2.id).toBe(players[1].id)
    expect(firstRound[1].player1.id).toBe(players[2].id)
    expect(firstRound[1].player2.id).toBe(players[3].id)

    expect(onMatchesUpdate).toHaveBeenCalledTimes(1)
    const firstPlayableMatches = onMatchesUpdate.mock.calls[0][0] as Match[]
    expect(firstPlayableMatches).toHaveLength(2)
    expect(
      firstPlayableMatches.every(
        match => match.player1.name !== 'TBD' && match.player2.name !== 'TBD'
      )
    ).toBe(true)
  })

  it('updates match scores respecting the format and locks finished matches', async () => {
    const players = createPlayers(4)
    const { result } = renderHook(props => useTournamentLogic(props), {
      initialProps: {
        players,
        settings: defaultSettings,
        matches: [],
        onMatchesUpdate: vi.fn()
      }
    })

    await waitFor(() => {
      expect(result.current.rounds.length).toBe(2)
    })

    const matchToPlay = result.current.rounds[0][0]

    act(() => {
      result.current.updateMatchScore(matchToPlay.id, matchToPlay.player1.id, true)
      result.current.updateMatchScore(matchToPlay.id, matchToPlay.player1.id, true)
      result.current.updateMatchScore(matchToPlay.id, matchToPlay.player1.id, true)
    })

    const updatedMatch = result.current.rounds[0][0]
    expect(updatedMatch.player1Score).toBe(2)
    expect(updatedMatch.player2Score).toBe(0)
    expect(updatedMatch.isFinished).toBe(true)
    expect(updatedMatch.winner?.id).toBe(matchToPlay.player1.id)

    act(() => {
      result.current.updateMatchScore(matchToPlay.id, matchToPlay.player2.id, true)
    })

    expect(result.current.rounds[0][0].player2Score).toBe(0)
    expect(result.current.currentRound).toBe(0)
  })

  it('propagates winners to later rounds and exposes the champion after the final', async () => {
    const players = createPlayers(4)
    const { result } = renderHook(props => useTournamentLogic(props), {
      initialProps: {
        players,
        settings: defaultSettings,
        matches: [],
        onMatchesUpdate: vi.fn()
      }
    })

    await waitFor(() => {
      expect(result.current.rounds.length).toBe(2)
    })

    const [semiFinalA, semiFinalB] = result.current.rounds[0]

    act(() => {
      result.current.updateMatchScore(semiFinalA.id, semiFinalA.player1.id, true)
      result.current.updateMatchScore(semiFinalA.id, semiFinalA.player1.id, true)
      result.current.updateMatchScore(semiFinalB.id, semiFinalB.player2.id, true)
      result.current.updateMatchScore(semiFinalB.id, semiFinalB.player2.id, true)
    })

    await waitFor(() => {
      const finalMatchReady = result.current.rounds[1][0]
      expect(finalMatchReady.player1.id).toBe(semiFinalA.player1.id)
      expect(finalMatchReady.player2.id).toBe(semiFinalB.player2.id)
    })

    expect(result.current.currentRound).toBe(1)

    act(() => {
      const finalMatch = result.current.rounds[1][0]
      result.current.updateMatchScore(finalMatch.id, finalMatch.player1.id, true)
      result.current.updateMatchScore(finalMatch.id, finalMatch.player1.id, true)
    })

    await waitFor(() => {
      const finalMatch = result.current.rounds[1][0]
      expect(finalMatch.isFinished).toBe(true)
      expect(result.current.isComplete).toBe(true)
      expect(result.current.champion?.id).toBe(finalMatch.winner?.id)
    })
  })

  it('returns contextual names for each round size', async () => {
    const players = createPlayers(8)
    const { result } = renderHook(props => useTournamentLogic(props), {
      initialProps: {
        players,
        settings: defaultSettings,
        matches: [],
        onMatchesUpdate: vi.fn()
      }
    })

    await waitFor(() => {
      expect(result.current.rounds.length).toBe(3)
    })

    expect(result.current.getRoundName(0)).toBe('Viertelfinale')
    expect(result.current.getRoundName(1)).toBe('Halbfinale')
    expect(result.current.getRoundName(2)).toBe('Finale')
  })
})
