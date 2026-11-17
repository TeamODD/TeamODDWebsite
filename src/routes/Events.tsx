import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase";
import { useMemberRole } from "../auth/useMemberRole";
import "../styles/ModernPages.css";
import { useSiteLanguage, tr } from "../i18n/siteLanguage";
import { eventDateLabel, eventPoints, type ScoredEvent } from "../utils/activityScore";
export default function Events() {
  const [events,setEvents] = useState<Record<string,ScoredEvent>>({});
  const [links,setLinks] = useState<Record<string,string>>({});
  const { role } = useMemberRole();
  const language = useSiteLanguage();
  useEffect(()=>onValue(ref(database,"events"),s=>setEvents(s.val()||{})),[]);
  useEffect(()=>{
    if(role!=="member"&&role!=="admin") {setLinks({});return;}
    return onValue(ref(database,"eventSignupLinks"),s=>setLinks(s.val()||{}));
  },[role]);
  return <div className="modern-page"><header className="modern-page__hero"><span>TEAM ODD EVENTS</span><h1>{tr(language,"행사정보","Events")}</h1><p>{tr(language,"동아리의 행사 일정을 확인하세요.","Explore upcoming club events.")}</p></header><div className="modern-card-grid">{Object.entries(events).sort((a,b)=>a[1].date.localeCompare(b[1].date)).map(([key,event])=><article className="modern-panel" key={key}><time>{eventDateLabel(event)}</time><h2>{event.title}</h2><p>{event.description}</p><p>{tr(language,`참여 시 활동 점수 ${eventPoints(event)}점`,`Participation: ${eventPoints(event)} points`)}</p>{(role==="member"||role==="admin") && links[key] ? <a className="modern-action" href={links[key]} target="_blank" rel="noopener noreferrer">{tr(language,"행사 참가 신청 ↗","Register ↗")}</a> : role!=="member"&&role!=="admin" ? <span className="modern-note">{tr(language,"참가 신청은 승인된 부원에게 열립니다.","Registration is available to approved members.")}</span> : null}</article>)}{!Object.keys(events).length&&<div className="modern-panel"><h2>{tr(language,"등록된 행사가 없습니다","No events yet")}</h2><p>{tr(language,"새 행사 일정이 등록되면 이곳에서 확인할 수 있습니다.","New events will appear here.")}</p></div>}</div></div>;
}
