import { useState, useEffect, useCallback } from 'react'
import type { Player, Match, TournamentSettings } from '../types'

interface UseTournamentLogicProps {
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  onMatchesUpdate: (matches: Match[]) => void
}

export const useTournamentLogic = ({
  players,
  settings,
  matches,
  onMatchesUpdate
}: UseTournamentLogicProps) => {
  const [rounds, setRounds] = useState<Match[][]>([])
  const [currentRound, setCurrentRound] = useState(0)

  // Generiere komplette KO-Matrix
  useEffect(() => {
    console.log('useTournamentLogic: Checking conditions for round generation', {
      playersLength: players.length,
      matchesLength: matches.length,
      players,
      matches
    })

    console.log('useTournamentLogic: Initial state', {
      playersLength: players.length,
      matchesLength: matches.length,
      players,
      matches
    });

    if (players.length > 0) {
      console.log('useTournamentLogic: Generating tournament matrix regardless of matches state...')
      const sortedPlayers = [...players].sort((a, b) => (a.seed || 0) - (b.seed || 0))
      const totalRounds = Math.ceil(Math.log2(players.length))
      const allRounds: Match[][] = []

      let playersInRound = players.length

      for (let round = 1; round <= totalRounds; round++) {
        const roundMatches: Match[] = []
        const matchesInThisRound = Math.floor(playersInRound / 2)

        for (let matchIndex = 0; matchIndex < matchesInThisRound; matchIndex++) {
          const match: Match = {
            id: crypto.randomUUID(),
            player1: round === 1 && matchIndex * 2 < sortedPlayers.length
              ? sortedPlayers[matchIndex * 2]
              : { id: `tbd-${round}-${matchIndex}-1`, name: 'TBD', seed: 0 },
            player2: round === 1 && matchIndex * 2 + 1 < sortedPlayers.length
              ? sortedPlayers[matchIndex * 2 + 1]
              : { id: `tbd-${round}-${matchIndex}-2`, name: 'TBD', seed: 0 },
            player1Score: 0,
            player2Score: 0,
            isFinished: false,
            round: round
          }
          roundMatches.push(match)
        }

        if (matchesInThisRound > 0) {
          allRounds.push(roundMatches)
        }

        playersInRound = matchesInThisRound
        if (playersInRound <= 1) break
      }

      setRounds(allRounds)

      const firstRoundMatches = allRounds[0]?.filter(match =>
        match.player1.name !== 'TBD' && match.player2.name !== 'TBD'
      ) || []

      console.log('useTournamentLogic: Generated tournament', {
        totalRounds: allRounds.length,
        firstRoundMatches: firstRoundMatches.length
      })

      onMatchesUpdate(firstRoundMatches)
    } else {
      console.log('useTournamentLogic: Conditions not met for tournament generation')
    }
  }, [players, matches, matches.length, onMatchesUpdate])

  // Bestimme aktuelle Runde
  useEffect(() => {
    let activeRound = 0
    for (let i = 0; i < rounds.length; i++) {
      const roundMatches = rounds[i]
      if (roundMatches.some(match => !match.isFinished && match.player1.name !== 'TBD' && match.player2.name !== 'TBD')) {
        activeRound = i
        break
      }
      if (i === rounds.length - 1) {
        activeRound = i
      }
    }
    setCurrentRound(activeRound)
  }, [rounds])

  // Gewinner in nächste Runde bewegen
  const moveWinnerToNextRound = useCallback((finishedMatch: Match, winner: Player) => {
    const currentRoundIndex = (finishedMatch.round || 1) - 1
    const nextRoundIndex = currentRoundIndex + 1
    
    if (nextRoundIndex >= rounds.length) return
    
    const matchIndexInRound = rounds[currentRoundIndex].findIndex(m => m.id === finishedMatch.id)
    const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2)
    const isPlayer1Slot = matchIndexInRound % 2 === 0
    
    setTimeout(() => {
      setRounds(prevRounds => {
        const newRounds = [...prevRounds]
        if (newRounds[nextRoundIndex] && newRounds[nextRoundIndex][nextRoundMatchIndex]) {
          const nextMatch = { ...newRounds[nextRoundIndex][nextRoundMatchIndex] }
          
          if (isPlayer1Slot) {
            nextMatch.player1 = winner
          } else {
            nextMatch.player2 = winner
          }
          
          newRounds[nextRoundIndex][nextRoundMatchIndex] = nextMatch
        }
        return newRounds
      })
    }, 100)
  }, [rounds])

  // Score-Update Funktionen
  const updateMatchScore = useCallback((matchId: string, playerId: string, increment: boolean) => {
    setRounds(prevRounds => {
      return prevRounds.map(round => {
        return round.map(match => {
          if (match.id === matchId && !match.isFinished) {
            const maxScore = settings.format === 'best-of-3' ? 2 : 3
            const isPlayer1 = match.player1.id === playerId
            const currentScore = isPlayer1 ? match.player1Score : match.player2Score
            
            let newScore = currentScore
            if (increment && currentScore < maxScore) {
              newScore = currentScore + 1
            } else if (!increment && currentScore > 0) {
              newScore = currentScore - 1
            } else {
              return match
            }
            
            const newPlayer1Score = isPlayer1 ? newScore : match.player1Score
            const newPlayer2Score = !isPlayer1 ? newScore : match.player2Score
            
            const isFinished = increment && (newPlayer1Score >= maxScore || newPlayer2Score >= maxScore)
            const winner = isFinished 
              ? (newPlayer1Score > newPlayer2Score ? match.player1 : match.player2)
              : undefined

            const updatedMatch = {
              ...match,
              player1Score: newPlayer1Score,
              player2Score: newPlayer2Score,
              isFinished,
              winner
            }

            if (isFinished && winner) {
              moveWinnerToNextRound(updatedMatch, winner)
            }

            return updatedMatch
          }
          return match
        })
      })
    })
  }, [settings.format, moveWinnerToNextRound])

  const getRoundName = useCallback((roundIndex: number) => {
    const totalRounds = rounds.length
    const roundNumber = roundIndex + 1
    
    if (roundNumber === totalRounds && rounds[roundIndex]?.length === 1) {
      return 'Finale'
    } else if (roundNumber === totalRounds - 1 && rounds[roundIndex]?.length === 2) {
      return 'Halbfinale'
    } else if (roundNumber === totalRounds - 2 && rounds[roundIndex]?.length === 4) {
      return 'Viertelfinale'
    } else {
      return `Runde ${roundNumber}`
    }
  }, [rounds])

  const isComplete = rounds.length > 0 && 
    rounds[rounds.length - 1]?.length === 1 && 
    rounds[rounds.length - 1][0]?.isFinished

  const champion = isComplete ? rounds[rounds.length - 1][0].winner : null

  return {
    rounds,
    currentRound,
    champion,
    isComplete,
    updateMatchScore,
    getRoundName
  }
}