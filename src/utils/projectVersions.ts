import type { Game } from "../types/game";

export type ProjectVersion = NonNullable<Game["versions"]>[number];
export const VERSION_STAGES = ["Prototype", "Alpha", "Beta", "Early Access", "Release"] as const;
export const VERSION_ACTIONS = [
  {value: "download", label: "다운로드", description: "Google Drive 등에서 설치 파일 제공"},
  {value: "store", label: "상점 페이지", description: "Steam, itch.io 등 외부 상점 페이지"},
  {value: "play", label: "지금 플레이", description: "웹 브라우저에서 바로 실행"},
] as const;

export const versionLabel = (number: string, stage: ProjectVersion["stage"]) => `v${number}-${stage || "Prototype"}`;
export const versionActionLabel = (action: ProjectVersion["action"]) => VERSION_ACTIONS.find(item => item.value === action)?.label || "다운로드";
export const validVersionNumber = (number: string, stage: ProjectVersion["stage"]) => {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(number)) return false;
  const [major] = number.split(".").map(Number);
  return stage === "Release" || major === 0;
};
export const versionFields = (version: ProjectVersion) => {
  const parsed = /^v(\d+\.\d+\.\d+)-(Prototype|Alpha|Beta|Early Access|Release)$/i.exec(version.label);
  const stage = version.stage || VERSION_STAGES.find(item => item.toLowerCase() === parsed?.[2]?.toLowerCase()) || "Prototype";
  const number = version.number || parsed?.[1] || "0.0.0";
  return {stage, number, action: version.action || "download"};
};
export const sortProjectVersions = (versions: ProjectVersion[]) => [...versions].sort((a, b) => {
  const first = versionFields(a);
  const second = versionFields(b);
  const firstParts = first.number.split(".").map(Number);
  const secondParts = second.number.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = (secondParts[index] || 0) - (firstParts[index] || 0);
    if (difference) return difference;
  }
  return VERSION_STAGES.indexOf(second.stage) - VERSION_STAGES.indexOf(first.stage);
});
