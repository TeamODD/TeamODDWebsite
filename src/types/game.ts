export interface Game {
  id: number;
  key?: string; // Firebase 키를 위한 선택적 속성 추가
  title: string;
  description: string;
  midDescription?: string;
  detail: string;
  platform: string;
  controls?: string;
  genreTags?: string[];
  developerProfiles?: { name: string; part: string; studentNumber?: string; avatarUrl?: string; avatarUid?: string; source?: "account" | "member"; sourceId?: string }[];
  featureTags?: string[];
  supportedLanguages?: string[];
  languageSupport?: Record<string, {interface?: boolean; voice?: boolean; subtitles?: boolean}>;
  socialLinks?: { instagram?: string; youtube?: string };
  awards?: string[];
  engine: string;
  year: string;
  project: string;
  imageUrl: string;
  previewImages?: {id: string; url: string}[];
  previewYoutubeUrl?: string;
  iconUrl?: string;
  coverUrl?: string;
  link?: string;
  versions?: { label: string; url: string; source?: "base"; stage?: "Prototype" | "Alpha" | "Beta" | "Early Access" | "Release"; number?: string; action?: "download" | "store" | "play" }[];
  updates?: { title: string; date?: string; imageUrl?: string; summary?: string; detail?: string; url?: string }[];
  developer: string;
  placeholder?: string;
  priority?: number;
  reviewPolicy?: "everyone" | "account" | "member" | "off";
}

export interface GamesData {
  games: Game[];
}
