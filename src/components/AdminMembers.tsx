import { useState } from "react";
import { ref, remove, set } from "firebase/database";
import { ADMIN_UID } from "../auth/admin";
import { database } from "../firebase";
import type { Game } from "../types/game";
import { activityScore, eventDateLabel, eventPoints, type EventParticipation, type ScoredEvent } from "../utils/activityScore";
import { MEMBER_PARTS, memberPart, memberPartTone } from "../utils/memberPart";
import "../styles/MemberPart.css";

type Person = { nickname?: string; realName?: string; loginId?: string; registrationIntent?: string };
type Profile = { part?: string; activityScore?: number };

type Props = {
  users: Record<string, Person>;
  roles: Record<string, string>;
  profiles: Record<string, Profile>;
  applicationStatus: Record<string, string>;
  events: Record<string, ScoredEvent>;
  eventParticipation: EventParticipation;
  currentSemester: string;
  assignments: Record<string, Record<string, boolean>>;
  games: Record<string, Game>;
  onUpdatePerson: (uid: string, path: string, value: unknown) => Promise<void>;
  onError: (message: string) => void;
};

function MemberRow({ uid, person, role, profile, assignments, games, events, participation, currentSemester, onUpdatePerson, onError }: {
  uid: string;
  person: Person;
  role: string;
  profile: Profile;
  assignments: Record<string, Record<string, boolean>>;
  games: Record<string, Game>;
  events: Record<string, ScoredEvent>;
  participation: Record<string, boolean>;
  currentSemester: string;
  onUpdatePerson: Props["onUpdatePerson"];
  onError: Props["onError"];
}) {
  const [expanded, setExpanded] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [projectCategory, setProjectCategory] = useState<"all" | "assigned" | "unassigned">("all");
  const [eventCategory, setEventCategory] = useState<"all" | "attended" | "unattended">("all");
  const [semesterFilter, setSemesterFilter] = useState("current");
  const isAdmin = uid === ADMIN_UID;
  const assignedCount = Object.keys(games).filter(key => assignments[key]?.[uid] === true).length;
  const matchingGames = Object.entries(games).filter(([key, game]) =>
    game.title.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase())
    && (projectCategory === "all" || (assignments[key]?.[uid] === true) === (projectCategory === "assigned")),
  );
  const selectedSemester = semesterFilter === "current" ? currentSemester : semesterFilter === "all" ? "" : semesterFilter;
  const semesterEvents = Object.entries(events).filter(([, event]) => !selectedSemester || (event.semester || "unassigned") === selectedSemester);
  const semesterAttendedCount = semesterEvents.filter(([key]) => participation[key] === true).length;
  const semesters = [...new Set(Object.values(events).map(event => event.semester).filter((semester): semester is string => Boolean(semester)))].sort((a, b) => b.localeCompare(a));
  const matchingEvents = semesterEvents
    .filter(([key, event]) => event.title.toLocaleLowerCase().includes(eventQuery.trim().toLocaleLowerCase())
      && (eventCategory === "all" || (participation[key] === true) === (eventCategory === "attended")))
    .sort(([keyA, a], [keyB, b]) => Number(participation[keyB] === true) - Number(participation[keyA] === true) || b.date.localeCompare(a.date));
  const eventGroups = [...new Set(matchingEvents.map(([, event]) => event.semester || "미분류"))]
    .sort((a, b) => a === currentSemester ? -1 : b === currentSemester ? 1 : b.localeCompare(a))
    .map(semester => ({ semester, items: matchingEvents.filter(([, event]) => (event.semester || "미분류") === semester) }));
  const attendedCount = Object.keys(events).filter(key => participation[key] === true).length;
  const score = activityScore(events, participation, currentSemester || undefined);
  const scoreTone = score === 0 ? "zero" : score >= 3 ? "gold" : "neutral";
  const part = memberPart(profile.part);

  return <article className="admin-member-card">
    <button className="admin-member-card__summary" type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span className="admin-member-card__identity"><strong>{person.nickname || person.loginId || "이름 없음"}</strong><small>{person.realName || "본명 미등록"} · {person.loginId || "아이디 미등록"}</small></span>
      <span className="admin-member-card__badges"><span className="admin-member-card__badge">{isAdmin ? "관리자" : role === "member" ? "부원" : "일반"}</span><span className={`member-part-badge member-part-badge--${memberPartTone(part)}`}>{part}</span></span>
      <span className="admin-member-card__meta"><small>{currentSemester || "전체"}</small> <strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></span>
      <span className="admin-member-card__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    {expanded && <div className="admin-member-card__detail">
      <p>가입 유형: {person.registrationIntent === "member" ? "부원 계정 신청" : person.registrationIntent === "general" ? "일반 계정" : "미등록"}</p>
      <div className="admin-member-card__fields">
        <label>권한{isAdmin ? <span className="admin-member-card__readonly">관리자</span> : <select value={role || "general"} onChange={event => void onUpdatePerson(uid, "roles", event.target.value)}><option value="general">일반</option><option value="member">부원</option></select>}</label>
        <label>담당 파트<select value={part} onChange={event => void onUpdatePerson(uid, "memberProfiles", { ...profile, part: event.target.value })}>{MEMBER_PARTS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
        <div className="admin-member-card__score"><span>활동 점수(자동 계산 · {currentSemester || "전체 학기"})</span><strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></div>
      </div>
      <details className="admin-member-card__projects"><summary>담당 프로젝트 {assignedCount}개</summary>
        <div className="admin-member-card__categories" role="group" aria-label="담당 프로젝트 분류"><button type="button" aria-pressed={projectCategory === "all"} onClick={() => setProjectCategory("all")}>전체 {Object.keys(games).length}</button><button type="button" aria-pressed={projectCategory === "assigned"} onClick={() => setProjectCategory("assigned")}>담당 중 {assignedCount}</button><button type="button" aria-pressed={projectCategory === "unassigned"} onClick={() => setProjectCategory("unassigned")}>미담당 {Object.keys(games).length - assignedCount}</button></div>
        <input type="search" aria-label="프로젝트 검색" placeholder="프로젝트 검색" value={projectQuery} onChange={event => setProjectQuery(event.target.value)} />
        <div className="admin-member-card__project-list">{matchingGames.length ? matchingGames.map(([gameKey, game]) => <label key={gameKey}><input type="checkbox" checked={assignments[gameKey]?.[uid] === true} onChange={async event => { try { if (event.target.checked) await set(ref(database, `gameMembers/${gameKey}/${uid}`), true); else await remove(ref(database, `gameMembers/${gameKey}/${uid}`)); } catch { onError("담당 프로젝트를 저장하지 못했습니다."); } }} />{game.title}</label>) : <p>일치하는 프로젝트가 없습니다.</p>}</div>
      </details>
      <details className="admin-member-card__projects"><summary>참여 행사 {attendedCount}개 · {currentSemester || "전체 학기"} {score}점</summary>
        <label className="admin-member-card__semester-filter">학기<select value={semesterFilter} onChange={event => setSemesterFilter(event.target.value)}><option value="current">현재 학기 ({currentSemester || "미설정"})</option><option value="all">전체 학기</option>{semesters.filter(semester => semester !== currentSemester).map(semester => <option key={semester} value={semester}>{semester}</option>)}<option value="unassigned">미분류</option></select></label>
        <div className="admin-member-card__categories" role="group" aria-label="참여 행사 분류"><button type="button" aria-pressed={eventCategory === "all"} onClick={() => setEventCategory("all")}>전체 {semesterEvents.length}</button><button type="button" aria-pressed={eventCategory === "attended"} onClick={() => setEventCategory("attended")}>참여 {semesterAttendedCount}</button><button type="button" aria-pressed={eventCategory === "unattended"} onClick={() => setEventCategory("unattended")}>미참여 {semesterEvents.length - semesterAttendedCount}</button></div>
        <input type="search" aria-label="행사 검색" placeholder="행사 검색" value={eventQuery} onChange={event => setEventQuery(event.target.value)} />
        <div className="admin-member-card__semester-groups">{eventGroups.length ? eventGroups.map(group => <section key={group.semester} className="admin-member-card__semester-group"><h4>{group.semester}{group.semester === currentSemester && <span>현재 학기</span>}</h4><div className="admin-member-card__project-list">{group.items.map(([eventKey, event]) => <label key={eventKey}><input type="checkbox" checked={participation[eventKey] === true} onChange={async change => { try { if (change.target.checked) await set(ref(database, `eventParticipation/${uid}/${eventKey}`), true); else await remove(ref(database, `eventParticipation/${uid}/${eventKey}`)); } catch { onError("행사 참여 기록을 저장하지 못했습니다."); } }} /><span>{event.title}<small>{eventDateLabel(event)} · 참여 시 {eventPoints(event)}점</small></span></label>)}</div></section>) : <p>일치하는 행사가 없습니다.</p>}</div>
      </details>
    </div>}
  </article>;
}

export default function AdminMembers({ users, roles, profiles, applicationStatus, events, eventParticipation, currentSemester, assignments, games, onUpdatePerson, onError }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const members = Object.entries(users)
    .filter(([uid, person]) => {
      const role = uid === ADMIN_UID ? "admin" : roles[uid] === "member" ? "member" : "general";
      const status = applicationStatus[uid];
      const matchesQuery = !normalizedQuery || [person.nickname, person.realName, person.loginId].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
      const matchesRole = roleFilter === "all" || roleFilter === role;
      const matchesApplication = applicationFilter === "all"
        || (applicationFilter === "general" && person.registrationIntent === "general")
        || (applicationFilter === "pending" && person.registrationIntent === "member" && role !== "member" && !status)
        || (applicationFilter === "approved" && person.registrationIntent === "member" && (role === "member" || status === "approved"))
        || (applicationFilter === "rejected" && status === "rejected");
      const matchesPart = partFilter === "all" || memberPart(profiles[uid]?.part) === partFilter;
      return matchesQuery && matchesRole && matchesApplication && matchesPart;
    })
    .sort(([uidA, a], [uidB, b]) => uidA === ADMIN_UID ? -1 : uidB === ADMIN_UID ? 1 : (a.nickname || a.loginId || "").localeCompare(b.nickname || b.loginId || "", "ko"));

  return <section className="modern-panel admin-members" aria-labelledby="admin-members-title">
    <div className="admin-members__heading"><div><h2 id="admin-members-title">계정 및 부원 권한</h2><p>계정을 선택하면 권한과 담당 정보를 수정할 수 있습니다.</p></div><span>{members.length} / {Object.keys(users).length}명</span></div>
    <div className="admin-members__filters">
      <label>계정 검색<input type="search" placeholder="닉네임·본명·아이디" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>권한<select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">전체</option><option value="admin">관리자</option><option value="member">부원</option><option value="general">일반</option></select></label>
      <label>가입 상태<select value={applicationFilter} onChange={event => setApplicationFilter(event.target.value)}><option value="all">전체</option><option value="general">일반 가입</option><option value="pending">부원 승인 대기</option><option value="approved">부원 승인</option><option value="rejected">부원 반려</option></select></label>
      <label>담당 파트<select value={partFilter} onChange={event => setPartFilter(event.target.value)}><option value="all">전체</option>{MEMBER_PARTS.map(part => <option key={part} value={part}>{part}</option>)}</select></label>
    </div>
    <div className="admin-members__list">{members.length ? members.map(([uid, person]) => <MemberRow key={uid} uid={uid} person={person} role={roles[uid] || "general"} profile={profiles[uid] || {}} assignments={assignments} games={games} events={events} participation={eventParticipation[uid] || {}} currentSemester={currentSemester} onUpdatePerson={onUpdatePerson} onError={onError} />) : <p>일치하는 계정이 없습니다.</p>}</div>
  </section>;
}
