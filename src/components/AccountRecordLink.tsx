import { useState } from "react";
import { get, ref, update } from "firebase/database";
import { database } from "../firebase";
import type { Game } from "../types/game";
import type { ScoredEvent } from "../utils/activityScore";
import { memberPart } from "../utils/memberPart";
import { memberStatus } from "../utils/memberStatus";
import type { PreMemberRecord } from "./PreMemberRecords";

type Props = {
  uid: string;
  accountName: string;
  role: string;
  studentNumber?: string;
  records: Record<string, PreMemberRecord>;
  games: Record<string, Game>;
  events: Record<string, ScoredEvent>;
  onError: (message: string) => void;
};

export default function AccountRecordLink({ uid, accountName, role, studentNumber, records, games, events, onError }: Props) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const linkedEntry = Object.entries(records).find(([, record]) => record.linkedUid === uid);
  const linkedRecord = linkedEntry?.[1];
  const matches = Object.entries(records).filter(([, record]) => !record.linkedUid && normalizedQuery && [record.name, record.studentNumber].some(value => value?.toLocaleLowerCase().includes(normalizedQuery))).slice(0, 20);

  const link = async () => {
    const record = records[selectedId];
    if (!record || record.linkedUid || busy) return;
    const nameMismatch = record.name.trim().toLocaleLowerCase() !== accountName.trim().toLocaleLowerCase();
    const numberMismatch = record.studentNumber && studentNumber && record.studentNumber !== studentNumber;
    if (!window.confirm(`${record.name}님의 부원 정보를 ${accountName || "본명 미등록"} 계정에 연결할까요?${linkedRecord ? `\n\n기존 연결: ${linkedRecord.name}님의 부원 정보` : ""}\n\n부원 기록을 유지하면서 활동 내역을 계정에도 반영하고 부원 권한을 부여합니다.${nameMismatch || numberMismatch ? "\n\n주의: 본명 또는 학번이 다릅니다." : ""}`)) return;
    setBusy(true);
    try {
      const [latestRecord, latestAccount] = await Promise.all([get(ref(database, `memberRecords/${selectedId}`)), get(ref(database, `users/${uid}`))]);
      if (!latestRecord.exists() || !latestAccount.exists() || latestRecord.child("linkedUid").exists()) throw new Error("missing-or-linked-record");
      const current = latestRecord.val() as PreMemberRecord;
      const changes: Record<string, string | boolean | null> = {
        [`memberProfiles/${uid}/part`]: memberPart(current.part),
        [`memberProfiles/${uid}/status`]: memberStatus(current.status),
        [`roles/${uid}`]: "member",
        [`memberApplicationStatus/${uid}`]: "approved",
        [`memberRecords/${selectedId}/linkedUid`]: uid,
      };
      if (linkedEntry) {
        changes[`memberRecords/${linkedEntry[0]}/linkedUid`] = null;
        for (const key of Object.keys(linkedRecord?.projectKeys || {})) if (linkedRecord?.projectKeys?.[key] === true) {
          changes[`gameMembers/${key}/${uid}`] = null;
          changes[`gameMemberParts/${key}/${uid}`] = null;
        }
        for (const key of Object.keys(linkedRecord?.eventKeys || {})) if (linkedRecord?.eventKeys?.[key] === true) {
          changes[`eventParticipation/${uid}/${key}`] = null;
          changes[`eventParticipationParts/${uid}/${key}`] = null;
        }
      }
      for (const year of Object.keys(current.activityYears || {})) if (current.activityYears?.[year] === true) changes[`memberProfiles/${uid}/activityYears/${year}`] = true;
      for (const key of Object.keys(current.projectKeys || {})) if (current.projectKeys?.[key] === true && games[key]) {
        changes[`gameMembers/${key}/${uid}`] = true;
        changes[`gameMemberParts/${key}/${uid}`] = current.projectParts?.[key] ? memberPart(current.projectParts[key]) : null;
      }
      for (const key of Object.keys(current.eventKeys || {})) if (current.eventKeys?.[key] === true && events[key]) {
        changes[`eventParticipation/${uid}/${key}`] = true;
        changes[`eventParticipationParts/${uid}/${key}`] = current.eventParts?.[key] ? memberPart(current.eventParts[key]) : null;
      }
      await update(ref(database), changes);
      setSelectedId("");
      setQuery("");
      setEditing(false);
    } catch { onError("부원 정보 연결에 실패했습니다. 데이터와 권한을 확인해 주세요."); }
    finally { setBusy(false); }
  };

  if ((linkedRecord || role === "member") && !editing) return <fieldset className="account-record-link account-record-link--connected"><legend>부원 정보</legend><div className="account-record-link__connected-row"><div><strong>{linkedRecord?.name || accountName || "이름 미등록"}</strong><span>{linkedRecord ? "이미 등록된 부원 · 계정 연결 완료" : "부원 계정 · 연결된 부원 기록 없음"}</span></div><button type="button" onClick={() => setEditing(true)}>수정</button></div></fieldset>;

  return <fieldset className="account-record-link"><legend>{linkedRecord ? "부원 정보 연결 변경" : "부원 정보 연결"}</legend>
    {linkedRecord && <p className="account-record-link__current">현재 연결: {linkedRecord.name}</p>}
    <label>이름 또는 학번으로 부원 정보 검색<input type="search" value={query} onChange={event => { setQuery(event.target.value); setSelectedId(""); }} placeholder="이름 또는 학번" /></label>
    {normalizedQuery && <div className="account-record-link__candidates">{matches.map(([id, record]) => <button key={id} type="button" className={selectedId === id ? "is-selected" : ""} onClick={() => setSelectedId(id)}><span><strong>{record.name}</strong><small>{record.studentNumber ? `학번 ${record.studentNumber}` : "학번 미등록"}</small></span><span>{memberPart(record.part)}</span></button>)}{matches.length === 0 && <p>일치하는 부원 정보가 없습니다.</p>}</div>}
    <div className="account-record-link__actions"><button className="account-record-link__submit" type="button" disabled={!selectedId || busy} onClick={() => void link()}>{busy ? "연결 중..." : linkedRecord ? "연결 변경" : "선택한 부원 정보 연결"}</button>{editing && <button type="button" onClick={() => { setEditing(false); setQuery(""); setSelectedId(""); }}>취소</button>}</div>
  </fieldset>;
}
