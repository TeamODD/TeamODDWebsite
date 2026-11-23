import { useEffect, useState, type FormEvent } from "react";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import { type AttendanceTagSettings as Settings } from "../utils/attendanceTags";
import { EVENT_CATEGORIES } from "../utils/eventCategory";

type Props = { settings: Settings; onMessage: (message: string) => void };

export default function AttendanceTagSettings({ settings, onMessage }: Props) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(settings), [settings]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const next = { ...draft, categoryNames: Object.fromEntries(Object.entries(draft.categoryNames).map(([key, name]) => [key, name.trim()])) as Settings["categoryNames"] };
    if (EVENT_CATEGORIES.some(category => !next.categoryNames[category.value]) || !Number.isInteger(next.categoryFrom) || next.categoryFrom < 1 || next.categoryFrom > 100) {
      onMessage("성향 태그 이름과 기준 비율을 확인해 주세요.");
      return;
    }
    setSaving(true);
    try { await set(ref(database, "siteSettings/attendanceTags"), next); onMessage("행사 참여 태그 설정을 저장했습니다."); }
    catch { onMessage("태그 설정을 저장하지 못했습니다. 데이터베이스 권한을 확인해 주세요."); }
    finally { setSaving(false); }
  };

  return <section className="modern-panel"><h2>행사 참여 성향 태그</h2><p>참여한 행사 유형을 바탕으로 부원 상세 화면에 표시할 성향 태그를 설정합니다.</p>
    <form className="modern-form modern-form--grid" onSubmit={save}>
      {EVENT_CATEGORIES.map(category => <label key={category.value}>{category.label} 성향 태그<input maxLength={30} required value={draft.categoryNames[category.value]} onChange={event => setDraft({ ...draft, categoryNames: { ...draft.categoryNames, [category.value]: event.target.value } })} /></label>)}
      <label>성향 태그 표시 기준 (%)<input type="number" min="1" max="100" required value={draft.categoryFrom} onChange={event => setDraft({ ...draft, categoryFrom: Number(event.target.value) })} /></label>
      <div className="modern-form__actions"><button type="submit" disabled={saving}>저장</button></div>
    </form>
    <p>선택한 학기에 해당 유형의 행사 중 설정한 비율 이상 참여하면 성향 태그가 표시됩니다.</p>
  </section>;
}
