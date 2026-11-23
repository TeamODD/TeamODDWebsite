import type { Game } from "../types/game";
import "../styles/ProjectFeaturePicker.css";

const FEATURE_OPTIONS = [
  "싱글 플레이어", "로컬 멀티 플레이어", "온라인 멀티 플레이어", "로컬 협동", "온라인 협동",
  "컨트롤러 지원", "도전 과제", "클라우드 저장", "가족 공유", "접근성 기능",
  "자막 지원", "음성 지원", "오프라인 플레이", "실시간 대화", "앱 내 구매",
];

export default function ProjectFeaturePicker({selected, onChange}: {selected: NonNullable<Game["featureTags"]>; onChange: (value: string[]) => void}) {
  const available = FEATURE_OPTIONS.filter(option => !selected.includes(option));
  return <div className="project-feature-picker project-editor__wide">
    <label htmlFor="project-feature-select">게임 기능 <small>드롭다운에서 여러 개를 추가할 수 있습니다.</small></label>
    <select id="project-feature-select" value="" onChange={event => {if (event.target.value) onChange([...selected, event.target.value]);}}>
      <option value="">기능 선택</option>
      {available.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    {selected.length > 0 && <div className="project-feature-picker__selected">{selected.map((feature, index) => <div key={`${feature}-${index}`}><span>{feature}</span><button type="button" aria-label={`${feature} 삭제`} onClick={() => onChange(selected.filter((_, itemIndex) => itemIndex !== index))}>삭제</button></div>)}</div>}
  </div>;
}
