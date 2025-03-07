export interface Game {
  id: number;
  key?: string; // Firebase 키를 위한 선택적 속성 추가
  title: string;
  description: string;
  detail: string;
  platform: string;
  engine: string;
  year: string;
  project: string;
  imageUrl: string;
  link?: string;
  developer: string;
  placeholder?: string;
  priority?: number;
}

export interface GamesData {
  games: Game[];
}
