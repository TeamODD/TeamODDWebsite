import { useEffect, useState, type FormEvent } from "react";
import { signInAnonymously } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { auth, database } from "../firebase";
import { FirebaseError } from "firebase/app";
import { useMemberRole } from "../auth/useMemberRole";
import type { Game } from "../types/game";

type Review = { displayName:string; body:string; createdAt:number };
export default function ProjectReviews({ gameKey, game }: { gameKey:string; game:Game }) {
  const { user, role, loading } = useMemberRole();
  const [reviews,setReviews] = useState<Record<string,Review>>({});
  const [existing,setExisting] = useState(false);
  const [name,setName] = useState("");
  const [body,setBody] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  useEffect(() => onValue(ref(database,`reviews/${gameKey}`),s=>setReviews(s.val()||{})),[gameKey]);
  useEffect(() => {
    setExisting(false);
    if (!user) return;
    return onValue(ref(database,`reviewSubmissions/${gameKey}/${user.uid}`),s=>setExisting(s.exists()),()=>{});
  },[gameKey,user]);
  const policy = game.reviewPolicy || "off";
  const allowed = !loading && (policy==="everyone" || (policy==="account" && role!=="guest") || (policy==="member" && (role==="member"||role==="admin")));
  const submit = async (e:FormEvent) => {
    e.preventDefault(); if (!allowed || busy) return;
    setBusy(true); setMessage("");
    try {
      const account = auth.currentUser || await signInAnonymously(auth).then(result=>result.user);
      if (!account) throw new Error("Authentication unavailable");
      await set(ref(database,`reviewSubmissions/${gameKey}/${account.uid}`),{displayName:name.trim(),body:body.trim(),createdAt:Date.now()});
      setBody(""); setMessage("리뷰를 접수했습니다. 운영진 승인 후 공개됩니다.");
    } catch (error) { setMessage(error instanceof FirebaseError && error.code === "auth/operation-not-allowed" ? "비로그인 리뷰를 사용하려면 Firebase Authentication에서 익명 로그인을 활성화해야 합니다." : "리뷰를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setBusy(false); }
  };
  return <section className="modern-panel project-reviews"><h2>리뷰</h2>
    {Object.values(reviews).length ? Object.values(reviews).sort((a,b)=>b.createdAt-a.createdAt).map((review,index)=><article className="modern-review" key={index}><strong>{review.displayName}</strong><p>{review.body}</p></article>) : <p>아직 공개된 리뷰가 없습니다.</p>}
    {allowed && !existing && <form className="modern-form" onSubmit={submit}><h3>리뷰 작성</h3><label>표시 이름<input required minLength={2} maxLength={30} value={name} onChange={e=>setName(e.target.value)}/></label><label>내용<textarea required minLength={5} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)}/></label><button disabled={busy}>{busy?"접수 중...":"운영진에게 리뷰 보내기"}</button></form>}
    {existing && <p>작성한 리뷰가 운영진 승인을 기다리고 있습니다.</p>}
    {!allowed && policy!=="off" && <p>{policy==="member"?"승인된 부원만 리뷰를 작성할 수 있습니다.":"리뷰를 작성하려면 이메일 인증을 마친 계정으로 로그인해 주세요."}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
