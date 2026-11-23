import { useState } from "react";
import type { ScoredEvent } from "../utils/activityScore";
import { EVENT_CATEGORIES, eventCategory } from "../utils/eventCategory";
import { DEFAULT_ATTENDANCE_TAG_SETTINGS, type AttendanceTagSettings } from "../utils/attendanceTags";

type Props = {
  events: Record<string, ScoredEvent>;
  participation: Record<string, boolean>;
  currentSemester: string;
  tagSettings?: AttendanceTagSettings;
};

export default function AccountAttendance({ events, participation, currentSemester, tagSettings = DEFAULT_ATTENDANCE_TAG_SETTINGS }: Props) {
  const [semester, setSemester] = useState("current");
  const semesters = [...new Set(Object.values(events).map(event => event.semester).filter((value): value is string => Boolean(value)))].sort((a, b) => b.localeCompare(a));
  const selectedSemester = semester === "current" ? currentSemester : semester === "all" ? "" : semester;
  const entries = Object.entries(events)
    .filter(([, event]) => !selectedSemester || (event.semester || "unassigned") === selectedSemester)
    .sort(([, a], [, b]) => b.date.localeCompare(a.date));
  const categoryCounts = EVENT_CATEGORIES.map(category => ({ ...category, count: entries.filter(([key, event]) => participation[key] === true && eventCategory(event.category) === category.value).length }))
    .filter(category => category.count > 0);
  const attended = categoryCounts.reduce((sum, category) => sum + category.count, 0);
  const categoryTags = categoryCounts.filter(category => {
    const total = entries.filter(([, event]) => eventCategory(event.category) === category.value).length;
    return category.count / total * 100 >= tagSettings.categoryFrom;
  });

  return <fieldset className="account-attendance"><legend>행사 참여 성향</legend>
    <div className="account-attendance__top"><div className="account-attendance__heading"><label>학기<select value={semester} onChange={event => setSemester(event.target.value)}><option value="current">현재 학기 ({currentSemester || "미설정"})</option><option value="all">전체 학기</option>{semesters.filter(value => value !== currentSemester).map(value => <option key={value} value={value}>{value}</option>)}<option value="unassigned">미분류</option></select></label></div>
    <div className="account-attendance__tags" aria-label="행사 참여 성향">{categoryTags.length ? categoryTags.map(category => <span key={category.value} className={`account-attendance__tag account-attendance__tag--${category.value}`}>{tagSettings.categoryNames[category.value]}</span>) : <span className="account-attendance__tag">{entries.length ? "아직 뚜렷한 참여 성향이 없습니다" : "집계할 행사가 없습니다"}</span>}</div></div>
    <div className="account-attendance-graph" role="img" aria-label={attended ? `참여 행사 분포: ${categoryCounts.map(category => `${category.label} ${category.count}개`).join(", ")}` : "참여한 행사가 없어 그래프가 비어 있습니다"}>
      <div className="account-attendance-graph__bar">{categoryCounts.map(category => <span key={category.value} className={`account-attendance-graph__segment account-attendance-graph__segment--${category.value}`} style={{ width: `${category.count / attended * 100}%` }} title={`${category.label} ${category.count}개`} />)}</div>
      <div className="account-attendance-graph__legend">{categoryCounts.map(category => <span key={category.value}><i className={`account-attendance-graph__key account-attendance-graph__key--${category.value}`} />{category.label} {category.count}개</span>)}{!attended && <span>참여한 행사가 없습니다.</span>}</div>
    </div>
  </fieldset>;
}
