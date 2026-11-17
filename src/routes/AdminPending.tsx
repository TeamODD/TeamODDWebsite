import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onValue, ref, update } from "firebase/database";
import { database } from "../firebase";
import type { Game } from "../types/game";
import { getPendingCounts, type PendingPerson, type ReviewSubmissions } from "../utils/adminPending";
import "../styles/ModernPages.css";

export default function AdminPending() {
  const [games, setGames] = useState<Record<string, Game>>({});
  const [users, setUsers] = useState<Record<string, PendingPerson>>({});
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [applicationStatus, setApplicationStatus] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<ReviewSubmissions>({});
  const [message, setMessage] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [visibleMembers, setVisibleMembers] = useState(20);
  const [visibleReviews, setVisibleReviews] = useState(20);

  useEffect(() => {
    const subscriptions = [
      onValue(ref(database, "games"), snapshot => setGames(snapshot.val() || {})),
      onValue(ref(database, "users"), snapshot => setUsers(snapshot.val() || {})),
      onValue(ref(database, "roles"), snapshot => setRoles(snapshot.val() || {})),
      onValue(ref(database, "memberApplicationStatus"), snapshot => setApplicationStatus(snapshot.val() || {})),
      onValue(ref(database, "reviewSubmissions"), snapshot => setReviews(snapshot.val() || {})),
    ];
    return () => subscriptions.forEach(unsubscribe => unsubscribe());
  }, []);

  const pending = getPendingCounts(reviews, users, roles, applicationStatus);
  const memberEntries = Object.entries(users)
    .filter(([uid, person]) => person.registrationIntent === "member" && roles[uid] !== "member" && !applicationStatus[uid])
    .sort(([, a], [, b]) => (a.createdAt || 0) - (b.createdAt || 0));
  const reviewEntries = Object.entries(reviews)
    .flatMap(([gameKey, entries]) => Object.entries(entries || {}).map(([uid, entry]) => ({ gameKey, uid, entry })))
    .sort((a, b) => a.entry.createdAt - b.entry.createdAt);

  const handleMember = async (uid: string, approve: boolean) => {
    setBusyKey(`member-${uid}`);
    try {
      await update(ref(database), {
        [`memberApplicationStatus/${uid}`]: approve ? "approved" : "rejected",
        ...(approve ? { [`roles/${uid}`]: "member" } : {}),
      });
      setMessage(approve ? "부원 계정을 승인했습니다." : "부원 계정 신청을 반려했습니다.");
    } catch {
      setMessage("부원 계정 신청을 처리하지 못했습니다.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleReview = async (gameKey: string, uid: string, approve: boolean) => {
    const entry = reviews[gameKey]?.[uid];
    if (!entry) return;
    setBusyKey(`review-${gameKey}-${uid}`);
    try {
      await update(ref(database), {
        [`reviewSubmissions/${gameKey}/${uid}`]: null,
        ...(approve ? { [`reviews/${gameKey}/${uid}`]: entry } : {}),
      });
      setMessage(approve ? "리뷰를 공개했습니다." : "리뷰를 반려했습니다.");
    } catch {
      setMessage("리뷰를 처리하지 못했습니다.");
    } finally {
      setBusyKey(null);
    }
  };

  return <div className="modern-page admin-modern admin-pending-page">
    <Link className="admin-pending-back" to="/admin">← 대시보드로 돌아가기</Link>
    <header className="modern-page__hero"><h1>처리 대기</h1><p>부원 계정 신청과 리뷰를 확인하고 처리합니다. 현재 {pending.total}건이 남았습니다.</p></header>
    {message && <p className="modern-message" role="status">{message}</p>}
    <section className="modern-panel" aria-labelledby="pending-members-title">
      <h2 id="pending-members-title">부원 계정 신청 <span className="admin-pending-count">{pending.members}건</span></h2>
      {memberEntries.length === 0 ? <p className="admin-pending-empty">대기 중인 신청이 없습니다.</p> : memberEntries.slice(0, visibleMembers).map(([uid, person]) => <article className="admin-pending-item" key={uid}>
        <div><strong>{person.nickname || person.loginId || "이름 없음"}</strong><p>본명 {person.realName || "미등록"} · 아이디 {person.loginId || "미등록"}</p></div>
        <div className="admin-pending-actions"><button type="button" disabled={busyKey !== null} onClick={() => void handleMember(uid, true)}>승인</button><button type="button" disabled={busyKey !== null} onClick={() => void handleMember(uid, false)}>반려</button></div>
      </article>)}
      {memberEntries.length > visibleMembers && <button className="admin-pending-more" type="button" onClick={() => setVisibleMembers(count => count + 20)}>신청 더 보기 ({memberEntries.length - visibleMembers}건 남음)</button>}
    </section>
    <section className="modern-panel" aria-labelledby="pending-reviews-title">
      <h2 id="pending-reviews-title">리뷰 승인 <span className="admin-pending-count">{pending.reviews}건</span></h2>
      {reviewEntries.length === 0 ? <p className="admin-pending-empty">대기 중인 리뷰가 없습니다.</p> : reviewEntries.slice(0, visibleReviews).map(({ gameKey, uid, entry }) => <article className="admin-pending-item" key={`${gameKey}-${uid}`}>
        <div><strong>{games[gameKey]?.title || "프로젝트"} · {entry.displayName}</strong><p className="admin-pending-review-body">{entry.body}</p></div>
        <div className="admin-pending-actions"><button type="button" disabled={busyKey !== null} onClick={() => void handleReview(gameKey, uid, true)}>승인</button><button type="button" disabled={busyKey !== null} onClick={() => void handleReview(gameKey, uid, false)}>반려</button></div>
      </article>)}
      {reviewEntries.length > visibleReviews && <button className="admin-pending-more" type="button" onClick={() => setVisibleReviews(count => count + 20)}>리뷰 더 보기 ({reviewEntries.length - visibleReviews}건 남음)</button>}
    </section>
  </div>;
}
