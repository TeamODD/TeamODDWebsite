import { useEffect, useState, type FormEvent } from "react";
import { onValue, ref, remove, set, update } from "firebase/database";
import { database } from "../firebase";
import type { Game } from "../types/game";
import "../styles/ModernPages.css";
import HomeProjectEditor from "../components/HomeProjectEditor";
import AdminMembers from "../components/AdminMembers";
import AdminEvents, { type AdminEvent } from "../components/AdminEvents";
import type { EventParticipation } from "../utils/activityScore";
import { Link } from "react-router-dom";
import { getPendingCounts } from "../utils/adminPending";

type Banner = { title: string; description: string; imageSrc: string };
type Person = { nickname?: string; realName?: string; loginId?: string; registrationIntent?: string };
const emptyGame = (): Game => ({ id:0,title:"",description:"",detail:"",platform:"",engine:"",year:String(new Date().getFullYear()),project:"",imageUrl:"",link:"",developer:"",reviewPolicy:"off" });
const emptyBanner = (): Banner => ({ title:"",description:"",imageSrc:"" });
const starterBanners: Record<string,Banner> = {
  "01": { title:"Team ODD 경진대회 안내", description:"함께 만든 게임으로 실력을 겨루고, 서로의 아이디어를 나누는 자리입니다.", imageSrc:"/images/home-preview/banners/home-preview-banner-competition-001.webp" },
  "02": { title:"동아리 행사", description:"Team ODD 구성원들이 모여 게임과 개발 이야기를 나누는 행사입니다.", imageSrc:"/images/home-preview/banners/home-preview-banner-club-event-001.webp" },
  "03": { title:"게임잼", description:"짧은 시간 동안 아이디어를 모아 하나의 게임으로 완성해 봅니다.", imageSrc:"/images/home-preview/banners/home-preview-banner-game-jam-001.webp" },
};

export default function AdminConsole() {
  const [tab,setTab] = useState("games");
  const [games,setGames] = useState<Record<string,Game>>({});
  const [banners,setBanners] = useState<Record<string,Banner>>({});
  const [events,setEvents] = useState<Record<string,AdminEvent>>({});
  const [joinLink,setJoinLink] = useState("");
  const [eventLinks,setEventLinks] = useState<Record<string,string>>({});
  const [eventParticipation,setEventParticipation] = useState<EventParticipation>({});
  const [currentSemester,setCurrentSemester] = useState("");
  const [users,setUsers] = useState<Record<string,Person>>({});
  const [roles,setRoles] = useState<Record<string,string>>({});
  const [profiles,setProfiles] = useState<Record<string,{part?:string;activityScore?:number}>>({});
  const [assignments,setAssignments] = useState<Record<string,Record<string,boolean>>>({});
  const [submissions,setSubmissions] = useState<Record<string,Record<string,{displayName:string;body:string;createdAt:number}>>>({});
  const [applicationStatus,setApplicationStatus] = useState<Record<string,string>>({});
  const [editing,setEditing] = useState<string | null>(null);
  const [game,setGame] = useState<Game>(emptyGame);
  const [banner,setBanner] = useState<Banner>(emptyBanner);
  const [message,setMessage] = useState("");

  useEffect(() => {
    const subscriptions = [
      onValue(ref(database,"games"),s => setGames(s.val() || {})),
      onValue(ref(database,"banners"),s => setBanners(s.val() || {})),
      onValue(ref(database,"events"),s => setEvents(s.val() || {})),
      onValue(ref(database,"join"),s => setJoinLink(typeof s.val()==="string"?s.val():"")),
      onValue(ref(database,"eventSignupLinks"),s => setEventLinks(s.val() || {})),
      onValue(ref(database,"eventParticipation"),s => setEventParticipation(s.val() || {})),
      onValue(ref(database,"siteSettings/currentSemester"),s => setCurrentSemester(typeof s.val()==="string"?s.val():"")),
      onValue(ref(database,"users"),s => setUsers(s.val() || {})),
      onValue(ref(database,"roles"),s => setRoles(s.val() || {})),
      onValue(ref(database,"memberProfiles"),s => setProfiles(s.val() || {})),
      onValue(ref(database,"gameMembers"),s => setAssignments(s.val() || {})),
      onValue(ref(database,"reviewSubmissions"),s => setSubmissions(s.val() || {})),
      onValue(ref(database,"memberApplicationStatus"),s => setApplicationStatus(s.val() || {})),
    ];
    return () => subscriptions.forEach(off => off());
  },[]);

  const save = async (path:string, value:unknown) => {
    try { await set(ref(database,path),value); setEditing(null); if(path.startsWith("games/"))setGame(emptyGame()); if(path.startsWith("banners/"))setBanner(emptyBanner()); setMessage("저장했습니다."); }
    catch { setMessage("저장하지 못했습니다. 권한과 입력값을 확인해 주세요."); }
  };
  const drop = async (path:string) => {
    if (!window.confirm("이 항목을 삭제할까요?")) return;
    try { await remove(ref(database,path)); setMessage("삭제했습니다."); }
    catch { setMessage("삭제하지 못했습니다."); }
  };
  const updatePerson = async (uid:string, path:string, value:unknown) => {
    try { await set(ref(database,`${path}/${uid}`),value); setMessage("저장했습니다."); }
    catch { setMessage("부원 정보를 저장하지 못했습니다."); }
  };
  const moderate = async (gameKey:string, uid:string, approve:boolean) => {
    const entry = submissions[gameKey]?.[uid]; if (!entry) return;
    try { await update(ref(database),{[`reviewSubmissions/${gameKey}/${uid}`]:null,...(approve?{[`reviews/${gameKey}/${uid}`]:entry}:{})}); setMessage(approve?"리뷰를 공개했습니다.":"리뷰를 반려했습니다."); }
    catch { setMessage("리뷰를 처리하지 못했습니다."); }
  };
  const saveGame = () => {
    const id=editing?game.id:Date.now();
    void save(`games/${editing||id}`,{...game,id});
  };
  const fields = ["title","description","detail","platform","engine","year","project","imageUrl","link","developer"] as const;
  const labels:Record<string,string> = {title:"제목",description:"설명",detail:"상세 설명",platform:"플랫폼",engine:"엔진",year:"연도",project:"프로젝트 구분",imageUrl:"이미지 경로",link:"다운로드 URL",developer:"제작자"};
  const pending = getPendingCounts(submissions,users,roles,applicationStatus);

  return <div className="modern-page admin-modern"><header className="modern-page__hero"><h1>Team ODD 대시보드</h1><p>프로젝트, 배너, 행사와 부원 권한을 관리합니다.</p></header>
    <div className="admin-pending-header"><section className={`admin-pending-summary${pending.total > 0 ? " has-pending" : ""}`} aria-labelledby="admin-pending-title"><div><h2 id="admin-pending-title">처리 대기</h2><p>운영진 여러분들이 확인해주셔야 하는 사항들입니다.</p></div><strong aria-label={`처리 대기 ${pending.total}건`}>{pending.total}<span>건</span></strong><Link to="/admin/pending">자세히 보기 <span aria-hidden="true">→</span></Link></section></div>
    <div className="admin-workspace"><nav className="modern-tabs admin-sidebar" aria-label="관리 메뉴">{[["members","계정·부원"],["games","프로젝트"],["featured","홈 프로젝트"],["banners","홈 배너"],["events","행사"],["join","가입 안내"],["reviews","리뷰 승인"]].map(([key,label]) => <button key={key} type="button" className={tab===key?"is-active":""} aria-pressed={tab===key} onClick={() => {setTab(key);setEditing(null);}}>{label}</button>)}</nav><div className="admin-workspace__content">
    {message && <p className="modern-message" role="status">{message}</p>}
    {tab==="featured"&&<HomeProjectEditor games={games}/>}
    {tab==="games" && <><section className="modern-panel"><h2>{editing?"프로젝트 수정":"프로젝트 등록"}</h2><form className="modern-form modern-form--grid" onSubmit={(e:FormEvent) => {e.preventDefault();saveGame();}}>{fields.map(field => <label key={field}>{labels[field]}{field==="description"||field==="detail"?<textarea value={String(game[field]||"")} onChange={e=>setGame({...game,[field]:e.target.value})}/>:<input value={String(game[field]||"")} required={field!=="link"} onChange={e=>setGame({...game,[field]:e.target.value})}/>}</label>)}<label>리뷰 허용<select value={game.reviewPolicy||"off"} onChange={e=>setGame({...game,reviewPolicy:e.target.value as Game["reviewPolicy"]})}><option value="off">허용 안 함</option><option value="everyone">모두</option><option value="account">인증된 계정</option><option value="member">승인된 부원</option></select></label><div className="modern-form__actions"><button>저장</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setGame(emptyGame());}}>취소</button>}</div></form></section><section className="modern-panel"><h2>등록된 프로젝트</h2>{Object.entries(games).map(([key,item])=><div className="modern-row" key={key}><strong>{item.title}</strong><span>{item.year}</span><button onClick={()=>{setEditing(key);setGame({...emptyGame(),...item});window.scrollTo(0,0);}}>수정</button><button onClick={()=>void drop(`games/${key}`)}>삭제</button></div>)}</section></>}
    {tab==="banners"&&<><section className="modern-panel"><h2>{editing?"배너 수정":"배너 추가"}</h2><form className="modern-form" onSubmit={e=>{e.preventDefault();void save(`banners/${editing||Date.now()}`,banner);}}><label>제목<input required value={banner.title} onChange={e=>setBanner({...banner,title:e.target.value})}/></label><label>설명<textarea value={banner.description} onChange={e=>setBanner({...banner,description:e.target.value})}/></label><label>이미지 경로<input required placeholder="/images/home-preview/banners/..." value={banner.imageSrc} onChange={e=>setBanner({...banner,imageSrc:e.target.value})}/></label><div className="modern-form__actions"><button>저장</button></div></form></section><section className="modern-panel"><h2>홈 배너</h2>{!Object.keys(banners).length&&<button className="modern-action" onClick={()=>void update(ref(database),Object.fromEntries(Object.entries(starterBanners).map(([key,item])=>[`banners/${key}`,item])))}>현재 보이는 기본 배너를 편집 목록으로 가져오기</button>}{Object.entries(banners).map(([key,item])=><div className="modern-row" key={key}><strong>{item.title}</strong><button onClick={()=>{setEditing(key);setBanner(item);window.scrollTo(0,0);}}>수정</button><button onClick={()=>void drop(`banners/${key}`)}>삭제</button></div>)}</section></>}
    {tab==="events"&&<AdminEvents events={events} signupLinks={eventLinks} participation={eventParticipation} currentSemester={currentSemester} onMessage={setMessage}/>}
    {tab==="join"&&<section className="modern-panel"><h2>부원 신청 폼</h2><p>이메일 인증을 마친 계정에만 링크가 공개됩니다.</p><form className="modern-form" onSubmit={e=>{e.preventDefault();void save("join",joinLink||null);}}><label>신청 폼 URL<input type="url" value={joinLink} onChange={e=>setJoinLink(e.target.value)} placeholder="https://..."/></label><button>저장</button></form></section>}
    {tab==="members"&&<AdminMembers users={users} roles={roles} profiles={profiles} applicationStatus={applicationStatus} events={events} eventParticipation={eventParticipation} currentSemester={currentSemester} assignments={assignments} games={games} onUpdatePerson={updatePerson} onError={setMessage}/>}
    {tab==="reviews"&&<section className="modern-panel"><h2>검토 대기 리뷰</h2>{Object.entries(submissions).flatMap(([gameKey,items])=>Object.entries(items).map(([uid,item])=><div className="modern-review" key={`${gameKey}-${uid}`}><strong>{games[gameKey]?.title||gameKey} · {item.displayName}</strong><p>{item.body}</p><button onClick={()=>void moderate(gameKey,uid,true)}>승인</button><button onClick={()=>void moderate(gameKey,uid,false)}>반려</button></div>))}</section>}
    </div></div>
  </div>;
}
