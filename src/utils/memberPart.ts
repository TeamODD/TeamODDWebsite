export const MEMBER_PARTS = ["기획", "아트", "프로그래밍", "없음"] as const;
export type MemberPart = typeof MEMBER_PARTS[number];

export function memberPart(value?: string): MemberPart {
  return MEMBER_PARTS.find(part => part === value?.trim()) || "없음";
}

export function memberPartTone(part: MemberPart) {
  return part === "기획" ? "planning" : part === "아트" ? "art" : part === "프로그래밍" ? "programming" : "none";
}
