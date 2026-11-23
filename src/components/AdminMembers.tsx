import { useState } from "react";
import { FiAtSign, FiEdit3, FiHash, FiShield, FiTag, FiUser, FiUserCheck } from "react-icons/fi";
import { ref, update } from "firebase/database";
import { ADMIN_UID } from "../auth/admin";
import { database } from "../firebase";
import type { Game } from "../types/game";
import { activityScore, eventDateLabel, eventPoints, type EventParticipation, type ScoredEvent } from "../utils/activityScore";
import { MEMBER_PARTS, memberPart, memberPartTone } from "../utils/memberPart";
import { MEMBER_STATUSES, memberStatus, memberStatusLabel, type MemberStatus } from "../utils/memberStatus";
import PreMemberRecords, { type PreMemberRecord } from "./PreMemberRecords";
import AssignmentPartSelect from "./AssignmentPartSelect";
import AccountAttendance from "./AccountAttendance";
import AnnualAttendance from "./AnnualAttendance";
import ActivityYearsEditor from "./ActivityYearsEditor";
import AccountRecordLink from "./AccountRecordLink";
import type { ActivityYears } from "../utils/activityYears";
import { recordedActivityYears } from "../utils/activityYears";
import type { AttendanceTagSettings } from "../utils/attendanceTags";
import { useScrollLag } from "../hooks/useScrollLag";
import "../styles/MemberPart.css";
import "../styles/MemberStatus.css";

type Person = { nickname?: string; realName?: string; loginId?: string; studentNumber?: string; registrationIntent?: string };
type Profile = { part?: string; status?: string; activityScore?: number; activityYears?: ActivityYears };
const viewHeadings = {
  statistics: { title: "계정 통계", description: "계정과 부원 현황을 한눈에 확인합니다." },
  account: { title: "부원정보", description: "부원 상태와 활동 기록을 관리하고 참여 통계를 확인합니다." },
  member: { title: "계정", description: "가입 유형, 계정 권한과 기본 정보를 확인하고 권한을 변경합니다." },
} as const;

type Props = {
  preMemberRecords: Record<string, PreMemberRecord>;
  users: Record<string, Person>;
  roles: Record<string, string>;
  profiles: Record<string, Profile>;
  applicationStatus: Record<string, string>;
  events: Record<string, ScoredEvent>;
  eventParticipation: EventParticipation;
  eventParticipationParts: Record<string, Record<string, string>>;
  currentSemester: string;
  currentYear: string;
  visibleYears: Record<string, boolean>;
  tagSettings: AttendanceTagSettings;
  assignments: Record<string, Record<string, boolean>>;
  assignmentParts: Record<string, Record<string, string>>;
  games: Record<string, Game>;
  onUpdatePerson: (uid: string, path: string, value: unknown) => Promise<void>;
  onError: (message: string) => void;
};

function MemberRow({ view, uid, person, role, profile, records, assignments, assignmentParts, games, events, participation, participationParts, currentSemester, currentYear, visibleYears, tagSettings, selected, selectionDisabled, onSelectionChange, onUpdatePerson, onError }: {
  view: "account" | "member";
  uid: string;
  person: Person;
  role: string;
  profile: Profile;
  records: Record<string, PreMemberRecord>;
  assignments: Record<string, Record<string, boolean>>;
  assignmentParts: Record<string, Record<string, string>>;
  games: Record<string, Game>;
  events: Record<string, ScoredEvent>;
  participation: Record<string, boolean>;
  participationParts: Record<string, string>;
  currentSemester: string;
  currentYear: string;
  visibleYears: Record<string, boolean>;
  tagSettings: AttendanceTagSettings;
  selected: boolean;
  selectionDisabled: boolean;
  onSelectionChange: (uid: string, checked: boolean) => void;
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
  const registrationLabel = person.registrationIntent === "member" ? "부원 계정 신청" : person.registrationIntent === "general" ? "일반 계정" : "미등록";

  return <article className="admin-member-card">
    <div className="admin-member-card__top">
    {isAdmin || view === "account" ? <span className="admin-member-card__select-slot" /> : <input className="admin-member-card__select" type="checkbox" aria-label={`${person.nickname || person.loginId || "계정"} 선택`} checked={selected} disabled={selectionDisabled} onChange={event => onSelectionChange(uid, event.target.checked)} />}
    <button className="admin-member-card__summary" type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span className="admin-member-card__identity"><span className="member-list-avatar" aria-hidden="true"><FiUser /></span><span className="member-list-identity"><strong>{view === "member" ? person.realName || person.nickname || person.loginId || "이름 없음" : person.nickname || person.loginId || "이름 없음"}</strong><small>{view === "member" ? `${person.nickname || "닉네임 미등록"} · ${person.studentNumber || "학번 미등록"}` : `${person.realName || "본명 미등록"} · ${person.loginId || "아이디 미등록"}`}</small></span></span>
      <span className="admin-member-card__badges"><span className="admin-member-card__badge">{isAdmin ? "관리자" : role === "member" ? "부원" : "일반"}</span>{view === "member" && role === "member" && <span className={`member-status-badge member-status-badge--${memberStatus(profile.status)}`}>{memberStatusLabel(profile.status)}</span>}<span className={`member-part-badge member-part-badge--${memberPartTone(part)}`}>{part}</span></span>
      <span className="admin-member-card__meta"><small>{currentSemester || "전체"}</small> <strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></span>
      <span className="admin-member-card__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    </div>
    {expanded && <div className={`admin-member-card__detail${view === "member" ? " admin-member-card__detail--account" : view === "account" ? " admin-member-card__detail--member" : ""}`}>
      {view === "member" && <div className="admin-member-card__account-info">
        <div className="admin-member-card__account-meta"><span><FiTag aria-hidden="true" />가입 유형 <strong>{registrationLabel}</strong></span><label><FiShield aria-hidden="true" />계정 권한 {isAdmin ? <strong>관리자</strong> : <select aria-label={`${person.nickname || person.loginId || "계정"} 권한`} value={role || "general"} onChange={event => void onUpdatePerson(uid, "roles", event.target.value)}><option value="general">일반</option><option value="member">부원</option></select>}</label></div>
        <dl className="admin-member-card__account-grid">
          <div><dt><FiEdit3 aria-hidden="true" />닉네임</dt><dd>{person.nickname || "미등록"}</dd></div>
          <div><dt><FiUserCheck aria-hidden="true" />본명</dt><dd>{person.realName || "미등록"}</dd></div>
          <div><dt><FiAtSign aria-hidden="true" />아이디</dt><dd>{person.loginId || "미등록"}</dd></div>
          <div><dt><FiHash aria-hidden="true" />학번</dt><dd>{person.studentNumber || "미등록"}</dd></div>
        </dl>
      </div>}
      {view === "member" && !isAdmin && <AccountRecordLink uid={uid} accountName={person.realName || ""} role={role} studentNumber={person.studentNumber} records={records} games={games} events={events} onError={onError} />}
      {view === "account" && <><fieldset className="admin-member-card__identity-panel"><legend>신원 정보</legend><div className="admin-member-card__fields">
        <label>담당 파트<select value={part} onChange={event => void onUpdatePerson(uid, "memberProfiles", { ...profile, part: event.target.value })}>{MEMBER_PARTS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>부원 상태<select value={memberStatus(profile.status)} onChange={event => void onUpdatePerson(uid, "memberProfiles", { ...profile, status: event.target.value })}>{MEMBER_STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
        <div className="admin-member-card__score"><span>활동 점수(자동 계산 · {currentSemester || "전체 학기"})</span><strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></div>
      </div><ActivityYearsEditor years={profile.activityYears} path={`memberProfiles/${uid}/activityYears`} onMessage={onError} />
      <details className="admin-member-card__projects"><summary>담당 프로젝트 {assignedCount}개</summary>
        <div className="admin-member-card__categories" role="group" aria-label="담당 프로젝트 분류"><button type="button" aria-pressed={projectCategory === "all"} onClick={() => setProjectCategory("all")}>전체 {Object.keys(games).length}</button><button type="button" aria-pressed={projectCategory === "assigned"} onClick={() => setProjectCategory("assigned")}>담당 중 {assignedCount}</button><button type="button" aria-pressed={projectCategory === "unassigned"} onClick={() => setProjectCategory("unassigned")}>미담당 {Object.keys(games).length - assignedCount}</button></div>
        <input type="search" aria-label="프로젝트 검색" placeholder="프로젝트 검색" value={projectQuery} onChange={event => setProjectQuery(event.target.value)} />
        <div className="admin-member-card__project-list">{matchingGames.length ? matchingGames.map(([gameKey, game]) => <div className="admin-member-card__event-item" key={gameKey}><label><input type="checkbox" checked={assignments[gameKey]?.[uid] === true} onChange={async event => { try { await update(ref(database), { [`gameMembers/${gameKey}/${uid}`]: event.target.checked ? true : null, [`gameMemberParts/${gameKey}/${uid}`]: null }); } catch { onError("담당 프로젝트를 저장하지 못했습니다."); } }} />{game.title}</label>{assignments[gameKey]?.[uid] === true && <AssignmentPartSelect itemTitle={game.title} kind="프로젝트 담당" path={`gameMemberParts/${gameKey}/${uid}`} defaultPart={profile.part || "없음"} savedPart={assignmentParts[gameKey]?.[uid]} onError={onError} />}</div>) : <p>일치하는 프로젝트가 없습니다.</p>}</div>
      </details>
      <details className="admin-member-card__projects"><summary>참여 행사 {attendedCount}개 · {currentSemester || "전체 학기"} {score}점</summary>
        <label className="admin-member-card__semester-filter">학기<select value={semesterFilter} onChange={event => setSemesterFilter(event.target.value)}><option value="current">현재 학기 ({currentSemester || "미설정"})</option><option value="all">전체 학기</option>{semesters.filter(semester => semester !== currentSemester).map(semester => <option key={semester} value={semester}>{semester}</option>)}<option value="unassigned">미분류</option></select></label>
        <div className="admin-member-card__categories" role="group" aria-label="참여 행사 분류"><button type="button" aria-pressed={eventCategory === "all"} onClick={() => setEventCategory("all")}>전체 {semesterEvents.length}</button><button type="button" aria-pressed={eventCategory === "attended"} onClick={() => setEventCategory("attended")}>참여 {semesterAttendedCount}</button><button type="button" aria-pressed={eventCategory === "unattended"} onClick={() => setEventCategory("unattended")}>미참여 {semesterEvents.length - semesterAttendedCount}</button></div>
        <input type="search" aria-label="행사 검색" placeholder="행사 검색" value={eventQuery} onChange={event => setEventQuery(event.target.value)} />
        <div className="admin-member-card__semester-groups">{eventGroups.length ? eventGroups.map(group => <section key={group.semester} className="admin-member-card__semester-group"><h4>{group.semester}{group.semester === currentSemester && <span>현재 학기</span>}</h4><div className="admin-member-card__project-list">{group.items.map(([eventKey, event]) => <div className="admin-member-card__event-item" key={eventKey}><label><input type="checkbox" checked={participation[eventKey] === true} onChange={async change => { try { await update(ref(database), { [`eventParticipation/${uid}/${eventKey}`]: change.target.checked ? true : null, [`eventParticipationParts/${uid}/${eventKey}`]: null }); } catch { onError("행사 참여 기록을 저장하지 못했습니다."); } }} /><span>{event.title}<small>{eventDateLabel(event)} · 참여 시 {eventPoints(event)}점</small></span></label>{participation[eventKey] === true && <AssignmentPartSelect itemTitle={event.title} kind="행사 참여" path={`eventParticipationParts/${uid}/${eventKey}`} defaultPart={profile.part || "없음"} savedPart={participationParts[eventKey]} onError={onError} />}</div>)}</div></section>) : <p>일치하는 행사가 없습니다.</p>}</div>
      </details></fieldset>{view === "account" && <div className="admin-member-card__attendance"><AccountAttendance events={events} participation={participation} currentSemester={currentSemester} tagSettings={tagSettings} /><AnnualAttendance events={events} participation={participation} manualYears={profile.activityYears} currentYear={currentYear} visibleYears={visibleYears} /></div>}</>}
    </div>}
  </article>;
}

export default function AdminMembers({ preMemberRecords, users, roles, profiles, applicationStatus, events, eventParticipation, eventParticipationParts, currentSemester, currentYear, visibleYears, tagSettings, assignments, assignmentParts, games, onUpdatePerson, onError }: Props) {
  const [view, setView] = useState<"statistics" | "account" | "member">("statistics");
  const [query, setQuery] = useState("");
  const [partFilter, setPartFilter] = useState("all");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [memberSignupFilter, setMemberSignupFilter] = useState("all");
  const [activityYearFilter, setActivityYearFilter] = useState("all");
  const [activityScoreFilter, setActivityScoreFilter] = useState("all");
  const [selectedStatStatuses, setSelectedStatStatuses] = useState<Set<MemberStatus>>(() => new Set(MEMBER_STATUSES.filter(status => status.value !== "withdrawn").map(status => status.value)));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkField, setBulkField] = useState<"role" | "part" | "project" | "event">("part");
  const [bulkRole, setBulkRole] = useState("member");
  const [bulkPart, setBulkPart] = useState<string>(MEMBER_PARTS[0]);
  const [bulkProject, setBulkProject] = useState("");
  const [bulkEvent, setBulkEvent] = useState("");
  const [bulkMode, setBulkMode] = useState<"add" | "remove">("add");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesActivity = (participation: Record<string, boolean>) =>
    (activityYearFilter === "all" || recordedActivityYears(events, participation).includes(activityYearFilter))
    && (activityScoreFilter === "all" || activityScore(events, participation, currentSemester || undefined) === Number(activityScoreFilter));
  const activityYears = [...new Set([
    ...Object.keys(visibleYears).filter(year => visibleYears[year] === true),
    ...Object.values(events).map(event => event.reportYear || (/^\d{2}-[12]$/.test(event.semester || "") ? `20${event.semester?.slice(0, 2)}` : "")),
  ].filter(year => /^\d{4}$/.test(year)))].sort((a, b) => b.localeCompare(a));
  const activityScores = [...new Set([
    ...Object.keys(users).map(uid => activityScore(events, eventParticipation[uid] || {}, currentSemester || undefined)),
    ...Object.values(preMemberRecords).map(record => activityScore(events, record.eventKeys || {}, currentSemester || undefined)),
  ])].sort((a, b) => a - b);
  const members = Object.entries(users)
    .filter(([uid, person]) => {
      const role = uid === ADMIN_UID ? "admin" : roles[uid] === "member" ? "member" : "general";
      const status = applicationStatus[uid];
      const matchesQuery = !normalizedQuery || [person.nickname, person.realName, person.loginId, person.studentNumber].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
      const matchesRole = memberRoleFilter === "all" || memberRoleFilter === role;
      const memberSignup = uid === ADMIN_UID ? "admin" : person.registrationIntent === "member" ? status === "rejected" ? "rejected" : role === "member" || status === "approved" ? "approved" : "pending" : "general";
      const matchesApplication = memberSignupFilter === "all" || memberSignupFilter === memberSignup;
      const matchesPart = partFilter === "all" || memberPart(profiles[uid]?.part) === partFilter;
      const matchesMemberStatus = memberStatusFilter === "all" || (role === "member" && memberStatus(profiles[uid]?.status) === memberStatusFilter);
      return matchesQuery && matchesRole && matchesApplication && matchesPart && matchesMemberStatus && matchesActivity(eventParticipation[uid] || {});
    })
    .sort(([uidA, a], [uidB, b]) => uidA === ADMIN_UID ? -1 : uidB === ADMIN_UID ? 1 : (a.nickname || a.loginId || "").localeCompare(b.nickname || b.loginId || "", "ko"));
  const selectedAccounts = [...selectedIds].filter(uid => uid !== ADMIN_UID && Object.prototype.hasOwnProperty.call(users, uid));
  const selectedRecords = [...selectedIds].filter(key => key.startsWith("record:") && Object.prototype.hasOwnProperty.call(preMemberRecords, key.slice(7))).map(key => key.slice(7));
  const selectedCount = selectedAccounts.length + selectedRecords.length;
  const bulkRef = useScrollLag<HTMLDivElement>(undefined, selectedCount >= 2);
  const visibleRecords = Object.entries(preMemberRecords).filter(([, record]) => (!normalizedQuery || [record.name, record.studentNumber, record.linkedUid ? users[record.linkedUid]?.loginId : undefined].some(value => value?.toLocaleLowerCase().includes(normalizedQuery))) && (partFilter === "all" || memberPart(record.part) === partFilter) && (memberStatusFilter === "all" || memberStatus(record.status) === memberStatusFilter) && matchesActivity(record.eventKeys || {}));
  const visibleIds = [...(view === "account" ? [] : members.map(([uid]) => uid).filter(uid => uid !== ADMIN_UID)), ...(view === "account" ? visibleRecords.map(([id]) => `record:${id}`) : [])];
  const accountCount = Object.keys(users).length;
  const memberCount = Object.keys(users).filter(uid => roles[uid] === "member").length;
  const generalCount = Object.keys(users).filter(uid => uid !== ADMIN_UID && roles[uid] !== "member").length;
  const pendingCount = Object.keys(users).filter(uid => users[uid].registrationIntent === "member" && roles[uid] !== "member" && !applicationStatus[uid]).length;
  const visibleSelected = visibleIds.filter(uid => selectedIds.has(uid));
  const selectedProject = bulkProject || Object.keys(games)[0] || "";
  const selectedEvent = bulkEvent || Object.keys(events)[0] || "";
  const toggleSelection = (uid: string, checked: boolean) => {
    setSelectedIds(current => { const next = new Set(current); if (checked) next.add(uid); else next.delete(uid); return next; });
    setBulkMessage("");
  };
  const toggleVisible = () => {
    if (selectedCount > 0) {
      setSelectedIds(new Set());
      setBulkMessage("");
      return;
    }
    setSelectedIds(current => {
      const next = new Set(current);
      visibleIds.forEach(uid => next.add(uid));
      return next;
    });
    setBulkMessage("");
  };
  const changeView = (next: typeof view) => {
    setView(next);
    setSelectedIds(new Set());
    setBulkField(next === "member" ? "role" : "part");
    setBulkMessage("");
    setQuery("");
    setPartFilter("all");
    setMemberRoleFilter("all");
    setMemberStatusFilter("all");
    setMemberSignupFilter("all");
    setActivityYearFilter("all");
    setActivityScoreFilter("all");
  };
  const applyBulk = async () => {
    if (view !== "account" && view !== "member") return;
    if (!selectedCount || bulkBusy) return;
    if (bulkField === "role" && selectedRecords.length) { setBulkMessage("계정 없는 부원 정보에는 권한을 지정할 수 없습니다. 권한 변경은 계정만 선택해 주세요."); return; }
    if (bulkField === "project" && !selectedProject) { setBulkMessage("프로젝트를 선택해 주세요."); return; }
    if (bulkField === "event" && !selectedEvent) { setBulkMessage("행사를 선택해 주세요."); return; }
    const target = bulkField === "role" ? (bulkRole === "member" ? "부원" : "일반")
      : bulkField === "part" ? bulkPart
      : bulkField === "project" ? games[selectedProject]?.title : events[selectedEvent]?.title;
    if (!target) { setBulkMessage("변경할 항목을 다시 선택해 주세요."); return; }
    const action = bulkField === "role" ? `권한을 ${target}(으)로 변경` : bulkField === "part" ? `담당 파트를 ${target}(으)로 변경`
      : `${target} ${bulkField === "project" ? "담당 프로젝트" : "참여 행사"} ${bulkMode === "add" ? "추가" : "제거"}`;
    const names = [...selectedAccounts.map(uid => users[uid]?.nickname || users[uid]?.loginId || uid), ...selectedRecords.map(id => preMemberRecords[id].name)];
    if (!window.confirm(`${selectedCount}명에게 다음 변경을 적용할까요?\n\n${action}\n\n${names.slice(0, 8).join(", ")}${names.length > 8 ? ` 외 ${names.length - 8}명` : ""}`)) return;
    const changes: Record<string, string | boolean | null> = {};
    for (const uid of selectedAccounts) {
      if (bulkField === "role" && roles[uid] !== bulkRole) changes[`roles/${uid}`] = bulkRole;
      if (bulkField === "part" && memberPart(profiles[uid]?.part) !== bulkPart) changes[`memberProfiles/${uid}/part`] = bulkPart;
      if (bulkField === "project" && (assignments[selectedProject]?.[uid] === true) !== (bulkMode === "add")) {
        changes[`gameMembers/${selectedProject}/${uid}`] = bulkMode === "add" ? true : null;
        changes[`gameMemberParts/${selectedProject}/${uid}`] = null;
      }
      if (bulkField === "event" && (eventParticipation[uid]?.[selectedEvent] === true) !== (bulkMode === "add")) {
        changes[`eventParticipation/${uid}/${selectedEvent}`] = bulkMode === "add" ? true : null;
        changes[`eventParticipationParts/${uid}/${selectedEvent}`] = null;
      }
    }
    for (const id of selectedRecords) {
      const record = preMemberRecords[id];
      if (bulkField === "part" && memberPart(record.part) !== bulkPart) {
        changes[`memberRecords/${id}/part`] = bulkPart;
        if (record.linkedUid) changes[`memberProfiles/${record.linkedUid}/part`] = bulkPart;
      }
      if (bulkField === "project" && (record.projectKeys?.[selectedProject] === true) !== (bulkMode === "add")) {
        changes[`memberRecords/${id}/projectKeys/${selectedProject}`] = bulkMode === "add" ? true : null;
        changes[`memberRecords/${id}/projectParts/${selectedProject}`] = null;
        if (record.linkedUid) {
          changes[`gameMembers/${selectedProject}/${record.linkedUid}`] = bulkMode === "add" ? true : null;
          changes[`gameMemberParts/${selectedProject}/${record.linkedUid}`] = null;
        }
      }
      if (bulkField === "event" && (record.eventKeys?.[selectedEvent] === true) !== (bulkMode === "add")) {
        changes[`memberRecords/${id}/eventKeys/${selectedEvent}`] = bulkMode === "add" ? true : null;
        changes[`memberRecords/${id}/eventParts/${selectedEvent}`] = null;
        if (record.linkedUid) {
          changes[`eventParticipation/${record.linkedUid}/${selectedEvent}`] = bulkMode === "add" ? true : null;
          changes[`eventParticipationParts/${record.linkedUid}/${selectedEvent}`] = null;
        }
      }
    }
    if (!Object.keys(changes).length) { setBulkMessage("이미 모두 적용되어 있어 변경할 항목이 없습니다."); return; }
    setBulkBusy(true);
    try {
      await update(ref(database), changes);
      setBulkMessage(`${selectedCount}명에게 ${action}을 적용했습니다.`);
    } catch { onError("일괄 수정을 저장하지 못했습니다. 권한과 연결 상태를 확인해 주세요."); }
    finally { setBulkBusy(false); }
  };

  const accountRows = view === "account" ? [] : members.map(([uid, person]) => <MemberRow key={uid} view="member" uid={uid} person={person} role={roles[uid] || "general"} profile={profiles[uid] || {}} records={preMemberRecords} assignments={assignments} assignmentParts={assignmentParts} games={games} events={events} participation={eventParticipation[uid] || {}} participationParts={eventParticipationParts[uid] || {}} currentSemester={currentSemester} currentYear={currentYear} visibleYears={visibleYears} tagSettings={tagSettings} selected={selectedIds.has(uid)} selectionDisabled={bulkBusy} onSelectionChange={toggleSelection} onUpdatePerson={onUpdatePerson} onError={onError} />);
  const linkedUids = new Set(Object.values(preMemberRecords).map(record => record.linkedUid).filter((uid): uid is string => Boolean(uid)));
  const roster = [
    ...Object.keys(users).filter(uid => roles[uid] === "member" && !linkedUids.has(uid)).map(uid => ({ part: memberPart(profiles[uid]?.part), status: memberStatus(profiles[uid]?.status) })),
    ...Object.values(preMemberRecords).map(record => ({ part: memberPart(record.part), status: memberStatus(record.status) })),
  ];
  const filteredRoster = roster.filter(person => selectedStatStatuses.has(person.status));

  return <>
    <div className="admin-members__views" role="tablist" aria-label="부원 및 계정 정보 관리 메뉴">
      {([ ["statistics", "통계"], ["account", "부원정보"], ["member", "계정"] ] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={view === key} aria-controls="admin-members-view" onClick={() => changeView(key)}>{label}</button>)}
    </div>
    <div id="admin-members-view" role="tabpanel">
    <section className="modern-panel admin-members" aria-labelledby="admin-members-title">
    <div className="admin-members__heading"><div><h2 id="admin-members-title">{viewHeadings[view].title}</h2><p>{viewHeadings[view].description}</p></div></div>
    <div>
      {view === "statistics" && <div className="admin-members__statistics">
        <div className="admin-members__stat-grid"><div><span>전체 계정</span><strong>{accountCount}명</strong></div><div><span>부원 계정</span><strong>{memberCount}명</strong></div><div><span>일반 계정</span><strong>{generalCount}명</strong></div><div><span>계정 없는 부원</span><strong>{Object.values(preMemberRecords).filter(record => !record.linkedUid).length}명</strong></div><div><span>부원 승인 대기</span><strong>{pendingCount}건</strong></div></div>
      </div>}
      {view !== "statistics" && <>
        <fieldset className="admin-members__filter-panel"><legend>필터</legend><div className="admin-members__filters admin-members__filters--selects admin-members__filters--member">
          <label>검색<input type="search" placeholder="닉네임·본명·아이디·학번" value={query} onChange={event => setQuery(event.target.value)} /></label>
          {view === "member" && <label>권한<select value={memberRoleFilter} onChange={event => setMemberRoleFilter(event.target.value)}><option value="all">전체</option><option value="admin">관리자</option><option value="member">부원 계정</option><option value="general">일반 계정</option></select></label>}
          <label>부원 상태<select value={memberStatusFilter} onChange={event => setMemberStatusFilter(event.target.value)}><option value="all">전체</option>{MEMBER_STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          {view === "member" && <label>가입 상태<select value={memberSignupFilter} onChange={event => setMemberSignupFilter(event.target.value)}><option value="all">전체</option><option value="admin">관리자 계정</option><option value="approved">부원 승인</option><option value="pending">부원 승인 대기</option><option value="rejected">부원 반려</option><option value="general">일반 가입</option></select></label>}
          <label>담당 파트<select value={partFilter} onChange={event => setPartFilter(event.target.value)}><option value="all">전체</option>{MEMBER_PARTS.map(part => <option key={part} value={part}>{part}</option>)}</select></label>
          <label>활동 연도<select value={activityYearFilter} onChange={event => setActivityYearFilter(event.target.value)}><option value="all">전체</option>{activityYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
          <label>활동 점수 · {currentSemester || "전체 학기"}<select value={activityScoreFilter} onChange={event => setActivityScoreFilter(event.target.value)}><option value="all">전체</option>{activityScores.map(score => <option key={score} value={score}>{score}점</option>)}</select></label>
        </div>
        <div className="admin-members__selection"><button type="button" onClick={toggleVisible} disabled={(!visibleIds.length && !selectedCount) || bulkBusy}>{selectedCount > 0 ? "선택 취소" : "전체 선택"}</button><span>현재 목록 {visibleSelected.length}/{visibleIds.length}명 · 전체 선택 {selectedCount}명</span></div>
        </fieldset>
        {selectedCount >= 2 && <div ref={bulkRef} className="admin-members__bulk admin-members__bulk--floating" role="group" aria-label="일괄 수정">
          <div className="admin-members__bulk-title"><strong>일괄 수정 · {selectedCount}명</strong><small>필터를 바꿔도 선택 항목은 유지됩니다.</small></div>
          <div className="admin-members__bulk-controls">
            {view === "account" && <label>변경 항목<select value={bulkField} onChange={event => { setBulkField(event.target.value as typeof bulkField); setBulkMessage(""); }} disabled={bulkBusy}><option value="part">담당 파트</option><option value="project">담당 프로젝트</option><option value="event">참여 행사</option></select></label>}
            {bulkField === "part" && <label>담당 파트<select value={bulkPart} onChange={event => setBulkPart(event.target.value)} disabled={bulkBusy}>{MEMBER_PARTS.map(part => <option key={part} value={part}>{part}</option>)}</select></label>}
            {bulkField === "role" && <label>권한<select value={bulkRole} onChange={event => setBulkRole(event.target.value)} disabled={bulkBusy}><option value="member">부원</option><option value="general">일반</option></select></label>}
            {bulkField === "project" && <label>프로젝트<select value={selectedProject} onChange={event => setBulkProject(event.target.value)} disabled={bulkBusy}>{Object.entries(games).map(([key, game]) => <option key={key} value={key}>{game.title}</option>)}</select></label>}
            {bulkField === "event" && <label>행사<select value={selectedEvent} onChange={event => setBulkEvent(event.target.value)} disabled={bulkBusy}>{Object.entries(events).map(([key, event]) => <option key={key} value={key}>{event.title}</option>)}</select></label>}
            {(bulkField === "project" || bulkField === "event") && <label>적용 방식<select value={bulkMode} onChange={event => setBulkMode(event.target.value as typeof bulkMode)} disabled={bulkBusy}><option value="add">추가</option><option value="remove">제거</option></select></label>}
            <button type="button" onClick={() => void applyBulk()} disabled={!selectedCount || bulkBusy || (bulkField === "role" && selectedRecords.length > 0)}>{bulkBusy ? "적용 중..." : "변경 적용"}</button>
          </div>
          <p className="admin-members__bulk-message" role="status">{bulkMessage || "\u00a0"}</p>
        </div>}
        <fieldset className="admin-members__list"><legend>리스트</legend>{view === "account"
          ? <PreMemberRecords records={preMemberRecords} users={users} games={games} events={events} currentSemester={currentSemester} currentYear={currentYear} visibleYears={visibleYears} tagSettings={tagSettings} query={query} statusFilter={memberStatusFilter} partFilter={partFilter} activityYearFilter={activityYearFilter} activityScoreFilter={activityScoreFilter} selectedIds={selectedIds} selectionDisabled={bulkBusy} onSelectionChange={toggleSelection} />
          : accountRows.length ? accountRows : <p>일치하는 계정이 없습니다.</p>}
        </fieldset>
      </>}
    </div>
    </section>
    {view === "statistics" && <section className="modern-panel admin-members admin-members__part-section" aria-labelledby="admin-part-stats-title">
      <div className="admin-members__heading"><div><h3 id="admin-part-stats-title">부원 통계</h3><p>담당 파트와 부원 상태별 인원 수를 확인합니다.</p></div></div>
      <fieldset className="admin-members__stat-filters"><legend>필터</legend>{MEMBER_STATUSES.filter(status => status.value !== "withdrawn").map(status => <label key={status.value}><input type="checkbox" checked={selectedStatStatuses.has(status.value)} onChange={event => setSelectedStatStatuses(current => { const next = new Set(current); if (event.target.checked) next.add(status.value); else next.delete(status.value); return next; })} />{status.label}</label>)}</fieldset>
      <div className="admin-members__status-stats"><div className="admin-members__status-stat--total"><span>전체 부원</span><strong>{filteredRoster.length}명</strong></div>{MEMBER_STATUSES.filter(status => status.value !== "withdrawn" && selectedStatStatuses.has(status.value)).map(status => <div key={status.value} className={`admin-members__status-stat--${status.value}`}><span>{status.label}</span><strong>{filteredRoster.filter(person => person.status === status.value).length}명</strong></div>)}</div>
      <fieldset className="admin-members__part-stats"><legend>담당 파트</legend>{MEMBER_PARTS.map(part => <div key={part}><span className={`member-part-badge member-part-badge--${memberPartTone(part)}`}>{part}</span><strong>{filteredRoster.filter(person => person.part === part).length}명</strong></div>)}</fieldset>
    </section>}
    </div>
  </>;
}
