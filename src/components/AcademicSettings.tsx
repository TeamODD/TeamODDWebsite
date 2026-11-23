import { useEffect, useState, type FormEvent } from "react";
import { ref, set, update } from "firebase/database";
import { database } from "../firebase";
import type { ScoredEvent } from "../utils/activityScore";
import "../styles/AcademicSettings.css";

type Props = {
  events: Record<string, ScoredEvent>;
  visibleYears: Record<string, boolean>;
  currentYear: string;
  currentSemester: string;
  onMessage: (message: string) => void;
};

export default function AcademicSettings({ events, visibleYears, currentYear, currentSemester, onMessage }: Props) {
  const eventYears = [...new Set(Object.values(events).map(event => event.reportYear).filter((year): year is string => Boolean(year && /^\d{4}$/.test(year))))];
  const configuredYears = Object.keys(visibleYears).filter(year => visibleYears[year] === true && /^\d{4}$/.test(year));
  const years = (configuredYears.length ? configuredYears : [...new Set([...eventYears, currentYear || `20${currentSemester.slice(0, 2)}`].filter(year => /^\d{4}$/.test(year)))])
    .sort((a, b) => b.localeCompare(a));
  const effectiveYear = currentYear || (currentSemester ? `20${currentSemester.slice(0, 2)}` : years[0] || "");
  const [yearDraft, setYearDraft] = useState("");
  const [selectedYear, setSelectedYear] = useState(effectiveYear);
  const [selectedHalf, setSelectedHalf] = useState(currentSemester.endsWith("-1") ? "1" : "2");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSelectedYear(effectiveYear); }, [effectiveYear]);
  useEffect(() => { setSelectedHalf(currentSemester.endsWith("-1") ? "1" : "2"); }, [currentSemester]);

  const saveYears = async (nextYears: string[]) => {
    setBusy(true);
    try { await set(ref(database, "siteSettings/visibleYears"), Object.fromEntries(nextYears.map(year => [year, true]))); onMessage(""); }
    catch { onMessage("표시 연도를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };
  const addYear = async (event: FormEvent) => {
    event.preventDefault();
    const value = yearDraft.trim();
    if (!/^\d{4}$/.test(value) || years.includes(value)) return;
    await saveYears([...years, value]);
    setYearDraft("");
  };
  const removeYear = (year: string) => {
    if (year === effectiveYear || years.length <= 1) return;
    void saveYears(years.filter(item => item !== year));
  };
  const saveCurrent = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(selectedYear) || !years.includes(selectedYear)) return;
    const semester = `${selectedYear.slice(2)}-${selectedHalf}`;
    setBusy(true);
    try {
      await update(ref(database), { "siteSettings/currentYear": selectedYear, "siteSettings/currentSemester": semester });
      onMessage("");
    } catch { onMessage("현재 연도와 학기를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  return <section className="modern-panel academic-settings"><h2>연도·학기 설정</h2><p>연간 참여율에서 선택할 연도와 현재 연도·학기를 관리합니다.</p>
    <div className="academic-settings__years"><h3>표시 연도</h3><div className="academic-settings__chips">{years.map(year => <span key={year}>{year}{year === effectiveYear ? <small>현재</small> : <button type="button" aria-label={`${year} 표시 연도 제거`} disabled={busy} onClick={() => removeYear(year)}>×</button>}</span>)}</div>
      <form onSubmit={event => void addYear(event)}><input aria-label="추가할 표시 연도" inputMode="numeric" maxLength={4} placeholder="예: 2027" value={yearDraft} onChange={event => setYearDraft(event.target.value)} /><button type="submit" disabled={busy || !/^\d{4}$/.test(yearDraft.trim()) || years.includes(yearDraft.trim())}>연도 추가</button></form>
    </div>
    <form className="academic-settings__current" onSubmit={event => void saveCurrent(event)}><label>현재 연도<select value={selectedYear} onChange={event => setSelectedYear(event.target.value)}>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label><label>현재 학기<select value={selectedHalf} onChange={event => setSelectedHalf(event.target.value)}><option value="1">1학기</option><option value="2">2학기</option></select></label><button type="submit" disabled={busy || !selectedYear || (selectedYear === effectiveYear && `${selectedYear.slice(2)}-${selectedHalf}` === currentSemester)}>저장</button></form>
  </section>;
}
