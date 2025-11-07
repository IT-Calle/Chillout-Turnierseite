import type { Match, Player, TournamentPhase, TournamentSettings } from '../types'

export interface TournamentSnapshotPayload {
  version: number
  timestamp: number
  phase: TournamentPhase
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
}

const SNAPSHOT_VERSION = 1

const base64Encode = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(unescape(encodeURIComponent(value)))
  }
  const bufferCtor = (globalThis as { Buffer?: any }).Buffer
  if (bufferCtor) {
    return bufferCtor.from(value, 'utf-8').toString('base64')
  }
  throw new Error('Base64 encoding is not supported in this environment.')
}

const base64Decode = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(value)))
  }
  const bufferCtor = (globalThis as { Buffer?: any }).Buffer
  if (bufferCtor) {
    return bufferCtor.from(value, 'base64').toString('utf-8')
  }
  throw new Error('Base64 decoding is not supported in this environment.')
}

export const createSnapshotPayload = ({
  phase,
  players,
  settings,
  matches
}: {
  phase: TournamentPhase
  players: Player[]
  settings: TournamentSettings
  matches: Match[]
}): TournamentSnapshotPayload => ({
  version: SNAPSHOT_VERSION,
  timestamp: Date.now(),
  phase,
  players,
  settings,
  matches
})

export const encodeSnapshotForUrl = (snapshot: TournamentSnapshotPayload): string => {
  const json = JSON.stringify(snapshot)
  return encodeURIComponent(base64Encode(json))
}

export const decodeSnapshotFromParam = (paramValue: string): TournamentSnapshotPayload | null => {
  try {
    const normalized = decodeURIComponent(paramValue)
    const json = base64Decode(normalized)
    const snapshot = JSON.parse(json) as TournamentSnapshotPayload
    if (snapshot.version !== SNAPSHOT_VERSION) {
      return null
    }
    if (!snapshot.players || !snapshot.settings || !snapshot.matches) {
      return null
    }
    return snapshot
  } catch {
    return null
  }
}

export const buildShareUrl = (snapshot: TournamentSnapshotPayload): string => {
  if (typeof window === 'undefined') {
    return ''
  }
  const base = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  base.searchParams.set('share', encodeSnapshotForUrl(snapshot))
  return base.toString()
}
