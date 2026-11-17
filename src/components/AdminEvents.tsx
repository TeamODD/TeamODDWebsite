import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { ref, set, update } from "firebase/database";
import { database } from "../firebase";
import { eventDateLabel, eventPoints, validSemester, type EventParticipation, type ScoredEvent } from "../utils/activityScore";
import "../styles/AdminEvents.css";

export type AdminEvent = ScoredEvent & { sortOrder?: number };
type EventDraft = ScoredEvent & { signupUrl: string };
type Props = {
  events: Record<string, AdminEvent>;
  signupLinks: Record<string, string>;
  participation: EventParticipation;
  currentSemester: string;
  onMessage: (message: string) => void;
};

const emptyDraft = (semester = ""): EventDraft => ({ title: "", description: "", date: "", endDate: "", semester, activityPoints: 1, signupUrl: "" });

function EventForm({ draft, onChange, onSubmit, onCancel, onDelete, busy }: {
  draft: EventDraft;
  onChange: (draft: EventDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  busy: boolean;
}) {
  return <form className="admin-event-form" onSubmit={onSubmit}>
    <label className="admin-event-form__wide">행사명<input required maxLength={100} value={draft.title} onChange={event => onChange({ ...draft, title: event.target.value })} /></label>
    <label>시작일<input type="date" required value={draft.date} onChange={event => onChange({ ...draft, date: event.target.value })} /></label>
    <label>종료일 <small>하루 행사라면 비워두세요</small><input type="date" min={draft.date || undefined} value={draft.endDate || ""} onChange={event => onChange({ ...draft, endDate: event.target.value })} /></label>
    <label>학기 <small>날짜와 별도로 지정</small><input required pattern="[0-9]{2}-[12]" placeholder="예: 25-2" value={draft.semester || ""} onChange={event => onChange({ ...draft, semester: event.target.value })} /></label>
    <label>참여 활동 점수<input type="number" min="0" max="100" step="1" required value={draft.activityPoints ?? 1} onChange={event => onChange({ ...draft, activityPoints: Number(event.target.value) })} /></label>
    <label className="admin-event-form__wide">안내<textarea required maxLength={2000} value={draft.description} onChange={event => onChange({ ...draft, description: event.target.value })} /></label>
    <label className="admin-event-form__wide">신청 링크<input type="url" maxLength={1000} placeholder="https://..." value={draft.signupUrl} onChange={event => onChange({ ...draft, signupUrl: event.target.value })} /></label>
    <div className="admin-event-form__actions"><button type="submit" disabled={busy}>{busy ? "저장 중..." : "저장"}</button><button className="admin-event-form__cancel" type="button" disabled={busy} onClick={onCancel}>취소</button>{onDelete && <button className="admin-event-row__delete" type="button" disabled={busy} onClick={onDelete}>삭제</button>}</div>
  </form>;
}

export default function AdminEvents({ events, signupLinks, participation, currentSemester, onMessage }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [termDraft, setTermDraft] = useState(currentSemester);

  useEffect(() => setTermDraft(currentSemester), [currentSemester]);

  const entries = Object.entries(events).sort(([keyA, a], [keyB, b]) => {
    const aOrdered = Number.isInteger(a.sortOrder);
    const bOrdered = Number.isInteger(b.sortOrder);
    if (aOrdered !== bOrdered) return aOrdered ? -1 : 1;
    if (aOrdered && bOrdered && a.sortOrder !== b.sortOrder) return (b.sortOrder || 0) - (a.sortOrder || 0);
    return b.date.localeCompare(a.date) || keyB.localeCompare(keyA);
  });

  const closeEditor = () => { setAdding(false); setEditingKey(null); setDraft(emptyDraft(currentSemester)); };
  const openCreate = () => { setEditingKey(null); setDraft(emptyDraft(currentSemester)); setAdding(true); };
  const openEdit = (key: string, event: AdminEvent) => {
    if (editingKey === key) { closeEditor(); return; }
    setAdding(false);
    setEditingKey(key);
    setDraft({ title: event.title, description: event.description, date: event.date, endDate: event.endDate || "", semester: event.semester || "", activityPoints: eventPoints(event), signupUrl: signupLinks[key] || "" });
  };

  const saveCurrentSemester = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const value = termDraft.trim();
    if (!validSemester(value)) { onMessage("학기는 25-1처럼 입력해 주세요."); return; }
    setBusy(true);
    try { await set(ref(database, "siteSettings/currentSemester"), value); onMessage("현재 학기를 저장했습니다."); }
    catch { onMessage("현재 학기를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const saveEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (busy) return;
    if (draft.endDate && draft.endDate < draft.date) { onMessage("종료일은 시작일 이후로 선택해 주세요."); return; }
    if (!validSemester(draft.semester || "")) { onMessage("행사 학기는 25-1처럼 입력해 주세요."); return; }
    const key = editingKey || String(Date.now());
    const previous = events[key];
    const highestOrder = Math.max(0, ...Object.values(events).map(event => Number.isInteger(event.sortOrder) ? event.sortOrder as number : 0));
    const sortOrder = editingKey ? previous?.sortOrder : highestOrder + 1;
    setBusy(true);
    try {
      await update(ref(database), {
        [`events/${key}`]: {
          title: draft.title.trim(), description: draft.description.trim(), date: draft.date,
          ...(draft.endDate ? { endDate: draft.endDate } : {}),
          semester: draft.semester,
          activityPoints: draft.activityPoints,
          ...(sortOrder !== undefined ? { sortOrder } : {}),
        },
        [`eventSignupLinks/${key}`]: draft.signupUrl.trim() || null,
      });
      onMessage(editingKey ? "행사를 수정했습니다." : "행사를 추가했습니다.");
      closeEditor();
    } catch { onMessage("행사를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const deleteEvent = async (key: string) => {
    if (!window.confirm("이 행사를 삭제할까요? 참여 기록과 활동 점수에서도 제외됩니다.")) return;
    setBusy(true);
    try {
      await update(ref(database), {
        [`events/${key}`]: null,
        [`eventSignupLinks/${key}`]: null,
        ...Object.fromEntries(Object.entries(participation).filter(([, items]) => items?.[key]).map(([uid]) => [`eventParticipation/${uid}/${key}`, null])),
      });
      onMessage("행사를 삭제했습니다.");
      if (editingKey === key) closeEditor();
    } catch { onMessage("행사를 삭제하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const moveEvent = async (fromKey: string, toKey: string) => {
    if (fromKey === toKey || busy) return;
    const keys = entries.map(([key]) => key);
    const from = keys.indexOf(fromKey);
    const to = keys.indexOf(toKey);
    if (from < 0 || to < 0) return;
    keys.splice(from, 1);
    keys.splice(to, 0, fromKey);
    setBusy(true);
    try {
      await update(ref(database), Object.fromEntries(keys.map((key, index) => [`events/${key}/sortOrder`, keys.length - index])));
      onMessage("행사 순서를 저장했습니다.");
    } catch { onMessage("행사 순서를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const onDragStart = (event: DragEvent<HTMLButtonElement>, key: string) => {
    setDraggedKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  };

  return <section className="modern-panel admin-events" aria-labelledby="admin-events-title">
    <header className="admin-events__heading"><div><h2 id="admin-events-title">행사 목록</h2><p>위에 있는 행사가 먼저 표시됩니다. 핸들을 끌거나 화살표로 순서를 바꿀 수 있습니다.</p></div><span>{entries.length}개</span></header>
    <form className="admin-events__semester" onSubmit={saveCurrentSemester}><label>현재 학기<input required pattern="[0-9]{2}-[12]" placeholder="예: 25-2" value={termDraft} onChange={event => setTermDraft(event.target.value)} /></label><button type="submit" disabled={busy || termDraft.trim() === currentSemester}>저장</button><p>행사의 날짜와 관계없이 운영진이 지정한 학기를 사용합니다.</p></form>
    <div className="admin-events__create">
      <button type="button" className="admin-events__create-trigger" aria-expanded={adding} onClick={() => adding ? closeEditor() : openCreate()}><span aria-hidden="true">＋</span> 새 행사 추가</button>
      {adding && <EventForm draft={draft} onChange={setDraft} onSubmit={saveEvent} onCancel={closeEditor} busy={busy} />}
    </div>
    <div className="admin-events__list">{entries.length ? entries.map(([key, event], index) => {
      const participants = Object.values(participation).filter(items => items?.[key] === true).length;
      return <article key={key} className={`admin-event-row${draggedKey === key ? " is-dragging" : ""}`} onDragOver={dragEvent => { if (draggedKey && draggedKey !== key) dragEvent.preventDefault(); }} onDrop={dropEvent => { dropEvent.preventDefault(); const source = draggedKey || dropEvent.dataTransfer.getData("text/plain"); setDraggedKey(null); void moveEvent(source, key); }}>
        <div className="admin-event-row__top">
          <button type="button" className="admin-event-row__handle" draggable aria-label={`${event.title} 끌어서 순서 변경`} title="끌어서 순서 변경" onDragStart={dragEvent => onDragStart(dragEvent, key)} onDragEnd={() => setDraggedKey(null)}>⠿</button>
          <button type="button" className="admin-event-row__summary" aria-expanded={editingKey === key} onClick={() => openEdit(key, event)}><strong>{event.title}</strong><small>{event.semester || "학기 미지정"} · {eventDateLabel(event)} · 참여 시 {eventPoints(event)}점 · 참여 {participants}명</small></button>
          <div className="admin-event-row__moves"><button type="button" aria-label={`${event.title} 위로 이동`} title="위로 이동" disabled={busy || index === 0} onClick={() => void moveEvent(key, entries[index - 1][0])}>↑</button><button type="button" aria-label={`${event.title} 아래로 이동`} title="아래로 이동" disabled={busy || index === entries.length - 1} onClick={() => void moveEvent(key, entries[index + 1][0])}>↓</button></div>
        </div>
        {editingKey === key && <div className="admin-event-row__detail"><EventForm draft={draft} onChange={setDraft} onSubmit={saveEvent} onCancel={closeEditor} onDelete={() => void deleteEvent(key)} busy={busy} /></div>}
      </article>;
    }) : <p className="admin-events__empty">등록된 행사가 없습니다.</p>}</div>
  </section>;
}
