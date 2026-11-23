export const EVENT_CATEGORIES = [
  { value: "assembly", label: "총회" },
  { value: "social", label: "친목·뒷풀이" },
  { value: "project", label: "프로젝트·스터디" },
  { value: "external", label: "외부 행사" },
  { value: "mt", label: "MT" },
  { value: "other", label: "기타" },
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number]["value"];

export function eventCategory(value?: string): EventCategory {
  return EVENT_CATEGORIES.find(category => category.value === value)?.value || "other";
}

export function eventCategoryLabel(value?: string): string {
  return EVENT_CATEGORIES.find(category => category.value === eventCategory(value))!.label;
}
