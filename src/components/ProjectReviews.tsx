import { useEffect, useState, type FormEvent } from "react";
import { signInAnonymously } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "../firebase";
import { useMemberRole } from "../auth/useMemberRole";
import type { Game } from "../types/game";
import { FiMessageCircle, FiUser } from "react-icons/fi";
import TurnstileChallenge from "./TurnstileChallenge";
import "../styles/ProjectReviewsPreview.css";

type Review = { displayName:string; body:string; createdAt:number };
export default function ProjectReviews({ gameKey, game, preview = false, previewSection = "form" }: { gameKey:string; game:Game; preview?:boolean; previewSection?:"form"|"list" }) {
  const { user, role, loading } = useMemberRole();
  const [reviews,setReviews] = useState<Record<string,Review>>({});
  const [pendingReview,setPendingReview] = useState<Review | null>(null);
  const [body,setBody] = useState("");
  const [avatarUrl,setAvatarUrl] = useState("");
  const [publicAvatars,setPublicAvatars] = useState<Record<string,string>>({});
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [challengeToken,setChallengeToken] = useState("");
  const [challengeKey,setChallengeKey] = useState(0);
  useEffect(() => onValue(ref(database,`reviews/${gameKey}`),s=>setReviews(s.val()||{})),[gameKey]);
  useEffect(() => onValue(ref(database,"publicAvatars"),s=>setPublicAvatars(s.val()||{}),()=>setPublicAvatars({})),[]);
  useEffect(() => {
    setAvatarUrl("");
    if (!user || user.isAnonymous) return;
    return onValue(ref(database, `users/${user.uid}/photoURL`), snapshot => setAvatarUrl(typeof snapshot.val() === "string" ? snapshot.val() : ""), () => setAvatarUrl(""));
  }, [user]);
  useEffect(() => {
    setPendingReview(null);
    if (!user) return;
    return onValue(ref(database,`reviewSubmissions/${gameKey}/${user.uid}`),s=>setPendingReview(s.val() as Review | null),()=>{});
  },[gameKey,user]);
  const publishedReview = user ? reviews[user.uid] : undefined;
  const existing = Boolean(pendingReview || publishedReview);
  useEffect(() => {
    setBody(pendingReview?.body ?? publishedReview?.body ?? "");
  }, [gameKey, user?.uid, pendingReview?.body, publishedReview?.body]);
  const policy = game.reviewPolicy || "off";
  const published = Object.entries(reviews).sort(([,a],[,b]) => b.createdAt - a.createdAt);
  const allowed = !loading && (policy==="everyone" || (policy==="account" && role!=="guest") || (policy==="member" && (role==="member"||role==="admin")));
  const needsChallenge = !user?.emailVerified;
  const submit = async (e:FormEvent) => {
    e.preventDefault(); if (!allowed || busy) return;
    setBusy(true); setMessage("");
    try {
      const account = auth.currentUser || await signInAnonymously(auth).then(result=>result.user);
      if (!account) throw new Error("Authentication unavailable");
      if (needsChallenge && !challengeToken) throw new Error("자동 제출 방지 확인을 완료해 주세요.");
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {Authorization: `Bearer ${await account.getIdToken()}`, "Content-Type": "application/json"},
        body: JSON.stringify({gameKey, body: body.trim(), turnstileToken: challengeToken}),
      });
      if (needsChallenge) { setChallengeToken(""); setChallengeKey(value => value + 1); }
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as {error?: string};
        throw new Error(result.error || "평가를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setMessage(existing ? "평가 수정 내용을 접수했습니다. 운영진 승인 후 반영됩니다." : "평가를 접수했습니다. 운영진 승인 후 공개됩니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "평가를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setBusy(false); }
  };
  if (preview && previewSection === "list") return <section className="project-library__published-reviews" aria-label="공개된 프로젝트 평가"><h2>사용자 평가 <span>{published.length}</span></h2>{published.length ? <div className="project-reviews-preview__layout"><div className="project-reviews-preview__main"><h3>평가 자세히 보기</h3>{published.map(([key,review]) => <article id={`project-review-${key}`} key={key} className="project-reviews-preview__card"><div className="project-reviews-preview__identity"><span className="project-reviews-preview__avatar" aria-hidden="true">{publicAvatars[key] ? <img src={publicAvatars[key]} alt="" /> : <FiUser />}</span><div><strong>{review.displayName}</strong><time dateTime={new Date(review.createdAt).toISOString()}>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</time></div></div><p>{review.body}</p></article>)}</div><aside className="project-reviews-preview__recent" aria-label="최근 평가"><h3>최근 평가</h3>{published.slice(0, 5).map(([key,review]) => <button type="button" key={key} onClick={() => document.getElementById(`project-review-${key}`)?.scrollIntoView({behavior:"smooth",block:"center"})}><strong>{review.displayName}</strong><small>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</small><span>{review.body}</span></button>)}</aside></div> : <p>아직 공개된 평가가 없습니다.</p>}</section>;
  if (preview) return <section className="project-library__reviews" aria-label="프로젝트 평가 작성">
    <h2><FiMessageCircle aria-hidden="true" />{game.title} 평가 {existing ? "수정" : "작성"}</h2>
    <p>{existing ? "작성한 평가를 수정할 수 있습니다. 수정 내용은 운영진 승인 후 반영됩니다." : "프로젝트를 경험한 내용을 남겨주세요. 작성한 평가는 운영진 승인 후 공개됩니다."}</p>
    {allowed && <form onSubmit={submit} className="project-library__review-form project-library__review-form--compose"><div className="project-library__review-avatar" aria-label={user && !user.isAnonymous ? "내 프로필 이미지" : "익명 프로필"}>{avatarUrl || user?.photoURL ? <img src={avatarUrl || user?.photoURL || ""} alt="" /> : <FiUser aria-hidden="true" />}</div><label className="project-library__review-body"><span className="sr-only">평가 내용</span><textarea required minLength={5} maxLength={1000} value={body} onChange={event=>setBody(event.target.value)} placeholder="어떤 점이 인상 깊었는지 적어주세요." /></label>{needsChallenge && <TurnstileChallenge key={challengeKey} onToken={setChallengeToken} />}<button disabled={busy || (existing && body.trim() === (pendingReview?.body ?? publishedReview?.body ?? "").trim())}>{busy?"저장 중...":existing?"평가 수정 요청":"평가 게시"}</button></form>}
    {pendingReview && <p className="project-library__review-notice">{publishedReview ? "이전 평가가 공개 중입니다. 수정 내용은 운영진 승인을 기다리고 있습니다." : "작성한 평가가 운영진 승인을 기다리고 있습니다. 내용은 수정할 수 있습니다."}</p>}
    {!allowed && <p className="project-library__review-notice">{policy==="off"?"현재 이 프로젝트는 평가 작성을 받지 않습니다.":policy==="member"?"승인된 부원만 평가를 작성할 수 있습니다.":"평가를 작성하려면 이메일 인증을 마친 계정으로 로그인해 주세요."}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
  return <section className="modern-panel project-reviews"><h2>평가</h2>
    {Object.values(reviews).length ? Object.values(reviews).sort((a,b)=>b.createdAt-a.createdAt).map((review,index)=><article className="modern-review" key={index}><strong>{review.displayName}</strong><p>{review.body}</p></article>) : <p>아직 공개된 평가가 없습니다.</p>}
    {allowed && <form className="modern-form" onSubmit={submit}><h3>평가 {existing ? "수정" : "작성"}</h3><label>내용<textarea required minLength={5} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)}/></label>{needsChallenge && <TurnstileChallenge key={challengeKey} onToken={setChallengeToken} />}<button disabled={busy || (existing && body.trim() === (pendingReview?.body ?? publishedReview?.body ?? "").trim())}>{busy?"접수 중...":existing?"평가 수정 요청":"운영진에게 평가 보내기"}</button></form>}
    {pendingReview && <p>수정 내용은 운영진 승인 후 반영됩니다.</p>}
    {!allowed && policy!=="off" && <p>{policy==="member"?"승인된 부원만 평가를 작성할 수 있습니다.":"평가를 작성하려면 이메일 인증을 마친 계정으로 로그인해 주세요."}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
