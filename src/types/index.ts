// TypeScript-Interfaces für das Dart-Turnier-Management

export interface Player {
  id: string;
  name: string;
  seed?: number; // Setzposition bei manueller Auslosung
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  player1Score: number;
  player2Score: number;
  isFinished: boolean;
  winner?: Player;
  round?: number; // Für KO-Turniere
}

export interface TournamentSettings {
  format: 'best-of-3' | 'best-of-5';
  hasPointsRound: boolean; // Ob es eine Punktevorrunde gibt
  seedingType: 'manual' | 'automatic';
}

export interface Tournament {
  id: string;
  name: string;
  players: Player[];
  settings: TournamentSettings;
  matches: Match[];
  isStarted: boolean;
  isFinished: boolean;
}

export interface RoundRobinResult {
  player: Player;
  matches: number;
  wins: number;
  losses: number;
  points: number;
  position: number;
  isEliminated: boolean;
}

export type TournamentPhase = 'setup' | 'player-management' | 'settings' | 'seeding' | 'tournament' | 'finished';