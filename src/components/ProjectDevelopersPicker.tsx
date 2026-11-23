import { useState } from "react";
import type { PreMemberRecord } from "./PreMemberRecords";
import type { Game } from "../types/game";
import { sameDeveloperIdentity, sortProjectDevelopers } from "../utils/projectDevelopers";
import "../styles/ProjectDevelopersPicker.css";

type Props = { game: Game; records: Record<string, PreMemberRecord>; onChange: (patch: Partial<Game>) => void; loading: boolean; error: boolean };

export default function ProjectDevelopersPicker({game, records, onChange, loading, error}: Props) {
  const [addMode, setAddMode] = useState<"choose" | "member" | "temporary" | null>(null);
  const [query, setQuery] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempNumber, setTempNumber] = useState("");
  const [message, setMessage] = useState("");
  const developers = sortProjectDevelopers(game.developerProfiles || []);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const choices = Object.entries(records).filter(([id, record]) =>
    !developers.some(person => person.source === "member" && person.sourceId === id)
    && (!normalizedQuery || [record.name, record.studentNumber, record.part].some(value => value?.toLocaleLowerCase().includes(normalizedQuery)))
  ).sort(([,a],[,b]) => a.name.localeCompare(b.name,"ko")).slice(0, 30);

  const apply = (next: NonNullable<Game["developerProfiles"]>) => {const sorted = sortProjectDevelopers(next); onChange({developerProfiles: sorted, developer: sorted.map(person => person.name).join(", ")});};
  const addMember = (id: string, record: PreMemberRecord) => {
    apply([...developers, {name: record.name, part: record.part || "", studentNumber: record.studentNumber, source: "member", sourceId: id, avatarUid: record.linkedUid || ""}]);
    setQuery(""); setAddMode(null); setMessage("");
  };
  const addTemporary = () => {
    const name = tempName.trim().replace(/\s+/g," ");
    const studentNumber = tempNumber.trim();
    if (name.length < 2 || name.length > 50 || !/^[0-9]{6,12}$/.test(studentNumber)) {setMessage("이름은 2~50자, 학번은 숫자 6~12자로 입력해 주세요."); return;}
    if (developers.some(person => person.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() && person.studentNumber === studentNumber)) {setMessage("이미 추가한 제작자입니다."); return;}
    const match = Object.entries(records).find(([,record]) => sameDeveloperIdentity(name, studentNumber, record));
    if (match) addMember(match[0], match[1]);
    else {apply([...developers,{name, studentNumber, part: ""}]); setMessage("부원 정보가 생기면 이름과 학번을 확인해 자동 연결합니다.");}
    setTempName(""); setTempNumber(""); setAddMode(null);
  };

  return <div className="project-developers project-editor__wide">
    <div className="project-developers__heading"><strong>제작 표기</strong><small>기획 → 프로그래밍 → 아트, 같은 파트는 학번과 이름순으로 표시됩니다.</small></div>
    <button className="project-developers__add-row" type="button" aria-expanded={addMode !== null} onClick={() => setAddMode(mode => mode === null ? "choose" : null)}><strong>+ 제작자 추가</strong><span aria-hidden="true">{addMode === null ? "▾" : "▴"}</span></button>
    {addMode === "choose" && <div className="project-developers__choices"><button type="button" onClick={() => setAddMode("member")}>부원 정보에서 추가</button><button type="button" onClick={() => setAddMode("temporary")}>임시 제작자 추가</button></div>}
    {addMode === "member" && <div className="project-developers__dropdown"><button className="project-developers__back" type="button" onClick={() => setAddMode("choose")}>← 추가 방식 선택</button><input type="search" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="이름, 학번, 파트 검색" aria-label="부원 정보 검색" />{loading ? <p>부원 정보를 불러오는 중입니다.</p> : error ? <p>부원 정보를 읽을 수 없습니다. 권한을 확인해 주세요.</p> : <div className="project-developers__options">{choices.map(([id,record]) => <button type="button" key={id} onClick={() => addMember(id,record)}><strong>{record.name}</strong><span>{record.part || "파트 정보 없음"} · {record.studentNumber ? `학번 ${record.studentNumber}` : "학번 미등록"}</span></button>)}{!choices.length && <p>일치하는 부원 정보가 없습니다.</p>}</div>}</div>}
    {addMode === "temporary" && <div className="project-developers__temporary"><button className="project-developers__back" type="button" onClick={() => setAddMode("choose")}>← 추가 방식 선택</button><label>이름<input value={tempName} maxLength={50} onChange={event => setTempName(event.target.value)} placeholder="실명" /></label><label>학번<input value={tempNumber} maxLength={12} inputMode="numeric" onChange={event => setTempNumber(event.target.value)} placeholder="숫자 6~12자" /></label><button type="button" onClick={addTemporary}>추가</button></div>}
    {!!developers.length && <div className="project-developers__selected">{developers.map((person,index) => <div className="project-developers__person" key={`${person.sourceId || person.studentNumber || person.name}-${index}`}><span><strong>{person.name}</strong><small>{person.part || (person.source ? "파트 정보 없음" : `임시 · 학번 ${person.studentNumber || "미등록"}`)}</small></span><button type="button" aria-label={`${person.name} 삭제`} onClick={() => apply(developers.filter((_,itemIndex) => itemIndex !== index))}>삭제</button></div>)}</div>}
    {!developers.length && <p className="project-developers__legacy">{game.developer ? `현재 표기: ${game.developer}` : "추가한 제작자가 없습니다."}</p>}
    {message && <p className="project-developers__message" role="status">{message}</p>}
  </div>;
}
