import type { Game } from "../types/game";
import type { PreMemberRecord } from "../components/PreMemberRecords";

export type ProjectDeveloperSources = {
  users: Record<string, { realName?: string; nickname?: string; loginId?: string; photoURL?: string }>;
  records: Record<string, PreMemberRecord>;
  profiles: Record<string, { part?: string }>;
  assignmentParts: Record<string, Record<string, string>>;
  projectKey?: string | null;
};

export const sameDeveloperIdentity = (name: string, studentNumber: string, record: PreMemberRecord) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase() === record.name.trim().replace(/\s+/g, " ").toLocaleLowerCase()
  && Boolean(studentNumber) && studentNumber === record.studentNumber;

const developerPartRank = (part: string) => {
  const normalized = part.trim();
  if (normalized === "기획") return 0;
  if (normalized === "프로그래밍" || normalized === "플밍") return 1;
  if (normalized === "아트") return 2;
  return 3;
};

export function sortProjectDevelopers(developers: NonNullable<Game["developerProfiles"]>) {
  return [...developers].sort((a, b) =>
    developerPartRank(a.part) - developerPartRank(b.part)
    || (a.studentNumber?.slice(0, 2) || "99").localeCompare(b.studentNumber?.slice(0, 2) || "99")
    || a.name.localeCompare(b.name, "ko")
  );
}

export function enrichProjectDevelopers(game: Game, records: Record<string, PreMemberRecord>) {
  return linkTemporaryDevelopers(game, records).map(person => {
    if (person.source !== "member" || !person.sourceId || !records[person.sourceId]) return person;
    const record = records[person.sourceId];
    return {...person, name: record.name, part: person.part || record.part || "", studentNumber: record.studentNumber || person.studentNumber, avatarUid: record.linkedUid || person.avatarUid};
  });
}

export function linkTemporaryDevelopers(game: Game, records: Record<string, PreMemberRecord>): NonNullable<Game["developerProfiles"]> {
  return (game.developerProfiles || []).map(person => {
    if (person.source || !person.studentNumber) return person;
    const match = Object.entries(records).find(([, record]) => sameDeveloperIdentity(person.name, person.studentNumber || "", record));
    if (!match) return person;
    const [sourceId, record] = match;
    return {...person, source: "member" as const, sourceId, name: record.name, part: record.part || "", avatarUid: record.linkedUid || ""};
  });
}

export function temporaryDeveloperUpdates(games: Record<string, Game>, recordId: string, record: PreMemberRecord) {
  const changes: Record<string, NonNullable<Game["developerProfiles"]>> = {};
  for (const [gameKey, game] of Object.entries(games)) {
    const before = game.developerProfiles || [];
    const after = linkTemporaryDevelopers(game, {[recordId]: record});
    if (after.some((person, index) => person.sourceId === recordId && before[index]?.sourceId !== recordId)) {
      changes[`games/${gameKey}/developerProfiles`] = after;
    }
  }
  return changes;
}

export function resolveProjectDevelopers(game: Game, sources: ProjectDeveloperSources): NonNullable<Game["developerProfiles"]> {
  return enrichProjectDevelopers(game, sources.records).map(person => {
    if (!person.source || !person.sourceId) return person;
    if (person.source === "account") {
      const user = sources.users[person.sourceId];
      if (!user) return person;
      const linkedRecord = Object.values(sources.records).find(record => record.linkedUid === person.sourceId);
      const part = (sources.projectKey && sources.assignmentParts[sources.projectKey]?.[person.sourceId]) || (sources.projectKey && linkedRecord?.projectParts?.[sources.projectKey]) || linkedRecord?.part || sources.profiles[person.sourceId]?.part || "";
      return {...person, name: linkedRecord?.name || user.realName || user.nickname || user.loginId || person.name, part, studentNumber: linkedRecord?.studentNumber || person.studentNumber, avatarUrl: user.photoURL || person.avatarUrl || "", avatarUid:person.sourceId};
    }
    const record = sources.records[person.sourceId];
    if (!record) return person;
    return {...person, name: record.name, part: (sources.projectKey && record.projectParts?.[sources.projectKey]) || record.part || "", studentNumber: record.studentNumber || person.studentNumber, avatarUrl: (record.linkedUid && sources.users[record.linkedUid]?.photoURL) || person.avatarUrl || "", avatarUid:record.linkedUid || ""};
  });
}
