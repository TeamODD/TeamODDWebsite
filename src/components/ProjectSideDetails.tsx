import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { FiAward, FiCheck, FiCheckCircle, FiCloud, FiEye, FiGlobe, FiInstagram, FiMonitor, FiShoppingCart, FiStar, FiUser, FiUsers, FiVolume2, FiYoutube, FiZap } from "react-icons/fi";
import type { Game } from "../types/game";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import { database } from "../firebase";
import { sortProjectDevelopers } from "../utils/projectDevelopers";
import { languageFlag } from "../utils/languageFlag";

const imagePath = projectAssetUrl;
const safeLink = (url?: string) => url && /^https:\/\//i.test(url) ? url : undefined;
const featureIcon = (label: string) => {
  if (/협동|멀티|가족|공유|친구|co.?op|multi/i.test(label)) return <FiUsers aria-hidden="true" />;
  if (/싱글|single|1인/i.test(label)) return <FiUser aria-hidden="true" />;
  if (/구매|결제|purchase|상점/i.test(label)) return <FiShoppingCart aria-hidden="true" />;
  if (/접근성|accessib|자막/i.test(label)) return <FiEye aria-hidden="true" />;
  if (/클라우드|cloud|저장/i.test(label)) return <FiCloud aria-hidden="true" />;
  if (/컨트롤|패드|gamepad/i.test(label)) return <FiMonitor aria-hidden="true" />;
  if (/음성|사운드|오디오|sound|audio/i.test(label)) return <FiVolume2 aria-hidden="true" />;
  if (/업적|도전|과제|achievement/i.test(label)) return <FiStar aria-hidden="true" />;
  if (/온라인|online/i.test(label)) return <FiGlobe aria-hidden="true" />;
  if (/실시간|real.?time/i.test(label)) return <FiZap aria-hidden="true" />;
  return <FiCheckCircle aria-hidden="true" />;
};

export default function ProjectSideDetails({game}: {game: Game}) {
  const developers = sortProjectDevelopers((game.developerProfiles || []).filter(person => person.name.trim()));
  const displayDevelopers: NonNullable<Game["developerProfiles"]> = developers.length ? developers : (game.developer || "").split(/[,·、\s]+/).filter(Boolean).map(name => ({name, part: "", avatarUrl: ""}));
  const avatarUids = useMemo(() => [...new Set((game.developerProfiles || []).filter(person => person.name.trim()).map(person => person.avatarUid || (person.source === "account" ? person.sourceId : "")).filter((uid): uid is string => Boolean(uid)))], [game.developerProfiles]);
  const [publicAvatars, setPublicAvatars] = useState<Record<string, string>>({});
  useEffect(() => {
    setPublicAvatars({});
    const subscriptions = avatarUids.map(uid => onValue(ref(database, `publicAvatars/${uid}`), snapshot => setPublicAvatars(current => ({...current, [uid]: typeof snapshot.val() === "string" ? snapshot.val() : ""}))));
    return () => subscriptions.forEach(off => off());
  }, [avatarUids]);
  const links = [
    {label: "Instagram", url: safeLink(game.socialLinks?.instagram), icon: <FiInstagram aria-hidden="true" />},
    {label: "YouTube", url: safeLink(game.socialLinks?.youtube), icon: <FiYoutube aria-hidden="true" />},
  ].filter(link => link.url);
  return <aside className="project-library__side-panels" aria-label="프로젝트 부가 정보">
    <section className="project-library__side-panel">
      <h2><FiUsers aria-hidden="true" />개발자 리스트</h2>
      <div className="project-library__developers">
      {displayDevelopers.length ? displayDevelopers.map((person, index) => <div className="project-library__developer" key={`${person.name}-${index}`}>
        <span className="project-library__developer-avatar">{(publicAvatars[person.avatarUid || (person.source === "account" ? person.sourceId || "" : "")] || person.avatarUrl) ? <img src={imagePath(publicAvatars[person.avatarUid || (person.source === "account" ? person.sourceId || "" : "")] || person.avatarUrl || "")} alt="" /> : <FiUser aria-hidden="true" />}</span>
        <span className="project-library__developer-identity"><strong>{person.name}</strong><small>{person.part || "파트 정보 없음"}</small></span>
      </div>) : <p>등록된 개발자가 없습니다.</p>}
      </div>
    </section>
    {!!game.featureTags?.length && <section className="project-library__side-panel project-library__side-panel--features"><h2>게임 기능</h2><div className="project-library__feature-list">{game.featureTags.map((tag, i) => <div className="project-library__feature" key={`${tag}-${i}`}><span className="project-library__feature-icon">{featureIcon(tag)}</span><span className="project-library__feature-label">{tag}</span></div>)}</div></section>}
    {!!game.supportedLanguages?.length && <section className="project-library__side-panel project-library__side-panel--languages"><h2><FiGlobe aria-hidden="true" /> 지원 언어</h2><div className="project-library__language-table-wrap"><table className="project-library__language-table"><thead><tr><th scope="col">언어</th><th scope="col">인터페이스</th><th scope="col">음성 지원</th><th scope="col">자막</th></tr></thead><tbody>{game.supportedLanguages.map((language, i) => {const support = game.languageSupport?.[language]; const flag = languageFlag(language); return <tr key={`${language}-${i}`}><th scope="row"><span className="project-library__language-name">{flag && <span className="project-library__language-flag" aria-hidden="true"><img src={`/flags/${flag}.svg`} alt="" /></span>}{language}</span></th><td>{(support?.interface ?? true) && <FiCheck aria-label="지원" />}</td><td>{support?.voice && <FiCheck aria-label="지원" />}</td><td>{support?.subtitles && <FiCheck aria-label="지원" />}</td></tr>;})}</tbody></table></div></section>}
    {links.length > 0 && <section className="project-library__side-panel"><h2>관련 링크</h2><div className="project-library__side-links">{links.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.icon}{link.label} ↗</a>)}</div></section>}
    {!!game.awards?.length && <section className="project-library__side-panel project-library__side-panel--awards"><h2><FiAward aria-hidden="true" /> 수상 내역</h2><ul className="project-library__award-list">{game.awards.map((award, i) => <li key={`${award}-${i}`}><FiAward aria-hidden="true" /><span>{award}</span></li>)}</ul></section>}
  </aside>;
}
