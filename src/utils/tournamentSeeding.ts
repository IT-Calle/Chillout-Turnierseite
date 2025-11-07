import type { Player } from '../types'

/**
 * Returns a new array of players with automatically assigned seeds.
 *
 * Players are shuffled using a Fisher-Yates algorithm to avoid bias while
 * keeping the operation pure (the original array is not mutated).  A custom
 * random function can be injected to make deterministic behaviour testable.
 */
export const assignAutomaticSeeding = (
  players: Player[],
  randomFn: () => number = Math.random
): Player[] => {
  const shuffledPlayers = players.map(player => ({ ...player }))

  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1))
    ;[shuffledPlayers[i], shuffledPlayers[j]] = [
      shuffledPlayers[j],
      shuffledPlayers[i]
    ]
  }

  return shuffledPlayers.map((player, index) => ({
    ...player,
    seed: index + 1
  }))
}
