import type { Game } from "../types/game";
import { resolveProjectDevelopers, type ProjectDeveloperSources } from "../utils/projectDevelopers";

type Props = { game: Game; onChange: (game: Game) => void; sources: ProjectDeveloperSources };
const split = (value: string) => value.split(",").map((part) => part.trim()).filter(Boolean);

export default function ProjectDetailsEditor({ game, onChange, sources }: Props) {
  const developers = game.developerProfiles || [];
  const resolved = resolveProjectDevelopers(game, sources);
  const choices = [
    ...Object.entries(sources.records).map(([id, record]) => ({value: `member:${id}`, label: `${record.name} · 부원 정보`, name: record.name, part: record.part})),
    ...Object.entries(sources.users).map(([id, user]) => ({value: `account:${id}`, label: `${user.realName || user.nickname || user.loginId || id} · 계정`, name: user.realName || user.nickname || user.loginId || id, part: sources.profiles[id]?.part || ""})),
  ].sort((a, b) => a.label.localeCompare(b.label, "ko"));
  return <fieldset className="admin-project-updates">
    <legend>프로젝트 부가 정보</legend>
    <p>계정 또는 부원 정보를 연결하세요. 공개 화면에는 이름과 담당 파트만 표시됩니다.</p>
    {developers.map((person, index) => <div className="admin-project-updates__item" key={index}>
      <label>연결할 사람<select value={person.source && person.sourceId ? `${person.source}:${person.sourceId}` : ""} onChange={e => {const choice=choices.find(item => item.value === e.target.value); const [source, sourceId] = e.target.value.split(":"); onChange({...game, developerProfiles: developers.map((item, i) => i === index ? choice ? {...item, source: source as "account" | "member", sourceId, name: choice.name, part: choice.part} : {...item, source: undefined, sourceId: undefined} : item)});}}><option value="">연결할 사람 선택</option>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>
      <span>{resolved[index]?.name || "미연결"} · {resolved[index]?.part || "파트 정보 없음"}</span>
      <label>프로필 이미지 (선택)<input value={person.avatarUrl || ""} onChange={e => onChange({...game, developerProfiles: developers.map((item, i) => i === index ? {...item, avatarUrl: e.target.value} : item)})} placeholder="/images/... 또는 https://..." /></label>
      <button type="button" onClick={() => onChange({...game, developerProfiles: developers.filter((_, i) => i !== index)})}>개발자 삭제</button>
    </div>)}
    <button type="button" onClick={() => onChange({...game, developerProfiles: [...developers, {name: "", part: "", avatarUrl: ""}]})}>개발자 추가</button>
    <label>게임 기능 태그 (쉼표로 구분)<input defaultValue={(game.featureTags || []).join(", ")} onChange={e => onChange({...game, featureTags: split(e.target.value)})} placeholder="예: 싱글 플레이어, 앱 내 구매, 접근성 기능" /></label>
    <label>지원 언어 (쉼표로 구분)<input defaultValue={(game.supportedLanguages || []).join(", ")} onChange={e => onChange({...game, supportedLanguages: split(e.target.value)})} placeholder="예: 한국어, 영어" /></label>
    <label>팀 인스타그램<input type="url" value={game.socialLinks?.instagram || ""} onChange={e => onChange({...game, socialLinks: {...game.socialLinks, instagram: e.target.value}})} placeholder="https://..." /></label>
    <label>팀 유튜브<input type="url" value={game.socialLinks?.youtube || ""} onChange={e => onChange({...game, socialLinks: {...game.socialLinks, youtube: e.target.value}})} placeholder="https://..." /></label>
    <label>수상 내역 (쉼표로 구분)<input defaultValue={(game.awards || []).join(", ")} onChange={e => onChange({...game, awards: split(e.target.value)})} placeholder="예: 2025 게임잼 대상" /></label>
  </fieldset>;
}
