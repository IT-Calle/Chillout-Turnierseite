// Cache-Utility für localStorage - Turnier-Daten speichern und laden

import type { Player, Match, TournamentSettings, TournamentPhase } from '../types'

const CACHE_KEY = 'dart_tournament_cache'

export interface TournamentCache {
  phase: TournamentPhase
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
  timestamp: number
}

export const saveTournamentToCache = (
  phase: TournamentPhase,
  players: Player[],
  settings: TournamentSettings,
  matches: Match[]
): void => {
  try {
    const cache: TournamentCache = {
      phase,
      players,
      settings,
      matches,
      timestamp: Date.now()
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    console.log('Turnier im Cache gespeichert:', cache)
  } catch (error) {
    console.error('Fehler beim Speichern im Cache:', error)
  }
}

export const loadTournamentFromCache = (): TournamentCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const cache: TournamentCache = JSON.parse(cached)
    console.log('Turnier aus Cache geladen:', cache)
    return cache
  } catch (error) {
    console.error('Fehler beim Laden aus Cache:', error)
    return null
  }
}

export const clearTournamentCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY)
    console.log('Cache geleert')
  } catch (error) {
    console.error('Fehler beim Löschen des Caches:', error)
  }
}

export const hasCachedTournament = (): boolean => {
  return localStorage.getItem(CACHE_KEY) !== null
}

// Prüft ob ein gespeichertes Turnier älter als X Stunden ist
export const isCacheExpired = (maxHours: number = 24): boolean => {
  const cache = loadTournamentFromCache()
  if (!cache) return true
  
  const now = Date.now()
  const hoursDiff = (now - cache.timestamp) / (1000 * 60 * 60)
  return hoursDiff > maxHours
}