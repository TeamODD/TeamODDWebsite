import { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import type { ActivityYears } from "../utils/activityYears";

type Props = { years?: ActivityYears; path: string; onMessage: (message: string) => void };

export default function ActivityYearsEditor({ years = {}, path, onMessage }: Props) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const savedYears = Object.keys(years).filter(year => years[year] === true).sort();
  const change = async (year: string, add: boolean) => {
    setBusy(true);
    try { await set(ref(database, `${path}/${year}`), add ? true : null); setDraft(""); onMessage(""); }
    catch { onMessage("활동 연도를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  return <div className="activity-years-editor"><span>활동한 연도</span><div className="activity-years-editor__content"><div className="activity-years-editor__add"><input aria-label="추가할 활동 연도" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="예: 2025" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (/^\d{4}$/.test(draft) && !years[draft]) void change(draft, true); } }} /><button type="button" disabled={busy || !/^\d{4}$/.test(draft) || Boolean(years[draft])} onClick={() => void change(draft, true)}>추가</button></div><div className="activity-years-editor__list">{savedYears.map(year => <span key={year}>{year}<button type="button" disabled={busy} aria-label={`${year}년 활동 기록 삭제`} onClick={() => void change(year, false)}>×</button></span>)}{!savedYears.length && <small>직접 추가한 연도가 없습니다.</small>}</div></div></div>;
}
