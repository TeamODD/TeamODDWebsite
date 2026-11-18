export type EventBanner = {
  title: string;
  imageSrc: string;
};

export const shortProjectBanner: EventBanner = {
  title: "제3회 단기프로젝트",
  imageSrc: "/images/event-banners/short-project-03-hero-banner.png",
};

export function parseEventBanner(value: unknown): EventBanner | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => key !== "title" && key !== "imageSrc")) return null;
  const { title, imageSrc } = record;
  if (typeof title !== "string" || !title.trim() || title.length > 100) return null;
  if (typeof imageSrc !== "string" || imageSrc.length > 500 || !/^(\/images\/|https:\/\/)/.test(imageSrc)) return null;
  return { title, imageSrc };
}
