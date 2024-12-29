export interface Game {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  platform: string[];
  link: string;
  developer: string;
}

export interface GamesData {
  games: Game[];
}
