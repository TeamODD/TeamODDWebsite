import { useEffect, useState, type FormEvent } from "react";
import { get, ref, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { FiArrowLeft, FiCheck, FiUser } from "react-icons/fi";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ADMIN_UID } from "../auth/admin";
import { isVerifiedAccount } from "../auth/isVerifiedAccount";
import Loading from "../components/Loading";
import { auth, database } from "../firebase";
import "../styles/Profile.css";
import "../styles/ModernPages.css";
import { useMemberRole } from "../auth/useMemberRole";
import { useActivityScore } from "../auth/useActivityScore";
import { eventDateLabel, eventPoints } from "../utils/activityScore";
import { memberPart, memberPartTone } from "../utils/memberPart";
import "../styles/MemberPart.css";

const Profile = () => {
  const [user, authLoading] = useAuthState(auth);
  const { role } = useMemberRole();
  const { score: activityScore, currentSemester, events: attendedEvents } = useActivityScore(user?.uid);
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== "#account-info") return;
    const frame = requestAnimationFrame(() => document.getElementById("account-info")?.scrollIntoView({behavior:"smooth"}));
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [part, setPart] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setIsLoading(true);

    get(ref(database, `users/${user.uid}`))
      .then((snapshot) => {
        if (cancelled) return;
        const profile = snapshot.val();
        setNickname(typeof profile?.nickname === "string" ? profile.nickname : user.displayName?.trim() || (user.uid === ADMIN_UID ? "관리자 계정" : ""));
        setRealName(typeof profile?.realName === "string" ? profile.realName : "");
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsError(true);
        setMessage("프로필 정보를 불러오지 못했습니다. 새로고침해 주세요.");
        setIsLoading(false);
      });

    get(ref(database, `memberProfiles/${user.uid}`))
      .then((snapshot) => {
        if (cancelled) return;
        const memberProfile = snapshot.val();
        setPart(typeof memberProfile?.part === "string" ? memberProfile.part.trim() : "");
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [user?.uid, user?.displayName]);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isVerifiedAccount(user)) return <Navigate to="/verify-email" replace />;

  const scoreTone = activityScore === 0 ? "zero" : activityScore >= 3 ? "gold" : "neutral";
  const normalizedPart = memberPart(part);
  const eventGroups = [...new Set(attendedEvents.map(([, event]) => event.semester || "미분류"))]
    .sort((a, b) => a === currentSemester ? -1 : b === currentSemester ? 1 : b.localeCompare(a))
    .map(semester => ({ semester, items: attendedEvents.filter(([, event]) => (event.semester || "미분류") === semester) }));

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isLoading) return;
    const trimmedNickname = nickname.trim();
    const trimmedRealName = realName.trim();
    setIsError(true);
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setMessage("닉네임은 2~20자로 입력해 주세요.");
      return;
    }
    if (trimmedRealName.length < 2 || trimmedRealName.length > 50) {
      setMessage("본명은 2~50자로 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      await update(ref(database, `users/${user.uid}`), {
        nickname: trimmedNickname,
        realName: trimmedRealName,
      });
      setNickname(trimmedNickname);
      setRealName(trimmedRealName);
      setIsError(false);
      setMessage("프로필을 저장했습니다.");
    } catch {
      setIsError(true);
      setMessage("프로필을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <Link className="profile-page__back" to="/home-preview"><FiArrowLeft aria-hidden="true" /> 홈으로 돌아가기</Link>
        <header className="profile-page__heading">
          <span>MY PROFILE</span>
          <h1>프로필 보기</h1>
          <p>사이트에서 사용할 닉네임과 계정 정보를 확인하고 수정할 수 있습니다.</p>
        </header>

        <div className="profile-page__layout">
          <aside className="profile-page__summary" aria-label="현재 프로필">
            <div className="profile-page__avatar">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <FiUser aria-hidden="true" />}
            </div>
            <strong className="profile-page__name">{nickname.trim() || user.displayName || "Team ODD 회원"}</strong>
            <span className={role === "general" ? "profile-page__part" : `profile-page__part member-part-badge member-part-badge--${memberPartTone(normalizedPart)}`}>{role === "general" ? "일반 계정" : normalizedPart}</span>
            {(role === "member" || role === "admin") && <div className="profile-page__stats">
              <span>{currentSemester ? `${currentSemester} 활동 점수` : "활동 점수"}</span>
              <strong className={`profile-page__score profile-page__score--${scoreTone}`}>{activityScore}점</strong>
            </div>}
          </aside>

          <section className="profile-page__editor" aria-labelledby="profile-edit-title">
            <h2 id="profile-edit-title">기본 정보</h2>
            {isLoading ? <p className="profile-page__loading">프로필을 불러오는 중...</p> : (
              <form onSubmit={handleSave}>
                <label htmlFor="profile-nickname">닉네임</label>
                <input id="profile-nickname" name="nickname" autoComplete="nickname" value={nickname}
                  onChange={(event) => { setNickname(event.target.value); setMessage(""); }}
                  minLength={2} maxLength={20} required />
                <p className="profile-page__hint">사이트에 표시되는 이름 · 2~20자</p>

                <label htmlFor="profile-real-name">본명</label>
                <input id="profile-real-name" name="name" autoComplete="name" value={realName}
                  onChange={(event) => { setRealName(event.target.value); setMessage(""); }}
                  minLength={2} maxLength={50} required />
                <p className="profile-page__hint">계정 확인에 사용하는 이름 · 2~50자</p>

                <label htmlFor="profile-email">이메일</label>
                <input id="profile-email" type="email" value={user.email || ""} readOnly />
                <p className="profile-page__hint">이메일 변경은 현재 지원하지 않습니다.</p>

                {message && <p className={isError ? "profile-page__message profile-page__message--error" : "profile-page__message"} role={isError ? "alert" : "status"}>{message}</p>}
                <button className="profile-page__save" type="submit" disabled={isSaving}>
                  <FiCheck aria-hidden="true" /> {isSaving ? "저장 중..." : "변경 사항 저장"}
                </button>
              </form>
            )}
          </section>
        </div>
        {(role === "member" || role === "admin") && <section className="modern-panel profile-page__events"><h2>참여 행사</h2><p>활동 점수는 {currentSemester || "전체 학기"}에 참여한 행사의 점수를 합산해 표시합니다.</p>{eventGroups.length ? eventGroups.map(group => <div className="profile-page__event-group" key={group.semester}><h3>{group.semester}{group.semester === currentSemester && <small>현재 학기</small>}</h3><ul>{group.items.map(([key, event]) => <li key={key}><span>{event.title}<small>{eventDateLabel(event)}</small></span><strong>+{eventPoints(event)}점</strong></li>)}</ul></div>) : <p>아직 참여 기록이 없습니다.</p>}</section>}
        <section id="account-info" className="modern-panel" style={{marginTop:24}}><h2>계정 정보</h2><p>이메일: {user.email || "-"}</p><p>계정 유형: {role === "admin" ? "관리자" : role === "member" ? "승인된 부원" : "일반 계정"}</p><p>이메일 인증: {user.emailVerified ? "완료" : "미완료"}</p></section>
      </div>
    </div>
  );
};

export default Profile;
