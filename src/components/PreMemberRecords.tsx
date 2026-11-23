import { useEffect, useState, type FormEvent } from "react";
import { FiUser } from "react-icons/fi";
import { push, ref, remove, set, update } from "firebase/database";
import { database } from "../firebase";
import type { Game } from "../types/game";
import { activityScore, eventDateLabel, eventPoints, type ScoredEvent } from "../utils/activityScore";
import { MEMBER_PARTS, memberPart, memberPartTone } from "../utils/memberPart";
import { MEMBER_STATUSES, memberStatus, memberStatusLabel } from "../utils/memberStatus";
import AssignmentPartSelect from "./AssignmentPartSelect";
import AccountAttendance from "./AccountAttendance";
import AnnualAttendance from "./AnnualAttendance";
import type { AttendanceTagSettings } from "../utils/attendanceTags";
import { recordedActivityYears, type ActivityYears } from "../utils/activityYears";
import { temporaryDeveloperUpdates } from "../utils/projectDevelopers";
import "../styles/MemberPart.css";
import "../styles/MemberStatus.css";
import "../styles/PreMemberRecords.css";

export type PreMemberRecord = {
  name: string;
  linkedUid?: string;
  studentNumber?: string;
  part: string;
  status?: string;
  createdAt: number;
  projectKeys?: Record<string, boolean>;
  projectParts?: Record<string, string>;
  eventKeys?: Record<string, boolean>;
  eventParts?: Record<string, string>;
  activityYears?: ActivityYears;
};

type Props = {
  selectedIds: Set<string>;
  selectionDisabled: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  records: Record<string, PreMemberRecord>;
  users: Record<string, { loginId?: string }>;
  games: Record<string, Game>;
  events: Record<string, ScoredEvent>;
  currentSemester: string;
  currentYear: string;
  visibleYears: Record<string, boolean>;
  tagSettings: AttendanceTagSettings;
  query?: string;
  statusFilter?: string;
  partFilter?: string;
  activityYearFilter?: string;
  activityScoreFilter?: string;
};

const normalizedName = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const validStudentNumber = (value: string) => !value || /^[0-9]{6,12}$/.test(value);

function PreMemberRow({ id, record, users, games, events, currentSemester, currentYear, visibleYears, tagSettings, selected, selectionDisabled, onSelectionChange, onMessage }: {
  id: string;
  record: PreMemberRecord;
  users: Props["users"];
  games: Props["games"];
  events: Props["events"];
  currentSemester: string;
  currentYear: string;
  visibleYears: Record<string, boolean>;
  tagSettings: AttendanceTagSettings;
  selected: boolean;
  selectionDisabled: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onMessage: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [nameDraft, setNameDraft] = useState(record.name);
  const [studentDraft, setStudentDraft] = useState(record.studentNumber || "");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectCategory, setProjectCategory] = useState<"all" | "assigned" | "unassigned">("all");
  const [eventQuery, setEventQuery] = useState("");
  const [eventCategory, setEventCategory] = useState<"all" | "attended" | "unattended">("all");
  const [semesterFilter, setSemesterFilter] = useState("current");
  const [busy, setBusy] = useState(false);
  const projectKeys = record.projectKeys || {};
  const eventKeys = record.eventKeys || {};
  const part = memberPart(record.part);
  const assignedCount = Object.keys(games).filter(key => projectKeys[key] === true).length;
  const attendedCount = Object.keys(events).filter(key => eventKeys[key] === true).length;
  const score = activityScore(events, eventKeys, currentSemester || undefined);
  const activityYears = recordedActivityYears(events, eventKeys);
  const scoreTone = score === 0 ? "zero" : score >= 3 ? "gold" : "neutral";
  const visibleProjects = Object.entries(games).filter(([key, game]) =>
    game.title.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase())
    && (projectCategory === "all" || (projectKeys[key] === true) === (projectCategory === "assigned")));
  const selectedSemester = semesterFilter === "current" ? currentSemester : semesterFilter === "all" ? "" : semesterFilter;
  const semesterEvents = Object.entries(events).filter(([, event]) => !selectedSemester || (event.semester || "unassigned") === selectedSemester);
  const semesterAttendedCount = semesterEvents.filter(([key]) => eventKeys[key] === true).length;
  const semesters = [...new Set(Object.values(events).map(event => event.semester).filter((semester): semester is string => Boolean(semester)))].sort((a, b) => b.localeCompare(a));
  const visibleEvents = semesterEvents
    .filter(([key, event]) => event.title.toLocaleLowerCase().includes(eventQuery.trim().toLocaleLowerCase())
      && (eventCategory === "all" || (eventKeys[key] === true) === (eventCategory === "attended")))
    .sort(([keyA, a], [keyB, b]) => Number(eventKeys[keyB] === true) - Number(eventKeys[keyA] === true) || b.date.localeCompare(a.date));
  const eventGroups = [...new Set(visibleEvents.map(([, event]) => event.semester || "미분류"))]
    .sort((a, b) => a === currentSemester ? -1 : b === currentSemester ? 1 : b.localeCompare(a))
    .map(semester => ({ semester, items: visibleEvents.filter(([, event]) => (event.semester || "미분류") === semester) }));

  useEffect(() => { setNameDraft(record.name); }, [record.name]);
  useEffect(() => { setStudentDraft(record.studentNumber || ""); }, [record.studentNumber]);

  const saveField = async (field: "name" | "studentNumber", raw: string) => {
    const value = field === "name" ? raw.trim().replace(/\s+/g, " ") : raw.trim();
    const oldValue = field === "name" ? record.name : record.studentNumber || "";
    if (value === oldValue) return;
    if (field === "name" && (value.length < 2 || value.length > 50)) { setNameDraft(record.name); onMessage("본명은 2~50자로 입력해 주세요."); return; }
    if (field === "studentNumber" && !validStudentNumber(value)) { setStudentDraft(record.studentNumber || ""); onMessage("학번은 숫자 6~12자로 입력해 주세요."); return; }
    try { await set(ref(database, `memberRecords/${id}/${field}`), value || null); const revised = {...record, [field]: value}; const changes = temporaryDeveloperUpdates(games, id, revised); if (Object.keys(changes).length) await update(ref(database), changes); onMessage(""); }
    catch { if (field === "name") setNameDraft(record.name); else setStudentDraft(record.studentNumber || ""); onMessage("부원 정보를 변경하지 못했습니다."); }
  };
  const setPart = async (value: string) => {
    try { await update(ref(database), { [`memberRecords/${id}/part`]: value, ...(record.linkedUid ? { [`memberProfiles/${record.linkedUid}/part`]: value } : {}) }); onMessage(""); }
    catch { onMessage("담당 파트를 변경하지 못했습니다."); }
  };
  const setStatus = async (value: string) => {
    try { await update(ref(database), { [`memberRecords/${id}/status`]: value, ...(record.linkedUid ? { [`memberProfiles/${record.linkedUid}/status`]: value } : {}) }); onMessage(""); }
    catch { onMessage("부원 상태를 변경하지 못했습니다."); }
  };
  const toggleAssignment = async (kind: "projectKeys" | "eventKeys", key: string, checked: boolean) => {
    try {
      if (kind === "eventKeys") await update(ref(database), { [`memberRecords/${id}/eventKeys/${key}`]: checked ? true : null, [`memberRecords/${id}/eventParts/${key}`]: null, ...(record.linkedUid ? { [`eventParticipation/${record.linkedUid}/${key}`]: checked ? true : null, [`eventParticipationParts/${record.linkedUid}/${key}`]: null } : {}) });
      else await update(ref(database), { [`memberRecords/${id}/projectKeys/${key}`]: checked ? true : null, [`memberRecords/${id}/projectParts/${key}`]: null, ...(record.linkedUid ? { [`gameMembers/${key}/${record.linkedUid}`]: checked ? true : null, [`gameMemberParts/${key}/${record.linkedUid}`]: null } : {}) });
      onMessage("");
    } catch { onMessage(kind === "projectKeys" ? "담당 프로젝트를 변경하지 못했습니다." : "참여 행사 기록을 변경하지 못했습니다."); }
  };
  const deleteRecord = async () => {
    if (!window.confirm(`${record.name}님의 부원 정보를 삭제할까요?\n\n담당 프로젝트·참여 행사 기록도 함께 삭제되며, 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    try { await remove(ref(database, `memberRecords/${id}`)); onMessage(""); }
    catch { onMessage("부원 정보를 삭제하지 못했습니다."); }
    finally { setBusy(false); }
  };

  return <article className="pre-members__row">
    <div className="pre-members__top">
    <input className="admin-member-card__select" type="checkbox" aria-label={`${record.name} 부원 정보 선택`} checked={selected} disabled={selectionDisabled} onChange={event => onSelectionChange(id, event.target.checked)} />
    <button className="pre-members__summary" type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span className="pre-members__identity"><span className="member-list-avatar" aria-hidden="true"><FiUser /></span><span className="member-list-identity"><strong>{record.name}</strong><small>{record.studentNumber ? `학번 ${record.studentNumber}` : "학번 미등록"} · {record.linkedUid ? `계정 ${users[record.linkedUid]?.loginId || record.linkedUid}` : "계정 없음"}</small></span></span>
      <span className="pre-members__badges"><span className="admin-member-card__badge">부원</span><span className={`member-status-badge member-status-badge--${memberStatus(record.status)}`}>{memberStatusLabel(record.status)}</span><span className={`member-part-badge member-part-badge--${memberPartTone(part)}`}>{part}</span></span>
      <span className="pre-members__meta"><small>{currentSemester || "전체"}</small> <strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></span>
      <span className="pre-members__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    </div>
    {expanded && <div className="pre-members__detail"><fieldset className="admin-member-card__identity-panel"><legend>신원 정보</legend>
      <div className="pre-members__fields"><label>본명<input value={nameDraft} maxLength={50} onChange={event => setNameDraft(event.target.value)} onBlur={() => void saveField("name", nameDraft)} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label><label>학번<input inputMode="numeric" value={studentDraft} maxLength={12} placeholder="숫자 6~12자" onChange={event => setStudentDraft(event.target.value)} onBlur={() => void saveField("studentNumber", studentDraft)} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label><label>담당 파트<select value={part} onChange={event => void setPart(event.target.value)}>{MEMBER_PARTS.map(option => <option key={option} value={option}>{option}</option>)}</select></label><label>부원 상태<select value={memberStatus(record.status)} onChange={event => void setStatus(event.target.value)}>{MEMBER_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div className="admin-member-card__score"><span>활동 점수(자동 계산 · {currentSemester || "전체 학기"})</span><strong className={`admin-member-card__score-value admin-member-card__score-value--${scoreTone}`}>{score}점</strong></div></div>
      <div className="pre-members__activity-summary"><span>활동 연도(참여 행사 기준)</span><div className="activity-years-editor__list">{activityYears.length ? activityYears.map(year => <span key={year}>{year}</span>) : <small>참여 행사 없음</small>}</div></div>
      <details className="admin-member-card__projects"><summary>담당 프로젝트 {assignedCount}개</summary><div className="pre-members__project-toolbar"><input className="pre-members__search" type="search" aria-label="프로젝트 검색" placeholder="프로젝트 검색" value={projectQuery} onChange={event => setProjectQuery(event.target.value)} /><div className="admin-member-card__categories" role="group" aria-label="담당 프로젝트 분류"><button type="button" aria-pressed={projectCategory === "all"} onClick={() => setProjectCategory("all")}>전체 {Object.keys(games).length}</button><button type="button" aria-pressed={projectCategory === "assigned"} onClick={() => setProjectCategory("assigned")}>담당 중 {assignedCount}</button><button type="button" aria-pressed={projectCategory === "unassigned"} onClick={() => setProjectCategory("unassigned")}>미담당 {Object.keys(games).length - assignedCount}</button></div></div><div className="admin-member-card__project-list admin-member-card__project-list--single">{visibleProjects.length ? visibleProjects.map(([key, game]) => <div className="admin-member-card__event-item" key={key}><label><input type="checkbox" checked={projectKeys[key] === true} onChange={event => void toggleAssignment("projectKeys", key, event.target.checked)} />{game.title}</label>{projectKeys[key] === true && <AssignmentPartSelect itemTitle={game.title} kind="프로젝트 담당" path={`memberRecords/${id}/projectParts/${key}`} mirrorPath={record.linkedUid ? `gameMemberParts/${key}/${record.linkedUid}` : undefined} defaultPart={record.part} savedPart={record.projectParts?.[key]} onError={onMessage} />}</div>) : <p>일치하는 프로젝트가 없습니다.</p>}</div></details>
      <details className="admin-member-card__projects"><summary>참여 행사 {attendedCount}개 · {currentSemester || "전체 학기"} {score}점</summary><input className="pre-members__search" type="search" aria-label="행사 검색" placeholder="행사 검색" value={eventQuery} onChange={event => setEventQuery(event.target.value)} /><div className="pre-members__event-toolbar"><label className="admin-member-card__semester-filter"><select aria-label="학기" value={semesterFilter} onChange={event => setSemesterFilter(event.target.value)}><option value="current">현재 학기 ({currentSemester || "미설정"})</option><option value="all">전체 학기</option>{semesters.filter(semester => semester !== currentSemester).map(semester => <option key={semester} value={semester}>{semester}</option>)}<option value="unassigned">미분류</option></select></label><div className="admin-member-card__categories" role="group" aria-label="참여 행사 분류"><button type="button" aria-pressed={eventCategory === "all"} onClick={() => setEventCategory("all")}>전체 {semesterEvents.length}</button><button type="button" aria-pressed={eventCategory === "attended"} onClick={() => setEventCategory("attended")}>참여 {semesterAttendedCount}</button><button type="button" aria-pressed={eventCategory === "unattended"} onClick={() => setEventCategory("unattended")}>미참여 {semesterEvents.length - semesterAttendedCount}</button></div></div><div className="admin-member-card__semester-groups">{eventGroups.length ? eventGroups.map(group => <section key={group.semester} className="admin-member-card__semester-group"><h4>{group.semester}{group.semester === currentSemester && <span>현재 학기</span>}</h4><div className="admin-member-card__project-list admin-member-card__project-list--single">{group.items.map(([key, event]) => <div className="admin-member-card__event-item" key={key}><label><input type="checkbox" checked={eventKeys[key] === true} onChange={change => void toggleAssignment("eventKeys", key, change.target.checked)} /><span>{event.title}<small>{eventDateLabel(event)} · 참여 시 {eventPoints(event)}점</small></span></label>{eventKeys[key] === true && <AssignmentPartSelect itemTitle={event.title} kind="행사 참여" path={`memberRecords/${id}/eventParts/${key}`} mirrorPath={record.linkedUid ? `eventParticipationParts/${record.linkedUid}/${key}` : undefined} defaultPart={record.part} savedPart={record.eventParts?.[key]} onError={onMessage} />}</div>)}</div></section>) : <p>일치하는 행사가 없습니다.</p>}</div></details>
      </fieldset><div className="admin-member-card__attendance"><AccountAttendance events={events} participation={eventKeys} currentSemester={currentSemester} tagSettings={tagSettings} /><AnnualAttendance events={events} participation={eventKeys} currentYear={currentYear} visibleYears={visibleYears} /></div><div className="pre-members__actions"><button className="pre-members__delete" type="button" disabled={busy} onClick={() => void deleteRecord()}>정보 삭제</button></div>
    </div>}
  </article>;
}

export default function PreMemberRecords({ records, users, games, events, currentSemester, currentYear, visibleYears, tagSettings, query = "", statusFilter = "all", partFilter = "all", activityYearFilter = "all", activityScoreFilter = "all", selectedIds, selectionDisabled, onSelectionChange }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [part, setPart] = useState("없음");
  const [status, setStatus] = useState("active");
  const [createProjectKeys, setCreateProjectKeys] = useState<Set<string>>(() => new Set());
  const [createEventKeys, setCreateEventKeys] = useState<Set<string>>(() => new Set());
  const [createProjectQuery, setCreateProjectQuery] = useState("");
  const [createEventQuery, setCreateEventQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const entries = Object.entries(records)
    .filter(([, record]) => (!normalizedQuery || [record.name, record.studentNumber, record.linkedUid ? users[record.linkedUid]?.loginId : undefined].some(value => value?.toLocaleLowerCase().includes(normalizedQuery))) && (statusFilter === "all" || memberStatus(record.status) === statusFilter) && (partFilter === "all" || memberPart(record.part) === partFilter) && (activityYearFilter === "all" || recordedActivityYears(events, record.eventKeys || {}).includes(activityYearFilter)) && (activityScoreFilter === "all" || activityScore(events, record.eventKeys || {}, currentSemester || undefined) === Number(activityScoreFilter)))
    .sort(([, a], [, b]) => b.createdAt - a.createdAt);
  const availableProjects = Object.entries(games).filter(([, game]) => game.title.toLocaleLowerCase().includes(createProjectQuery.trim().toLocaleLowerCase()));
  const availableEvents = Object.entries(events).filter(([, event]) => event.title.toLocaleLowerCase().includes(createEventQuery.trim().toLocaleLowerCase()))
    .sort(([, a], [, b]) => Number(b.semester === currentSemester) - Number(a.semester === currentSemester) || b.date.localeCompare(a.date));
  const createRecord = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    const number = studentNumber.trim();
    if (normalized.length < 2 || normalized.length > 50) { setMessage("본명은 2~50자로 입력해 주세요."); return; }
    if (!validStudentNumber(number)) { setMessage("학번은 숫자 6~12자로 입력해 주세요."); return; }
    if (Object.values(records).some(record => normalizedName(record.name) === normalizedName(normalized) && record.studentNumber === number) && !window.confirm("같은 이름과 학번의 부원 정보가 있습니다. 새로 추가할까요?")) return;
    const key = push(ref(database, "memberRecords")).key;
    if (!key) { setMessage("부원 정보를 만들지 못했습니다."); return; }
    setBusy(true);
    try {
      await set(ref(database, `memberRecords/${key}`), {
        name: normalized, ...(number ? { studentNumber: number } : {}), part, status, createdAt: Date.now(),
        ...(createProjectKeys.size ? { projectKeys: Object.fromEntries([...createProjectKeys].filter(projectKey => games[projectKey]).map(projectKey => [projectKey, true])) } : {}),
        ...(createEventKeys.size ? { eventKeys: Object.fromEntries([...createEventKeys].filter(eventKey => events[eventKey]).map(eventKey => [eventKey, true])) } : {}),
      });
      const changes = temporaryDeveloperUpdates(games, key, {name: normalized, studentNumber: number, part, createdAt: Date.now()});
      if (Object.keys(changes).length) await update(ref(database), changes);
      setName(""); setStudentNumber(""); setPart("없음"); setStatus("active"); setCreateProjectKeys(new Set()); setCreateEventKeys(new Set()); setCreateProjectQuery(""); setCreateEventQuery(""); setCreating(false);
      setMessage("");
    } catch { setMessage("부원 정보를 추가하지 못했습니다."); }
    finally { setBusy(false); }
  };
  return <>
    <div className="pre-members__add-row"><span className="pre-members__add-slot" aria-hidden="true" /><button className="pre-members__add" type="button" aria-expanded={creating} onClick={() => setCreating(value => !value)} disabled={busy}><span className="pre-members__add-identity"><span className="pre-members__add-icon" aria-hidden="true">+</span><span className="member-list-identity"><strong>부원 정보 추가하기</strong><small>계정 없는 부원 정보를 등록합니다.</small></span></span></button></div>
    {creating && <form className="pre-members__create" onSubmit={event => void createRecord(event)}>
      <label>본명<input required minLength={2} maxLength={50} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>학번 (선택)<input inputMode="numeric" pattern="[0-9]{6,12}" maxLength={12} value={studentNumber} onChange={event => setStudentNumber(event.target.value)} placeholder="숫자 6~12자" /></label>
      <label>담당 파트<select value={part} onChange={event => setPart(event.target.value)}>{MEMBER_PARTS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
      <label>부원 상태<select value={status} onChange={event => setStatus(event.target.value)}>{MEMBER_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <div className="pre-members__create-assignments">
        <details><summary>담당 프로젝트 {createProjectKeys.size}개</summary><input type="search" aria-label="추가할 담당 프로젝트 검색" placeholder="프로젝트 검색" value={createProjectQuery} onChange={event => setCreateProjectQuery(event.target.value)} /><div className="pre-members__create-options">{availableProjects.length ? availableProjects.map(([projectKey, game]) => <label key={projectKey}><input type="checkbox" checked={createProjectKeys.has(projectKey)} onChange={change => setCreateProjectKeys(current => { const next = new Set(current); if (change.target.checked) next.add(projectKey); else next.delete(projectKey); return next; })} />{game.title}</label>) : <p>일치하는 프로젝트가 없습니다.</p>}</div></details>
        <details><summary>참여 행사 {createEventKeys.size}개</summary><input type="search" aria-label="추가할 참여 행사 검색" placeholder="행사 검색" value={createEventQuery} onChange={event => setCreateEventQuery(event.target.value)} /><div className="pre-members__create-options">{availableEvents.length ? availableEvents.map(([eventKey, item]) => <label key={eventKey}><input type="checkbox" checked={createEventKeys.has(eventKey)} onChange={change => setCreateEventKeys(current => { const next = new Set(current); if (change.target.checked) next.add(eventKey); else next.delete(eventKey); return next; })} /><span>{item.title}<small>{item.semester || "미분류"} · {eventDateLabel(item)} · {eventPoints(item)}점</small></span></label>) : <p>일치하는 행사가 없습니다.</p>}</div></details>
      </div>
      <div className="pre-members__create-actions"><button type="submit" disabled={busy}>부원 정보 추가</button><button type="button" onClick={() => setCreating(false)} disabled={busy}>취소</button></div>
    </form>}
    {message && <p className="pre-members__message" role="status">{message}</p>}
    {entries.map(([id, record]) => <PreMemberRow key={id} id={id} record={record} users={users} games={games} events={events} currentSemester={currentSemester} currentYear={currentYear} visibleYears={visibleYears} tagSettings={tagSettings} selected={selectedIds.has(`record:${id}`)} selectionDisabled={selectionDisabled} onSelectionChange={(recordId, checked) => onSelectionChange(`record:${recordId}`, checked)} onMessage={setMessage} />)}
  </>;
}
