import type { Game } from "../types/game";
import { VERSION_ACTIONS, VERSION_STAGES, sortProjectVersions, validVersionNumber, versionFields, versionLabel, type ProjectVersion } from "../utils/projectVersions";
import "../styles/ProjectVersionsEditor.css";

const parseParts = (number: string) => number.split(".").map(part => Number(part) || 0);

export default function ProjectVersionsEditor({ game, onChange }: { game: Game; onChange: (game: Game) => void; projectKey?: string }) {
  const versions = sortProjectVersions(game.versions || []);
  const changeVersions = (next: ProjectVersion[]) => {const sorted = sortProjectVersions(next); onChange({ ...game, versions: sorted, link: sorted[0]?.url.trim() || "" });};
  const update = (index: number, patch: Partial<ProjectVersion>) => changeVersions(versions.map((version, itemIndex) => {
    if (itemIndex !== index) return version;
    const fields = versionFields(version);
    const next = {...version, ...fields, ...patch};
    return {...next, label: versionLabel(next.number, next.stage)};
  }));
  const changePart = (index: number, part: number, value: string) => {
    const version = versions[index];
    const {stage, number} = versionFields(version);
    const parts = parseParts(number);
    parts[part] = Math.max(0, Number(value) || 0);
    if (part === 0 && stage !== "Release") parts[0] = 0;
    update(index, {number: parts.join(".")});
  };

  return <fieldset className="project-versions"><legend>다운로드 버전</legend>
    <p>버전 번호가 높은 순으로 정렬됩니다. 맨 위 버전의 링크가 기본 다운로드 주소가 됩니다.</p>
    <div className="project-versions__guide" aria-label="버전 번호 안내">
      <div><strong>Major · 첫째 자리</strong><span>큰 변화나 호환성을 깨는 변경</span><small>예: 대규모 시스템 개편</small></div>
      <div><strong>Minor · 둘째 자리</strong><span>기능 추가 및 확장</span><small>예: 새로운 스테이지, 캐릭터 추가</small></div>
      <div><strong>Patch · 셋째 자리</strong><span>버그 수정 및 작은 개선</span><small>예: 충돌 판정 오류, UI 수정</small></div>
    </div>
    <p className="project-versions__hint">정식 출시 전에는 Major를 0으로 사용합니다. 표시 예: <strong>v0.2.3-Alpha</strong></p>
    {versions.map((version, index) => {
      const {stage, number, action} = versionFields(version);
      const parts = parseParts(number);
      return <div className="project-versions__item" key={index}>
        <div className="project-versions__item-heading"><strong>{versionLabel(number, stage)}</strong><button type="button" onClick={() => changeVersions(versions.filter((_, itemIndex) => itemIndex !== index))}>버전 삭제</button></div>
        <div className="project-versions__row">
          <label>개발 단계<select value={stage} onChange={event => {const nextStage = event.target.value as ProjectVersion["stage"]; const nextNumber = nextStage === "Release" ? number : [0, parts[1], parts[2]].join("."); update(index, {stage: nextStage, number: nextNumber});}}>{VERSION_STAGES.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="project-versions__number"><span>버전 번호</span><div>{parts.map((value, part) => <label key={part}>{["Major", "Minor", "Patch"][part]}<input type="number" min="0" max={part === 0 && stage !== "Release" ? "0" : undefined} step="1" inputMode="numeric" value={value} onChange={event => changePart(index, part, event.target.value)} /></label>)}</div></div>
        </div>
        {!validVersionNumber(number, stage) && <p className="project-versions__error">세 자리 버전 번호를 확인해 주세요. 정식 출시 전 Major는 0이어야 합니다.</p>}
        <div className="project-versions__row">
          <label>링크 버튼 종류<select value={action} onChange={event => update(index, {action: event.target.value as ProjectVersion["action"]})}>{VERSION_ACTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>{VERSION_ACTIONS.find(item => item.value === action)?.description}</small></label>
          <label>연결할 링크<input type="url" required value={version.url} placeholder="https://..." onChange={event => update(index, {url: event.target.value})} /></label>
        </div>
      </div>;
    })}
    <button className="project-versions__add" type="button" onClick={() => changeVersions([{label: "v0.0.0-Prototype", stage: "Prototype", number: "0.0.0", action: "download", url: ""}, ...versions])}>+ 버전 추가</button>
  </fieldset>;
}
