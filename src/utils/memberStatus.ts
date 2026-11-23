export const MEMBER_STATUSES = [
  { value: "active", label: "활동 부원" },
  { value: "resting", label: "휴식 부원" },
  { value: "alumniEnrolled", label: "졸업 부원·재학" },
  { value: "alumniGraduated", label: "졸업 부원·졸업" },
  { value: "withdrawn", label: "탈퇴" },
] as const;

export type MemberStatus = typeof MEMBER_STATUSES[number]["value"];

export function memberStatus(value?: string): MemberStatus {
  return MEMBER_STATUSES.find(status => status.value === value)?.value || "active";
}

export function memberStatusLabel(value?: string): string {
  return MEMBER_STATUSES.find(status => status.value === memberStatus(value))!.label;
}
