export const ANNUAL_EVENT_GROUPS: { label: string; items: { value: string; label: string }[] }[] = [
  { label: "상반기", items: [
    { value: "spring-opening", label: "개강총회" },
    { value: "spring-led-study", label: "운영진 주관 스터디" },
    { value: "oddity-workshop", label: "ODDITY 워크샵" },
    { value: "spring-closing", label: "종강총회" },
  ] },
  { label: "여름방학", items: [{ value: "summer-project", label: "정규 프로젝트" }] },
  { label: "하반기", items: [
    { value: "fall-opening", label: "개강총회" },
    { value: "fall-led-study", label: "운영진 주관 스터디" },
    { value: "short-project", label: "단기 프로젝트" },
    { value: "fall-closing", label: "종강총회" },
  ] },
  { label: "겨울방학", items: [{ value: "winter-project", label: "정규 프로젝트" }] },
  { label: "기타", items: [
    { value: "ddd-game-jam", label: "DDD 3일 게임잼" },
    { value: "member-led-study", label: "부원 주관 스터디" },
    { value: "exchange", label: "대학교 교류회" },
    { value: "external", label: "외부 행사" },
  ] },
];

export const ANNUAL_EVENT_ITEMS = ANNUAL_EVENT_GROUPS.flatMap(group => group.items);
export type AnnualEventSlot = typeof ANNUAL_EVENT_ITEMS[number]["value"];

const LEGACY_SLOTS: Record<string, string> = {
  "spring-other-study": "member-led-study", "fall-other-study": "member-led-study", "other-study": "member-led-study",
  "spring-external": "external", "fall-external": "external",
  "spring-exchange": "exchange", "fall-exchange": "exchange",
};

export function annualEventSlot(value?: string, semester?: string): AnnualEventSlot | "" {
  const half = semester?.endsWith("-2") ? "fall" : "spring";
  const normalized = value ? LEGACY_SLOTS[value] || ({ opening: `${half}-opening`, "led-study": `${half}-led-study`, closing: `${half}-closing` }[value] || value) : "";
  return ANNUAL_EVENT_ITEMS.find(item => item.value === normalized)?.value || "";
}
