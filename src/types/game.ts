export interface Game {
  id: number;
  title: string;
  description: string;
  year: string;
  project: string;
  imageUrl: string;
  link: string;
  developer: string;
}

export interface GamesData {
  games: Game[];
}
