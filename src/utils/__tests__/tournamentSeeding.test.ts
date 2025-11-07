import { describe, expect, it } from 'vitest'
import { assignAutomaticSeeding } from '../tournamentSeeding'
import type { Player } from '../../types'

describe('assignAutomaticSeeding', () => {
  const createPlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`
    }))

  it('assigns sequential seeds starting from 1', () => {
    const players = createPlayers(4)
    const seededPlayers = assignAutomaticSeeding(players, () => 0)

    const seeds = seededPlayers.map(player => player.seed)
    expect(seeds).toEqual([1, 2, 3, 4])
  })

  it('does not mutate the original player array', () => {
    const players = createPlayers(3)
    assignAutomaticSeeding(players, () => 0)

    expect(players.every(player => player.seed === undefined)).toBe(true)
  })

  it('uses the provided random function to shuffle players', () => {
    const players = createPlayers(3)
    const randomValues = [0.9, 0.1, 0.4]
    let index = 0

    const seededPlayers = assignAutomaticSeeding(players, () => {
      const value = randomValues[index] ?? 0
      index += 1
      return value
    })

    expect(seededPlayers.map(player => player.id)).toEqual([
      'player-2',
      'player-1',
      'player-3'
    ])
  })
})
