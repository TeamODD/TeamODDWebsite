import type { Game } from "../types/game";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import { sortProjectUpdates } from "../utils/projectUpdates";
import ProjectFileUpload from "./ProjectFileUpload";
import "../styles/ProjectUpdatesEditor.css";

type Updates = NonNullable<Game["updates"]>;

export default function ProjectUpdatesEditor({game, onChange, projectKey}: {game: Game; onChange: (updates: Updates) => void; projectKey: string}) {
  const updates = sortProjectUpdates(game.updates || []);
  const patch = (index: number, change: Partial<Updates[number]>) => onChange(sortProjectUpdates(updates.map((update, itemIndex) => itemIndex === index ? {...update, ...change} : update)));
  return <div className="project-updates-editor">
    {updates.map((update, index) => <div className="project-updates-editor__item" key={index}>
      <div className="project-updates-editor__heading"><strong>업데이트 {index + 1}</strong><button type="button" onClick={() => onChange(updates.filter((_, itemIndex) => itemIndex !== index))}>삭제</button></div>
      <div className="project-updates-editor__row"><label>제목<input required value={update.title} onChange={event => patch(index, {title: event.target.value})} placeholder="공지 제목" /></label><label>날짜<input type="date" value={update.date || ""} onChange={event => patch(index, {date: event.target.value})} /></label></div>
      <div className="project-updates-editor__image"><span>배너 이미지</span><img src={projectAssetUrl(update.imageUrl || game.imageUrl)} alt="업데이트 배너 미리보기" /><ProjectFileUpload projectKey={projectKey} imageOnly onUploaded={imageUrl => patch(index, {imageUrl})} /><small>이미지를 올리지 않으면 대표 이미지를 사용합니다.</small></div>
      <label>미리보기 글<textarea required rows={3} value={update.summary || ""} onChange={event => patch(index, {summary: event.target.value})} placeholder="프로젝트 페이지의 업데이트 카드에 보일 짧은 글" /></label>
      <label>상세 내용<textarea required rows={9} value={update.detail || ""} onChange={event => patch(index, {detail: event.target.value})} placeholder="카드를 클릭했을 때 보일 내용을 입력하세요. Enter로 줄바꿈할 수 있습니다." /></label>
    </div>)}
    <button className="project-updates-editor__add" type="button" onClick={() => {const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); onChange(sortProjectUpdates([{title: "", date: today, summary: "", detail: ""}, ...updates]));}}>+ 업데이트 추가</button>
  </div>;
}
