import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { browserSessionPersistence, createUserWithEmailAndPassword, deleteUser, sendEmailVerification, setPersistence, updateProfile, type User } from "firebase/auth";
import { ref, remove, runTransaction, set } from "firebase/database";
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiUser, FiUsers } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { auth, database } from "../firebase";
import { isValidLoginId, loginIdKey, normalizeLoginId } from "../utils/loginId";
import "../styles/Login.css";
import "../styles/Signup.css";

const signupErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message === "login-id-already-in-use") {
    return "이미 사용 중인 아이디입니다.";
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use": return "이미 사용 중인 이메일입니다.";
      case "auth/invalid-email": return "이메일 주소를 확인해 주세요.";
      case "auth/weak-password": return "비밀번호를 더 안전하게 설정해 주세요.";
      case "auth/network-request-failed": return "네트워크 연결을 확인해 주세요.";
      case "auth/too-many-requests": return "잠시 후 다시 시도해 주세요.";
    }
  }
  return "계정 생성에 실패했습니다. 다시 시도해 주세요.";
};

const Signup = () => {
  const [accountType, setAccountType] = useState<"general" | "member" | null>(null);
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || accountType === null) return;
    const normalizedId = normalizeLoginId(loginId);
    const trimmedNickname = nickname.trim();
    const trimmedRealName = realName.trim();
    const trimmedEmail = email.trim();

    if (!isValidLoginId(normalizedId)) {
      setError("아이디는 영문 소문자·숫자·_·-로 4~20자여야 합니다.");
      return;
    }
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setError("닉네임은 2~20자로 입력해 주세요.");
      return;
    }
    if (trimmedRealName.length < 2 || trimmedRealName.length > 50) {
      setError("본명은 2~50자로 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const idRef = ref(database, `loginIds/${loginIdKey(normalizedId)}`);
    let createdUser: User | null = null;
    let claimedId = false;

    try {
      await setPersistence(auth, browserSessionPersistence);
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      createdUser = credential.user;
      const createdUid = createdUser.uid;
      await updateProfile(createdUser, { displayName: trimmedNickname });

      const claim = await runTransaction(
        idRef,
        (current: unknown) => current === null ? createdUid : undefined,
        { applyLocally: false },
      );
      if (!claim.committed) throw new Error("login-id-already-in-use");
      claimedId = true;

      await set(ref(database, `users/${createdUser.uid}`), {
        loginId: normalizedId,
        nickname: trimmedNickname,
        realName: trimmedRealName,
        registrationIntent: accountType,
        createdAt: Date.now(),
      });

      let mailSent = true;
      try {
        auth.languageCode = "ko";
        await sendEmailVerification(createdUser);
      } catch {
        mailSent = false;
      }

      navigate("/verify-email", { replace: true, state: { mailSent } });
    } catch (caughtError) {
      let rollbackFailed = false;
      if (createdUser) {
        try { await remove(ref(database, `users/${createdUser.uid}`)); } catch { rollbackFailed = true; }
        if (claimedId) {
          try { await remove(idRef); } catch { rollbackFailed = true; }
        }
        try { await deleteUser(createdUser); } catch { rollbackFailed = true; }
      }
      setError(rollbackFailed
        ? "계정 설정을 완료하지 못했습니다. 관리자에게 문의해 주세요."
        : signupErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page signup-page">
      <div className="login-page__background" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" disablePictureInPicture>
          <source src={`${import.meta.env.BASE_URL}images/home/home.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}images/home/home.mp4`} type="video/mp4" />
        </video>
      </div>

      <div className="login-shell signup-shell">
        <section className="login-panel" aria-labelledby="signup-title">
          <Link className="login-panel__back" to="/home-preview">
            <FiArrowLeft aria-hidden="true" /> 홈으로 돌아가기
          </Link>
          <div className={`login-panel__content signup-panel__content${accountType === null ? " signup-panel__content--choice" : ""}`}>
            <div className="login-panel__heading signup-panel__heading">
              <h2 id="signup-title">{accountType === null ? "계정 선택" : "계정 생성"}</h2>
              <p>{accountType === null
                ? "Team ODD에서 어떤 계정으로 시작할지 선택해 주세요."
                : accountType === "member"
                  ? "부원 계정을 신청합니다. 부원 권한은 운영진 확인 후 부여됩니다."
                  : "일반 계정으로 가입합니다. 로그인은 이메일로 할 수 있습니다."}</p>
            </div>

            {accountType === null ? (
              <div className="signup-choice" role="group" aria-label="계정 유형 선택">
                <button className="signup-choice__card" type="button" onClick={() => setAccountType("general")}>
                  <FiUser className="signup-choice__icon" aria-hidden="true" />
                  <span className="signup-choice__text">
                    <strong>일반 계정</strong>
                    <small>프로젝트를 둘러보고 댓글에 참여해요.</small>
                  </span>
                  <FiArrowRight className="signup-choice__arrow" aria-hidden="true" />
                </button>
                <button className="signup-choice__card" type="button" onClick={() => setAccountType("member")}>
                  <FiUsers className="signup-choice__icon" aria-hidden="true" />
                  <span className="signup-choice__text">
                    <strong>부원 계정</strong>
                    <small>가입 후 운영진의 부원 확인을 받아요.</small>
                  </span>
                  <FiArrowRight className="signup-choice__arrow" aria-hidden="true" />
                </button>
              </div>
            ) : (
            <>
            <button className="signup-choice__back" type="button" onClick={() => { setAccountType(null); setError(""); }}>
              <FiArrowLeft aria-hidden="true" /> 계정 유형 다시 선택
            </button>
            <form className="login-form signup-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="signup-id">아이디</label>
                <input id="signup-id" type="text" name="username" autoComplete="username"
                  placeholder="아이디 (영문·숫자·_·-, 4~20자)" value={loginId}
                  onChange={(event) => { setLoginId(event.target.value); setError(""); }}
                  minLength={4} maxLength={20} required />
              </div>

              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="signup-nickname">닉네임</label>
                <input id="signup-nickname" type="text" name="nickname" autoComplete="nickname"
                  placeholder="닉네임 (2~20자)" value={nickname}
                  onChange={(event) => { setNickname(event.target.value); setError(""); }}
                  minLength={2} maxLength={20} required />
              </div>

              <div className="login-field signup-form__full">
                <label className="login-field__sr-only" htmlFor="signup-real-name">본명</label>
                <input id="signup-real-name" type="text" name="realName" autoComplete="name"
                  placeholder="본명 (2~50자)" value={realName}
                  onChange={(event) => { setRealName(event.target.value); setError(""); }}
                  minLength={2} maxLength={50} required />
              </div>

              <div className="login-field signup-form__full">
                <label className="login-field__sr-only" htmlFor="signup-email">이메일</label>
                <input id="signup-email" type="email" name="email" autoComplete="email"
                  placeholder="이메일" value={email}
                  onChange={(event) => { setEmail(event.target.value); setError(""); }} required />
              </div>

              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="signup-password">비밀번호</label>
                <div className="login-field__password">
                  <input id="signup-password" type={showPassword ? "text" : "password"}
                    name="password" autoComplete="new-password" placeholder="비밀번호 (8자 이상)"
                    value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }}
                    minLength={8} required />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    aria-pressed={showPassword}>
                    {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-field__sr-only" htmlFor="signup-confirm-password">비밀번호 확인</label>
                <input id="signup-confirm-password" type={showPassword ? "text" : "password"}
                  name="confirmPassword" autoComplete="new-password" placeholder="비밀번호 확인"
                  value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }}
                  required />
              </div>

              {error && <p className="login-form__error" role="alert">{error}</p>}
              <div className="login-form__divider" aria-hidden="true" />
              <button className={`login-form__submit${error ? " login-form__submit--error" : ""}`}
                type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? "계정 생성 중..." : error || "계정 생성"}</span>
                <FiArrowRight aria-hidden="true" />
              </button>
            </form>
            </>
            )}

            <div className="login-panel__signup">
              <span>이미 계정이 있으신가요?</span>
              <Link to="/login">로그인</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;
