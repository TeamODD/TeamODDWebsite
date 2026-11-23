import { useEffect, useState } from "react";
import type { ScoredEvent } from "../utils/activityScore";
import { ANNUAL_EVENT_GROUPS, annualEventSlot } from "../utils/annualAttendance";
import { recordedActivityYears, type ActivityYears } from "../utils/activityYears";

type Props = {
  events: Record<string, ScoredEvent>;
  participation: Record<string, boolean>;
  manualYears?: ActivityYears;
  visibleYears?: Record<string, boolean>;
  currentYear?: string;
};

export default function AnnualAttendance({ events, participation, manualYears, visibleYears = {}, currentYear = "" }: Props) {
  const configuredYears = Object.keys(visibleYears).filter(year => visibleYears[year] === true);
  const years = (configuredYears.length ? configuredYears : [...new Set(Object.values(events).map(event => event.reportYear).filter((year): year is string => Boolean(year)))]).sort((a, b) => b.localeCompare(a));
  const [chosenYear, setChosenYear] = useState(currentYear || "all");
  useEffect(() => { setChosenYear(currentYear || "all"); }, [currentYear]);
  const displayedYear = chosenYear !== "all" && years.includes(chosenYear) ? chosenYear : "";
  const yearEntries = Object.entries(events).filter(([, event]) => !displayedYear || event.reportYear === displayedYear);
  const activeYears = recordedActivityYears(events, participation, manualYears);

  return <fieldset className="annual-attendance"><legend>연간 행사 참여율</legend>
    <div className="annual-attendance__heading"><label className="annual-attendance__year">집계 연도<select value={displayedYear || "all"} onChange={event => setChosenYear(event.target.value)}><option value="all">전체 연도</option>{years.map(item => <option key={item} value={item}>{item}</option>)}</select></label><div className="annual-attendance__years"><span>참여 기록 연도</span><strong>{activeYears.length}개 연도</strong><small>{activeYears.length ? activeYears.join(" · ") : "참여 기록 없음"}</small></div></div>
    <div className="annual-attendance__groups">{ANNUAL_EVENT_GROUPS.map(group => <section key={group.label} className="annual-attendance__group"><h4>{group.label}</h4><div className="annual-attendance__rows">{group.items.map(item => {
      const matches = yearEntries.filter(([, event]) => annualEventSlot(event.annualSlot, event.semester) === item.value);
      const attended = matches.filter(([key]) => participation[key] === true).length;
      const rate = matches.length ? Math.round(attended / matches.length * 100) : 0;
      return <div key={item.value} className="annual-attendance__row" title={matches.map(([, event]) => event.title).join(", ") || "등록된 행사가 없습니다"}>
        <span>{item.label}</span><div className="annual-attendance__track" role="img" aria-label={matches.length ? `${item.label} ${attended}/${matches.length}개, ${rate}%` : `${item.label} 행사 미등록`}><i style={{ width: `${rate}%` }} /></div><strong>{matches.length ? group.label === "기타" ? `${attended}/${matches.length}회 · ${rate}%` : `${rate}%` : "행사 미등록"}</strong>
      </div>;
    })}</div></section>)}</div>
  </fieldset>;
}
