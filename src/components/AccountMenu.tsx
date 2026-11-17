import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { FiInfo, FiLogOut, FiRepeat, FiSettings, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { auth, database } from "../firebase";
import { isVerifiedAccount } from "../auth/isVerifiedAccount";
import { ADMIN_UID } from "../auth/admin";
import "../styles/AccountMenu.css";
import { useMemberRole } from "../auth/useMemberRole";
import { useActivityScore } from "../auth/useActivityScore";
import { memberPart, memberPartTone } from "../utils/memberPart";

const AccountMenu = () => {
  const [user, loading] = useAuthState(auth);
  const { role } = useMemberRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [memberProfile, setMemberProfile] = useState({ part: "" });
  const { score: activityScore, currentSemester } = useActivityScore(user?.uid);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setError("");
  }, [user?.uid]);

  useEffect(() => {
    setProfileNickname("");
    if (!user?.uid) return;
    return onValue(
      ref(database, `users/${user.uid}/nickname`),
      (snapshot) => setProfileNickname(typeof snapshot.val() === "string" ? snapshot.val().trim() : ""),
      () => setProfileNickname(""),
    );
  }, [user?.uid]);

  useEffect(() => {
    setMemberProfile({ part: "" });
    if (!user?.uid) return;
    return onValue(
      ref(database, `memberProfiles/${user.uid}`),
      (snapshot) => {
        const profile = snapshot.val();
        setMemberProfile({
          part: typeof profile?.part === "string" ? profile.part.trim() : "",
        });
      },
      () => setMemberProfile({ part: "" }),
    );
  }, [user?.uid]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setError("");
    try {
      await signOut(auth);
      setIsOpen(false);
      navigate("/home-preview");
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSigningOut(false);
    }
  };
  const handleSwitchAccount = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try { await signOut(auth); setIsOpen(false); navigate("/login"); }
    catch { setError("계정을 변경하지 못했습니다. 다시 시도해 주세요."); }
    finally { setIsSigningOut(false); }
  };

  if (loading) return <div className="account-menu__placeholder" aria-hidden="true" />;

  if (!isVerifiedAccount(user)) {
    return (
      <div className="account-menu__guest">
        <Link className="odd-top-bar-preview__create-account" to="/signup">계정 생성</Link>
        <Link className="odd-top-bar-preview__login" to="/login">로그인</Link>
      </div>
    );
  }

  const displayName = profileNickname || (import.meta.env.DEV && user.uid === ADMIN_UID
    ? "관리자 계정"
    : user.displayName?.trim() || user.email?.split("@")[0] || "Team ODD 회원");
  const part = memberPart(memberProfile.part);
  const scoreTone = activityScore === 0 ? "zero" : activityScore >= 3 ? "gold" : "neutral";

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-menu__trigger"
        type="button"
        aria-label={`${displayName} 계정 메뉴`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="account-menu__avatar">
          {user.photoURL ? <img src={user.photoURL} alt="" /> : <FiUser aria-hidden="true" />}
        </span>
        <span className="account-menu__details">
          <strong>{displayName}</strong>
          {role === "general" ? <small>일반 계정</small> : <small className={`member-part-text--${memberPartTone(part)}`}>{part}</small>}
        </span>
        {(role === "member" || role === "admin") && <span className={`account-menu__score account-menu__score--${scoreTone}`}>
          <small>{currentSemester ? `${currentSemester} 점수` : "활동 점수"}</small>
          <strong>{activityScore}점</strong>
        </span>}
      </button>
      {isOpen && (
        <div className="account-menu__panel" role="menu" aria-label="계정 메뉴">
          <div className="account-menu__identity">
            <strong>{displayName}</strong>
            {user.email && <span>{user.email}</span>}
          </div>
          <button className="account-menu__item" type="button" role="menuitem" onClick={() => { setIsOpen(false); navigate("/profile"); }}>
            <FiUser aria-hidden="true" /> 프로필 보기
          </button>
          <button className="account-menu__item" type="button" role="menuitem" onClick={() => {setIsOpen(false);navigate("/profile#account-info");}}>
            <FiInfo aria-hidden="true" /> 계정 정보
          </button>
          {role === "admin" && (
            <button className="account-menu__item" type="button" role="menuitem" onClick={() => { setIsOpen(false); navigate("/admin"); }}>
              <FiSettings aria-hidden="true" /> 운영 관리
            </button>
          )}
          <button className="account-menu__item" type="button" role="menuitem" onClick={() => void handleSwitchAccount()}>
            <FiRepeat aria-hidden="true" /> 계정 변경
          </button>
          <button className="account-menu__signout" type="button" role="menuitem" onClick={handleSignOut} disabled={isSigningOut}>
            <FiLogOut aria-hidden="true" /> {isSigningOut ? "로그아웃 중..." : "로그아웃"}
          </button>
          {error && <p className="account-menu__error" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
